const prisma = require('../config/prisma');


// =============================
// CRIAR TRANSFERÊNCIA (PENDING)
// =============================


const createTransfer = async ({
    productId,
    quantity,
    fromEstablishmentId,
    toEstablishmentId,
    userId
}) => {

    if (!productId) {
        throw new Error("Produto é obrigatório");
    }

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    if (fromEstablishmentId === toEstablishmentId) {
        throw new Error("Não é possível transferir para o mesmo estabelecimento");
    }

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            establishmentId: fromEstablishmentId
        }
    });

    if (!product) {
        throw new Error("Produto não encontrado");
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
const getSentTransfers = async (establishmentId) => {

    return prisma.stockTransfer.findMany({

        where: {
            fromEstablishmentId: establishmentId
        },

        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    unit: true
                }
            },

            toEstablishment: {
                select: {
                    id: true,
                    nome_fantasia: true
                }
            }

        },

        orderBy: {
            createdAt: "desc"
        }

    });



};

const getReceivedTransfers = async (establishmentId) => {

    return prisma.stockTransfer.findMany({

        where: {
            toEstablishmentId: establishmentId
        },

        include: {

            product: {
                select: {
                    id: true,
                    name: true,
                    unit: true
                }
            },

            fromEstablishment: {
                select: {
                    id: true,
                    nome_fantasia: true
                }
            }

        },

        orderBy: {
            createdAt: "desc"
        }

    });

};
// =============================
// APROVAR TRANSFERÊNCIA
// =============================


const approveTransfer = async (transferId, userId) => {

    if (!transferId) {
        throw new Error("Transferência inválida");
    }

    return prisma.$transaction(async (tx) => {

        // 1️⃣ Buscar transferência
        const transfer = await tx.stockTransfer.findUnique({
            where: { id: transferId }
        });

        if (!transfer) {
            throw new Error("Transferência não encontrada");
        }

        if (transfer.status !== "PENDING") {
            throw new Error("Transferência já processada");
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
            throw new Error("Produto não encontrado no estabelecimento de origem");
        }

        if (Number(product.quantity) < Number(quantity)) {
            throw new Error("Estoque insuficiente para transferência");
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

        // 4️⃣ Atualizar estoque origem
        const newOriginQuantity = Number(product.quantity) - Number(quantity);

        await tx.product.update({
            where: { id: product.id },
            data: {
                quantity: newOriginQuantity
            }
        });

        // 5️⃣ Atualizar estoque destino
        const newDestinationQuantity =
            Number(destinationProduct.quantity) + Number(quantity);

        await tx.product.update({
            where: { id: destinationProduct.id },
            data: {
                quantity: newDestinationQuantity
            }
        });

        // 6️⃣ Movimentação OUT
        await tx.stockMovement.create({
            data: {
                productId: product.id,
                productName: product.name,
                type: "OUT",
                quantity,
                previousQuantity: product.quantity,
                newQuantity: newOriginQuantity,
                reference: `Transferência aprovada para ${toEstablishmentId}`,
                reason: "TRANSFER"
            }
        });

        // 7️⃣ Movimentação IN
        await tx.stockMovement.create({
            data: {
                productId: destinationProduct.id,
                productName: destinationProduct.name,
                type: "IN",
                quantity,
                previousQuantity: destinationProduct.quantity,
                newQuantity: newDestinationQuantity,
                reference: `Transferência recebida de ${fromEstablishmentId}`,
                reason: "TRANSFER"
            }
        });

        // 8️⃣ Atualizar status da transferência
        const updatedTransfer = await tx.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: "APPROVED",
                approvedBy: userId,
                approvedAt: new Date()
            }
        });

        return updatedTransfer;

    });

};


// =============================
// REJEITAR TRANSFERÊNCIA
// =============================
const rejectTransfer = async (transferId, userId) => {

    if (!transferId) {
        throw new Error("Transferência inválida");
    }

    const transfer = await prisma.stockTransfer.findUnique({
        where: { id: transferId }
    });

    if (!transfer) {
        throw new Error("Transferência não encontrada");
    }

    if (transfer.status !== "PENDING") {
        throw new Error("Transferência já processada");
    }

    const updatedTransfer = await prisma.stockTransfer.update({
        where: { id: transferId },
        data: {
            status: "REJECTED",
            approvedBy: userId,
            approvedAt: new Date()
        }
    });

    return updatedTransfer;

};


module.exports = {
    createTransfer,
    approveTransfer,
    rejectTransfer,
    getSentTransfers,
    getReceivedTransfers
};