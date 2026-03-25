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
        const establishmentId = req.user?.establishmentId;
        const userId = req.user?.id;

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
        console.error(error);
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

                const difference =
                    Number(item.countedQuantity) - Number(item.systemQuantity);

                await tx.stockAuditItem.update({
                    where: { id: item.id },
                    data: {
                        countedQuantity: Number(item.countedQuantity),
                        difference
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
                where: { auditId: id }
            });

            for (const item of items) {

                if (Number(item.difference) === 0) continue;

                // 🔴 PERDA (LOSS)
                if (Number(item.difference) < 0) {
                    await consumeProduct({
                        productId: item.productId,
                        quantity: Math.abs(item.difference),
                        establishmentId: req.user.establishmentId,
                        reason: "LOSS",
                        reference: "STOCK_AUDIT"
                    }, tx);
                }

                // 🟢 SOBRA (AJUSTE POSITIVO)
                if (Number(item.difference) > 0) {
                    await addStock({
                        productId: item.productId,
                        quantity: item.difference,
                        establishmentId: req.user.establishmentId,
                        reason: "AUDIT",
                        reference: "STOCK_AUDIT"
                    }, tx);
                }

            }

            await tx.stockAudit.update({
                where: { id },
                data: { status: "CLOSED" }
            });

        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao finalizar auditoria" });
    }
};