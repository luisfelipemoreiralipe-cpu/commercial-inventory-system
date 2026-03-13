const prisma = require('../config/prisma');

const transferStock = async ({
    productId,
    quantity,
    fromEstablishmentId,
    toEstablishmentId,
    userId
}) => {

    return prisma.$transaction(async (tx) => {

        // 1️⃣ Buscar produto origem
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

        // 2️⃣ Buscar ou criar produto no destino
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

        // 3️⃣ Criar registro de transferência
        const transfer = await tx.stockTransfer.create({
            data: {
                productId,
                quantity,
                fromEstablishmentId,
                toEstablishmentId,
                createdBy: userId
            }
        });

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
                reference: `Transferência para estabelecimento ${toEstablishmentId}`
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
                reference: `Transferência recebida de ${fromEstablishmentId}`
            }
        });

        return transfer;
    });

};

module.exports = {
    transferStock
};