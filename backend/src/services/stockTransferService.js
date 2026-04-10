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

module.exports = {
    createTransfer,
    approveTransfer,
    rejectTransfer,
    getSentTransfers,
    getReceivedTransfers
};