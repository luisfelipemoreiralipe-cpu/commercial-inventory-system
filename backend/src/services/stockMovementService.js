const prisma = require('../config/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');

// 🔍 CONSULTA
const getMovements = (filters) => stockMovementRepo.findAll(filters);

// 🔥 FUNÇÃO CENTRAL DE CONSUMO (BLINDADA)
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

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    // 🟢 INVENTORY
    if (product.type === "INVENTORY") {

        if (Number(product.quantity) < Number(quantity)) {
            throw new Error(`Estoque insuficiente para ${product.name}`);
        }

        const previousQuantity = Number(product.quantity);
        const newQuantity = previousQuantity - Number(quantity);

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
                previousQuantity,
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

    // 🔒 VALIDAR TODOS OS INGREDIENTES
    const { convertToBaseUnit } = require('../utils/unitConverter');

    for (const item of recipe.items) {

        const totalNeededRaw = Number(item.quantity) * Number(quantity);

        const totalNeeded = convertToBaseUnit(
            totalNeededRaw,
            item.product.unit
        );

        if (Number(item.product.quantity) < totalNeeded) {
            throw new Error(
                `Estoque insuficiente para ${item.product.name}`
            );
        }
    }

    // 🔥 BAIXAR INGREDIENTES
    for (const item of recipe.items) {

        const ingredient = item.product;

        const totalNeededRaw = Number(item.quantity) * Number(quantity);

        const totalNeeded = convertToBaseUnit(
            totalNeededRaw,
            ingredient.unit
        );

        const previousQuantity = Number(ingredient.quantity);
        const newQuantity = previousQuantity - totalNeeded;

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
                previousQuantity,
                newQuantity,
                reference,
                reason,
                establishmentId
            }
        });

    }

};

// 🔥 NOVO: FUNÇÃO DE ENTRADA DE ESTOQUE (SEM QUEBRAR NADA)
const addStock = async ({
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

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    const previousQuantity = Number(product.quantity);
    const newQuantity = previousQuantity + Number(quantity);

    await tx.product.update({
        where: { id: product.id },
        data: { quantity: newQuantity }
    });

    // 🔥 DEFINIÇÃO INTELIGENTE DO TIPO
    let movementType = "PURCHASE";

    if (reason === "BONUS") {
        movementType = "BONUS";
    }

    await tx.stockMovement.create({
        data: {
            productId: product.id,
            productName: product.name,
            type: movementType,
            quantity,
            previousQuantity,
            newQuantity,
            reference,
            reason,
            establishmentId
        }
    });

};

const addBonus = async ({
    productId,
    quantity,
    establishmentId
}) => {

    if (!productId) {
        throw new Error("Produto é obrigatório");
    }

    if (!quantity || quantity <= 0) {
        throw new Error("Quantidade inválida");
    }

    return prisma.$transaction(async (tx) => {

        await addStock({
            productId,
            quantity,
            establishmentId,
            reason: "BONUS",
            reference: "BONIFICAÇÃO"
        }, tx);

    });

};

// 🔥 CONSUMO INTERNO (SEM ALTERAÇÃO DE REGRA)
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

// 👇 EXPORTAR (SEM QUEBRAR NADA)
module.exports = {
    getMovements,
    createInternalUse,
    consumeProduct,
    addStock,
    addBonus
};