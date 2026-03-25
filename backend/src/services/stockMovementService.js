const prisma = require('../config/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');

// 🔍 CONSULTA
const getMovements = (filters) => stockMovementRepo.findAll(filters);

// 🔥 FUNÇÃO CENTRAL DE CONSUMO (NOVA)
const consumeProduct = async ({
    productId,
    quantity,
    establishmentId,
    reason,
    reference
}, tx) => {

    const product = await tx.product.findFirst({
        where: {
            id: productId,
            establishmentId
        }
    });

    if (!product) {
        throw new Error("Produto não encontrado");
    }

    // 🟢 INVENTORY
    if (product.type === "INVENTORY") {

        if (Number(product.quantity) < Number(quantity)) {
            throw new Error("Estoque insuficiente");
        }

        const newQuantity = Number(product.quantity) - Number(quantity);

        await tx.product.update({
            where: { id: product.id },
            data: { quantity: newQuantity }
        });

        await tx.stockMovement.create({
            data: {
                productId: product.id,
                productName: product.name,
                type: "OUT",
                quantity,
                previousQuantity: product.quantity,
                newQuantity,
                reference,
                reason,
                establishmentId
            }
        });

        return;
    }

    // 🔴 PRODUCTION
    const recipe = await tx.recipe.findFirst({
        where: {
            productId: product.id,
            establishmentId
        },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!recipe) {
        throw new Error("Produto de produção sem receita");
    }

    // validar ingredientes
    for (const item of recipe.items) {
        const totalNeeded = Number(item.quantity) * Number(quantity);

        if (Number(item.product.quantity) < totalNeeded) {
            throw new Error(
                `Estoque insuficiente para ${item.product.name}`
            );
        }
    }

    // baixar ingredientes
    for (const item of recipe.items) {

        const ingredient = item.product;
        const totalNeeded = Number(item.quantity) * Number(quantity);
        const newQuantity = Number(ingredient.quantity) - totalNeeded;

        await tx.product.update({
            where: { id: ingredient.id },
            data: { quantity: newQuantity }
        });

        await tx.stockMovement.create({
            data: {
                productId: ingredient.id,
                productName: ingredient.name,
                type: "OUT",
                quantity: totalNeeded,
                previousQuantity: ingredient.quantity,
                newQuantity,
                reference,
                reason,
                establishmentId
            }
        });

    }

};

// 🔥 CONSUMO INTERNO (AGORA LIMPO)
const createInternalUse = async ({
    productId,
    quantity,
    establishmentId,
    userId
}) => {

    const openAudit = await prisma.stockAudit.findFirst({
        where: {
            establishmentId,
            status: "OPEN"
        }
    });

    if (openAudit) {
        throw new Error("Auditoria em andamento");
    }

    if (!productId) {
        throw new Error("Produto é obrigatório");
    }

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    return prisma.$transaction(async (tx) => {

        await consumeProduct({
            productId,
            quantity,
            establishmentId,
            reason: "INTERNAL_USE",
            reference: "CONSUMO INTERNO"
        }, tx);

    });

};

// 👇 EXPORTAR
module.exports = {
    getMovements,
    createInternalUse,
    consumeProduct // 👈 importante para usar depois no CSV
};