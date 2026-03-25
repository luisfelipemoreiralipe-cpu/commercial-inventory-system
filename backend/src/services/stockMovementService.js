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

        // 🔎 Buscar produto
        const product = await tx.product.findFirst({
            where: {
                id: productId,
                establishmentId
            }
        });

        if (!product) {
            throw new Error("Produto não encontrado");
        }

        // 🟢 CASO 1: INVENTORY (igual já funciona)
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
                    reference: "CONSUMO INTERNO",
                    reason: "INTERNAL_USE",
                    establishmentId
                }
            });

            return;
        }

        // 🔴 CASO 2: PRODUCTION (NOVO)

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

        // 🔥 1. VALIDAR TODOS OS INGREDIENTES
        for (const item of recipe.items) {

            const totalNeeded = Number(item.quantity) * Number(quantity);

            if (Number(item.product.quantity) < totalNeeded) {
                throw new Error(
                    `Estoque insuficiente para ${item.product.name}`
                );
            }
        }

        // 🔥 2. BAIXAR INGREDIENTES
        for (const item of recipe.items) {

            const ingredient = item.product;

            const totalNeeded = Number(item.quantity) * Number(quantity);
            const newQuantity = Number(ingredient.quantity) - totalNeeded;

            await tx.product.update({
                where: { id: ingredient.id },
                data: {
                    quantity: newQuantity
                }
            });

            await tx.stockMovement.create({
                data: {
                    productId: ingredient.id,
                    productName: ingredient.name,
                    type: "OUT",
                    quantity: totalNeeded,
                    previousQuantity: ingredient.quantity,
                    newQuantity,
                    reference: `CONSUMO INTERNO - ${product.name}`,
                    reason: "INTERNAL_USE",
                    establishmentId
                }
            });

        }

    });

};

// 👇 EXPORTAR TUDO
module.exports = {
    getMovements,
    createInternalUse
};