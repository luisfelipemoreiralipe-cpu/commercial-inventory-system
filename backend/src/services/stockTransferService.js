const prisma = require('../config/prisma');
const { consumeProduct, addStock } = require('./stockMovementService');

/**
 * 🔐 CRIAR TRANSFERÊNCIA
 * Valida que o usuário pertence ao estabelecimento de ORIGEM.
 */
const createTransfer = async ({
    productId,
    quantity,
    fromEstablishmentId,
    toEstablishmentId,
    userId
}) => {
    const hasOpenAudit = await prisma.stockAudit.findFirst({
        where: {
            establishmentId: fromEstablishmentId,
            status: "OPEN"
        }
    });

    if (hasOpenAudit) {
        throw new Error("Existe uma auditoria em andamento. Não é possível transferir estoque.");
    }

    if (!productId) {
        throw new Error("Produto é obrigatório");
    }

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    if (fromEstablishmentId === toEstablishmentId) {
        throw new Error("Não é possível transferir para o mesmo estabelecimento");
    }

    const [fromEst, toEst] = await Promise.all([
        prisma.establishments.findUnique({ where: { id: fromEstablishmentId } }),
        prisma.establishments.findUnique({ where: { id: toEstablishmentId } })
    ]);

    if (!fromEst || !toEst) {
        throw new Error("Estabelecimento de origem ou destino não encontrado.");
    }

    // 🛡️ SEGURANÇA: Só pode transferir se estiverem na mesma rede (organização)
    if (fromEst.organizationId !== toEst.organizationId) {
        throw new Error("Não é permitido transferir estoque entre organizações diferentes.");
    }

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            establishmentId: fromEstablishmentId
        }
    });

    if (!product) {
        throw new Error("Produto não encontrado ou não pertence ao seu estabelecimento.");
    }

    if (Number(product.quantity) < Number(quantity)) {
        throw new Error("Estoque insuficiente para transferência");
    }

    const transfer = await prisma.stockTransfer.create({
        data: {
            productId,
            quantity: Number(quantity),
            fromEstablishmentId,
            toEstablishmentId,
            createdBy: userId,
            status: "PENDING"
        }
    });

    return transfer;
};

/**
 * 🔐 LISTAR ENVIADAS
 */
const getSentTransfers = async (establishmentId) => {
    return prisma.stockTransfer.findMany({
        where: {
            fromEstablishmentId: establishmentId
        },
        include: {
            product: {
                select: { id: true, name: true, unit: true }
            },
            toEstablishment: {
                select: { id: true, name: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};

/**
 * 🔐 LISTAR RECEBIDAS
 */
const getReceivedTransfers = async (establishmentId) => {
    return prisma.stockTransfer.findMany({
        where: {
            toEstablishmentId: establishmentId
        },
        include: {
            product: {
                select: { id: true, name: true, unit: true }
            },
            fromEstablishment: {
                select: { id: true, name: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};

/**
 * 🔐 APROVAR TRANSFERÊNCIA
 * 🛡️ Valida que o destino (quem aprova) é o estabelecimento do usuário.
 */
const approveTransfer = async (transferId, userId, establishmentId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Buscar transferência filtrando pelo contexto de destino
        const transfer = await tx.stockTransfer.findFirst({
            where: { 
                id: transferId,
                toEstablishmentId: establishmentId // SEGURANÇA: Somente se o destino for eu
            }
        });

        if (!transfer) {
            throw new Error("Transferência não encontrada ou você não tem permissão para aprová-la.");
        }

        if (transfer.status !== "PENDING") {
            throw new Error("Esta transferência já foi processada.");
        }

        const {
            productId,
            quantity,
            fromEstablishmentId,
            toEstablishmentId
        } = transfer;

        // 2️⃣ Buscar produto origem
        const product = await tx.product.findFirst({
            where: {
                id: productId,
                establishmentId: fromEstablishmentId
            }
        });

        if (!product) {
            throw new Error("Produto de origem não encontrado.");
        }

        if (Number(product.quantity) < Number(quantity)) {
            throw new Error("Estoque insuficiente na origem.");
        }

        // 3️⃣ Buscar ou criar produto no destino
        let destinationProduct = await tx.product.findFirst({
            where: {
                name: product.name,
                establishmentId: toEstablishmentId
            }
        });

        if (!destinationProduct) {
            destinationProduct = await tx.product.create({
                data: {
                    name: product.name,
                    unit: product.unit,
                    unitPrice: product.unitPrice,
                    quantity: 0,
                    minQuantity: product.minQuantity,
                    type: product.type,
                    categoryId: product.categoryId,
                    establishmentId: toEstablishmentId
                }
            });
        }

        // BAIXA NO ORIGEM
        await consumeProduct({
            productId,
            quantity,
            establishmentId: fromEstablishmentId,
            reason: "TRANSFER",
            reference: `Transferência para ${toEstablishmentId}`
        }, tx);

        // ENTRADA NO DESTINO
        await addStock({
            productId: destinationProduct.id,
            quantity,
            establishmentId: toEstablishmentId,
            reason: "TRANSFER",
            reference: `Transferência de ${fromEstablishmentId}`
        }, tx);

        return tx.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: "APPROVED",
                approvedBy: userId,
                approvedAt: new Date()
            }
        });
    });
};

/**
 * 🔐 REJEITAR TRANSFERÊNCIA
 */
const rejectTransfer = async (transferId, userId, establishmentId) => {
    const transfer = await prisma.stockTransfer.findFirst({
        where: { 
            id: transferId,
            toEstablishmentId: establishmentId 
        }
    });

    if (!transfer) {
        throw new Error("Transferência não encontrada ou acesso negado.");
    }

    if (transfer.status !== "PENDING") {
        throw new Error("Transferência já processada.");
    }

    return prisma.stockTransfer.update({
        where: { id: transferId },
        data: {
            status: "REJECTED",
            approvedBy: userId,
            approvedAt: new Date()
        }
    });
};

/**
 * 📊 RESUMO DE TRANSFERÊNCIAS POR PERÍODO
 * Retorna totais de quantidade e valor estimado, agrupados por estabelecimento e produto
 */
const getTransferSummary = async (establishmentId, { startDate, endDate }) => {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }

    const createdAtFilter = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

    // Transferências ENVIADAS (aprovadas) no período
    const sent = await prisma.stockTransfer.findMany({
        where: {
            fromEstablishmentId: establishmentId,
            status: "APPROVED",
            ...(createdAtFilter ? { approvedAt: createdAtFilter } : {})
        },
        include: {
            product: {
                select: { id: true, name: true, unit: true, unitPrice: true, currentCost: true, packQuantity: true }
            },
            toEstablishment: {
                select: { id: true, name: true }
            }
        },
        orderBy: { approvedAt: "desc" }
    });

    // Transferências RECEBIDAS (aprovadas) no período
    const received = await prisma.stockTransfer.findMany({
        where: {
            toEstablishmentId: establishmentId,
            status: "APPROVED",
            ...(createdAtFilter ? { approvedAt: createdAtFilter } : {})
        },
        include: {
            product: {
                select: { id: true, name: true, unit: true, unitPrice: true, currentCost: true, packQuantity: true }
            },
            fromEstablishment: {
                select: { id: true, name: true }
            }
        },
        orderBy: { approvedAt: "desc" }
    });

    // Calcula custo unitário base (por ml/g) de um produto
    const getUnitCost = (product) => {
        const cost = Number(product.currentCost || product.unitPrice || 0);
        const pack = product.packQuantity || 1;
        return cost / pack;
    };

    // Agrupa ENVIADAS por estabelecimento destino
    const sentByEstablishment = {};
    let totalSentQty = 0;
    let totalSentValue = 0;

    for (const t of sent) {
        const estName = t.toEstablishment?.name || "Desconhecido";
        const estId = t.toEstablishment?.id || "unknown";
        const unitCost = getUnitCost(t.product);
        const qty = Number(t.quantity);
        const value = unitCost * qty;

        totalSentQty += qty;
        totalSentValue += value;

        if (!sentByEstablishment[estId]) {
            sentByEstablishment[estId] = {
                establishmentId: estId,
                establishmentName: estName,
                totalQuantity: 0,
                totalValue: 0,
                products: []
            };
        }

        sentByEstablishment[estId].totalQuantity += qty;
        sentByEstablishment[estId].totalValue += value;
        sentByEstablishment[estId].products.push({
            productId: t.product.id,
            productName: t.product.name,
            unit: t.product.unit,
            quantity: qty,
            unitCost,
            totalCost: value,
            date: t.approvedAt || t.createdAt
        });
    }

    // Agrupa RECEBIDAS por estabelecimento origem
    const receivedByEstablishment = {};
    let totalReceivedQty = 0;
    let totalReceivedValue = 0;

    for (const t of received) {
        const estName = t.fromEstablishment?.name || "Desconhecido";
        const estId = t.fromEstablishment?.id || "unknown";
        const unitCost = getUnitCost(t.product);
        const qty = Number(t.quantity);
        const value = unitCost * qty;

        totalReceivedQty += qty;
        totalReceivedValue += value;

        if (!receivedByEstablishment[estId]) {
            receivedByEstablishment[estId] = {
                establishmentId: estId,
                establishmentName: estName,
                totalQuantity: 0,
                totalValue: 0,
                products: []
            };
        }

        receivedByEstablishment[estId].totalQuantity += qty;
        receivedByEstablishment[estId].totalValue += value;
        receivedByEstablishment[estId].products.push({
            productId: t.product.id,
            productName: t.product.name,
            unit: t.product.unit,
            quantity: qty,
            unitCost,
            totalCost: value,
            date: t.approvedAt || t.createdAt
        });
    }

    return {
        sent: {
            totalQuantity: totalSentQty,
            totalValue: totalSentValue,
            transferCount: sent.length,
            byEstablishment: Object.values(sentByEstablishment)
        },
        received: {
            totalQuantity: totalReceivedQty,
            totalValue: totalReceivedValue,
            transferCount: received.length,
            byEstablishment: Object.values(receivedByEstablishment)
        }
    };
};

module.exports = {
    createTransfer,
    approveTransfer,
    rejectTransfer,
    getSentTransfers,
    getReceivedTransfers,
    getTransferSummary
};