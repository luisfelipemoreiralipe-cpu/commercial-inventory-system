const { PrismaClient } = require("@prisma/client");
const { consumeProduct, addStock } = require('../services/stockMovementService');

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

            for (const item of items) {

                const dbItem = await tx.stockAuditItem.findUnique({
                    where: { id: item.id },
                    include: { product: true }
                });

                if (!dbItem) continue;

                const rawCounted = Number(item.countedQuantity || 0);
                // 🛡️ USAR systemQuantity do BANCO (seguro), não do frontend
                const difference = rawCounted - Number(dbItem.systemQuantity);

                console.log(`[AUDIT] ${dbItem.product?.name}: sistema=${dbItem.systemQuantity}, contado=${rawCounted}, diff=${difference}`);

                await tx.stockAuditItem.update({
                    where: { id: item.id },
                    data: {
                        countedQuantity: rawCounted,
                        difference: Number(difference.toFixed(4))
                    }
                });

            }

        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
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

        const audit = await prisma.stockAudit.findUnique({
            where: { id }
        });

        if (!audit) {
            return res.status(404).json({ error: "Auditoria não encontrada" });
        }

        if (audit.status === "CLOSED") {
            return res.status(400).json({ error: "Auditoria já finalizada" });
        }

        await prisma.$transaction(async (tx) => {

            const items = await tx.stockAuditItem.findMany({
                where: { auditId: id },
                include: { product: { select: { name: true } } }
            });

            console.log(`[AUDIT FINISH] Processando ${items.length} itens da auditoria ${id}`);

            for (const item of items) {
                const diff = Number(item.difference);
                console.log(`[AUDIT FINISH] ${item.product?.name}: contado=${item.countedQuantity}, sistema=${item.systemQuantity}, diff=${diff}`);

                if (diff === 0) continue;

                // 🔴 PERDA (LOSS)
                if (diff < 0) {
                    console.log(`[AUDIT FINISH] >> LOSS: baixando ${Math.abs(diff)} de ${item.product?.name}`);
                    await consumeProduct({
                        productId: item.productId,
                        quantity: Math.abs(diff),
                        establishmentId: req.user.establishmentId,
                        reason: "LOSS",
                        reference: "STOCK_AUDIT"
                    }, tx);
                }

                // 🟢 SOBRA (AJUSTE POSITIVO)
                if (diff > 0) {
                    console.log(`[AUDIT FINISH] >> GAIN: adicionando ${diff} a ${item.product?.name}`);
                    await addStock({
                        productId: item.productId,
                        quantity: diff,
                        establishmentId: req.user.establishmentId,
                        reason: "GAIN",
                        reference: "STOCK_AUDIT"
                    }, tx);
                }

            }

            await tx.stockAudit.update({
                where: { id },
                data: { status: "CLOSED" }
            });

            console.log(`[AUDIT FINISH] Auditoria ${id} finalizada com sucesso.`);

        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao finalizar auditoria" });
    }
};