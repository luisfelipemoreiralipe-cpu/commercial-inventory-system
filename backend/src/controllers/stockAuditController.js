const { PrismaClient } = require("@prisma/client");
const { consumeProduct, addStock, getProductCostOutsideTx } = require('../services/stockMovementService');

const prisma = new PrismaClient();

/*
====================================================
LISTAR AUDITORIAS ABERTAS
====================================================
*/
exports.list = async (req, res) => {
    try {
        const establishmentId = req.user.establishmentId;

        const audits = await prisma.stockAudit.findMany({
            where: {
                establishmentId,
                status: "OPEN"
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json(audits);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar auditorias" });
    }
};

/*
====================================================
CRIAR AUDITORIA
====================================================
*/
exports.create = async (req, res) => {
    try {
        console.log("DADOS DO TOKEN (AUDITORIA):", req.user); // 👈 Log para segurança

        const establishmentId = req.user?.establishmentId;
        // 👈 A MÁGICA: Procuramos o ID em todas as chaves possíveis
        const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;

        // 👈 TRAVA DE SEGURANÇA: Se não achar o usuário, avisa o front em vez de quebrar o banco
        if (!userId) {
            return res.status(400).json({
                error: "ID do usuário não encontrado na sessão. Faça login novamente."
            });
        }

        const existingAudit = await prisma.stockAudit.findFirst({
            where: {
                establishmentId,
                status: "OPEN"
            }
        });

        if (existingAudit) {
            return res.status(400).json({
                error: "Já existe uma auditoria aberta."
            });
        }

        const audit = await prisma.stockAudit.create({
            data: {
                establishment: { connect: { id: establishmentId } },
                user: { connect: { id: userId } },
                status: "OPEN"
            }
        });

        const products = await prisma.product.findMany({
            where: {
                establishmentId,
                type: "INVENTORY" // 🔥 FILTRO AQUI
            },
            select: {
                id: true,
                quantity: true
            }
        });

        const items = products.map(product => ({
            auditId: audit.id,
            productId: product.id,
            systemQuantity: Number(product.quantity || 0),
            countedQuantity: 0,
            difference: 0
        }));

        if (items.length > 0) {
            await prisma.stockAuditItem.createMany({ data: items });
        }

        res.json(audit);

    } catch (error) {
        console.error("ERRO AO CRIAR AUDITORIA:", error);
        res.status(500).json({ error: "Erro ao criar auditoria" });
    }
};
/*
====================================================
BUSCAR AUDITORIA
====================================================
*/
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const audit = await prisma.stockAudit.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!audit) {
            return res.status(404).json({
                error: "Auditoria não encontrada"
            });
        }

        // 🔥 ATUALIZAÇÃO DINÂMICA: Se a auditoria estiver aberta, 
        // mostra o saldo atualizado e recalcula a divergência instantaneamente
        if (audit.status === "OPEN") {
            audit.items = audit.items.map(item => {
                const currentSysQty = Number(item.product.quantity || 0);
                return {
                    ...item,
                    systemQuantity: currentSysQty,
                    difference: Number(item.countedQuantity || 0) - currentSysQty
                };
            });
        }

        res.json(audit);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar auditoria" });
    }
};

/*
====================================================
HISTÓRICO
====================================================
*/
exports.history = async (req, res) => {
    try {
        const establishmentId = req.user.establishmentId;

        const audits = await prisma.stockAudit.findMany({
            where: {
                establishmentId,
                status: "CLOSED"
            },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const auditsWithImpact = audits.map(audit => {
            let totalImpact = 0;

            audit.items.forEach(item => {
                const cost =
                    Number(item.product?.currentCost) ||
                    Number(item.product?.unitPrice) ||
                    0;

                totalImpact += Number(item.difference) * cost;
            });

            return {
                ...audit,
                financialImpact: totalImpact
            };
        });

        res.json(auditsWithImpact);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar histórico" });
    }
};

/*
====================================================
SALVAR CONTAGEM
====================================================
*/
exports.updateItems = async (req, res) => {
    try {
        const items = req.body;

        await prisma.$transaction(async (tx) => {

            const audit = await tx.stockAudit.findFirst({
                where: {
                    establishmentId: req.user.establishmentId,
                    status: "OPEN"
                }
            });

            if (!audit) {
                throw new Error("Nenhuma auditoria aberta");
            }

            // OTIMIZAÇÃO: Buscar todos os itens do banco em uma única query
            // Isso evita o problema de N+1 queries que causa lentidão
            const itemIds = items.map(i => i.id).filter(Boolean);
            if (itemIds.length === 0) return;

            const dbItems = await tx.stockAuditItem.findMany({
                where: { id: { in: itemIds } },
                include: { product: true }
            });
            const dbItemsMap = new Map(dbItems.map(i => [i.id, i]));

            for (const item of items) {
                const dbItem = dbItemsMap.get(item.id);

                if (!dbItem) continue;

                const rawCounted = Number(item.countedQuantity || 0);
                
                // 🔥 USAR SALDO REAL (ATUAL) do produto para que transferências em paralelo
                // não corrompam o estoque, ignorando a 'foto' original do banco.
                const currentSysQty = Number(dbItem.product.quantity || 0);
                const difference = rawCounted - currentSysQty;

                await tx.stockAuditItem.update({
                    where: { id: item.id },
                    data: {
                        countedQuantity: rawCounted,
                        systemQuantity: currentSysQty, // Atualiza a foto
                        difference: Number(difference.toFixed(4))
                    }
                });
            }

        }, {
            maxWait: 10000,  // Aumentado o tempo de espera de conexão
            timeout: 60000   // Aumentado o timeout da transação para 60 segundos
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Erro no updateItems:", error);
        res.status(500).json({ error: "Erro ao salvar contagem" });
    }
};


/*
====================================================
FINALIZAR AUDITORIA
====================================================
*/
exports.finish = async (req, res) => {
    try {
        const { id } = req.params;
        const establishmentId = req.user.establishmentId;

        const audit = await prisma.stockAudit.findUnique({
            where: { id }
        });

        if (!audit) {
            return res.status(404).json({ error: "Auditoria não encontrada" });
        }

        if (audit.status === "CLOSED") {
            return res.status(400).json({ error: "Auditoria já finalizada" });
        }

        // ─────────────────────────────────────────────────────────────────
        // ETAPA 1 (FORA DA TRANSAÇÃO): buscar itens e pré-carregar custos
        // Isso evita o erro P2028 (timeout) causado por múltiplas queries
        // de custo aninhadas dentro de uma transação longa.
        // ─────────────────────────────────────────────────────────────────
        const items = await prisma.stockAuditItem.findMany({
            where: { auditId: id },
            include: { product: { select: { name: true } } }
        });

        console.log(`[AUDIT FINISH] Pré-carregando custos para ${items.length} itens (fora da tx)...`);

        // Pré-carregar custo de cada produto que terá diferença
        const itemsWithCost = await Promise.all(
            items.map(async (item) => {
                const diff = Number(item.difference);
                if (diff === 0) return { ...item, preloadedCost: 0 };
                const preloadedCost = await getProductCostOutsideTx(item.productId, establishmentId);
                return { ...item, preloadedCost };
            })
        );

        console.log(`[AUDIT FINISH] Custos pré-carregados. Iniciando transação...`);

        // ─────────────────────────────────────────────────────────────────
        // ETAPA 2 (DENTRO DA TRANSAÇÃO): apenas escrita no banco
        // Sem queries de custo — apenas updates e inserts.
        // ─────────────────────────────────────────────────────────────────
        await prisma.$transaction(async (tx) => {

            for (const item of itemsWithCost) {
                const diff = Number(item.difference);
                console.log(`[AUDIT FINISH] ${item.product?.name}: contado=${item.countedQuantity}, sistema=${item.systemQuantity}, diff=${diff}`);

                if (diff === 0) continue;

                // 🔴 PERDA (LOSS)
                if (diff < 0) {
                    console.log(`[AUDIT FINISH] >> LOSS: baixando ${Math.abs(diff)} de ${item.product?.name} (custo: ${item.preloadedCost})`);
                    await consumeProduct({
                        productId: item.productId,
                        quantity: Math.abs(diff),
                        establishmentId,
                        reason: "LOSS",
                        reference: "STOCK_AUDIT",
                        preloadedCost: item.preloadedCost
                    }, tx);
                }

                // 🟢 SOBRA (AJUSTE POSITIVO)
                if (diff > 0) {
                    console.log(`[AUDIT FINISH] >> GAIN: adicionando ${diff} a ${item.product?.name} (custo: ${item.preloadedCost})`);
                    await addStock({
                        productId: item.productId,
                        quantity: diff,
                        establishmentId,
                        reason: "GAIN",
                        reference: "STOCK_AUDIT",
                        unitCost: item.preloadedCost
                    }, tx);
                }
            }

            await tx.stockAudit.update({
                where: { id },
                data: { status: "CLOSED" }
            });

            console.log(`[AUDIT FINISH] Auditoria ${id} finalizada com sucesso.`);

        }, {
            maxWait: 15000,
            timeout: 60000 // Reduzido para 60s pois a tx agora só faz escritas
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Erro ao finalizar auditoria:", error);
        res.status(500).json({ error: "Erro ao finalizar auditoria" });
    }
};