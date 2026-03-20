const prisma = require('../config/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');

// 🔍 CONSULTA (já existia)
const getMovements = (filters) => stockMovementRepo.findAll(filters);

// 🔥 NOVO: CONSUMO INTERNO
const createInternalUse = async ({
    productId,
    quantity,
    establishmentId,
    userId
}) => {

    if (!productId) {
        throw new Error("Produto é obrigatório");
    }

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    // 1️⃣ buscar produto
    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            establishmentId
        }
    });

    if (!product) {
        throw new Error("Produto não encontrado");
    }

    // 2️⃣ validar estoque
    if (Number(product.quantity) < Number(quantity)) {
        throw new Error("Estoque insuficiente");
    }

    // 3️⃣ calcular novo estoque
    const newQuantity = Number(product.quantity) - Number(quantity);

    // 4️⃣ atualizar estoque
    await prisma.product.update({
        where: { id: product.id },
        data: {
            quantity: newQuantity
        }
    });

    // 5️⃣ registrar movimentação
    await prisma.stockMovement.create({
        data: {
            product: {
                connect: { id: product.id }
            },
            productName: product.name,
            type: "OUT",
            quantity,
            previousQuantity: product.quantity,
            newQuantity,
            reference: "CONSUMO INTERNO",
            reason: "INTERNAL_USE",
        }
    });

};

// 👇 EXPORTAR TUDO
module.exports = {
    getMovements,
    createInternalUse
};