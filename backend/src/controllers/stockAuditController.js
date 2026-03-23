const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/*
====================================================
LISTAR AUDITORIAS ABERTAS
GET /stock-audits
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

        res.status(500).json({
            error: "Erro ao buscar auditorias"
        });

    }

};


/*
====================================================
CRIAR AUDITORIA
POST /stock-audits
====================================================
*/
exports.create = async (req, res) => {

    try {

        console.log("REQ.USER:", req.user);

        const establishmentId = req.user?.establishmentId;

        const userId = req.user?.id;
        console.log("REQ.USER:", req.user);


        // 🚨 impedir duas auditorias abertas no mesmo setor
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

                establishment: {
                    connect: { id: establishmentId }
                },
                user: {
                    connect: { id: userId }
                },
                status: "OPEN"
            }
        });

        const products = await prisma.product.findMany({
            where: {

                establishmentId
            },
            select: {
                id: true,
                quantity: true
            }
        });

        const items = products.map(product => ({
            auditId: audit.id,
            productId: product.id,

            // snapshot do estoque
            systemQuantity: Number(product.quantity || 0),

            countedQuantity: 0,
            difference: 0
        }));

        if (items.length > 0) {

            await prisma.stockAuditItem.createMany({
                data: items
            });

        }

        res.json(audit);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao criar auditoria"
        });

    }

};


/*
====================================================
BUSCAR AUDITORIA
GET /stock-audits/:id
====================================================
*/
exports.getById = async (req, res) => {

    try {

        const { id } = req.params;

        const audit = await prisma.stockAudit.findUnique({
            where: {
                id
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
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

        res.status(500).json({
            error: "Erro ao buscar auditoria"
        });

    }

};


/*
====================================================
HISTÓRICO DE AUDITORIAS
GET /stock-audits/history
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
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // calcular impacto financeiro
        const auditsWithImpact = audits.map(audit => {

            let totalImpact = 0;

            audit.items.forEach(item => {

                const cost =
                    Number(item.product?.currentCost) ||
                    Number(item.product?.unitPrice) ||
                    0;

                const diff = Number(item.difference || 0)

                totalImpact += diff * cost

            })

            return {
                ...audit,
                financialImpact: totalImpact
            }

        })

        res.json(auditsWithImpact);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao buscar histórico de auditorias"
        });

    }

};


/*
====================================================
ATUALIZAR CONTAGEM
PATCH /stock-audits/:id/items
====================================================
*/
exports.updateItems = async (req, res) => {

    try {

        const { items } = req.body;

        await prisma.$transaction(async (tx) => {

            for (const item of audit.items) {

                if (item.difference !== 0) {

                    const product = await tx.product.findUnique({
                        where: { id: item.productId }
                    });

                    const newQuantity =
                        Number(product.quantity) + Number(item.difference);

                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: newQuantity }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            productName: product.name,
                            type: "ADJUSTMENT",
                            quantity: item.difference,
                            previousQuantity: product.quantity,
                            newQuantity,
                            reference: "STOCK_AUDIT",
                            reason: "AUDIT"
                        }
                    });

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

        res.status(500).json({
            error: "Erro ao atualizar contagem"
        });

    }

};


/*
====================================================
FINALIZAR AUDITORIA
PATCH /stock-audits/:id/finish
====================================================
*/
exports.finish = async (req, res) => {

    try {

        const { id } = req.params;

        const audit = await prisma.stockAudit.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!audit) {
            return res.status(404).json({
                error: "Auditoria não encontrada"
            });
        }

        // impedir finalizar duas vezes
        if (audit.status === "CLOSED") {
            return res.status(400).json({
                error: "Auditoria já foi finalizada"
            });
        }

        for (const item of audit.items) {

            if (item.difference !== 0) {

                const product = await prisma.product.findUnique({
                    where: { id: item.productId }
                });

                const newQuantity =
                    Number(product.quantity) + Number(item.difference);

                await prisma.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        quantity: newQuantity
                    }
                });

                await prisma.stockMovement.create({
                    data: {
                        product: {
                            connect: { id: item.productId }
                        },
                        productName: product.name,
                        type: "ADJUSTMENT",
                        quantity: item.difference,
                        previousQuantity: product.quantity,
                        newQuantity,
                        reference: "STOCK_AUDIT",
                        reason: "AUDIT"
                    }
                });

            }

        }

        await prisma.stockAudit.update({
            where: { id },
            data: {
                status: "CLOSED"
            }
        });

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao finalizar auditoria"
        });

    }

};