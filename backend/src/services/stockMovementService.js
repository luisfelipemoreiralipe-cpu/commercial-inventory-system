const prisma = require('../config/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');

// 🔥 REGRA DE CUSTO (CORE FINANCEIRO)
const getProductCost = async (productId, tx) => {

    // 🥇 Última compra
    const lastPurchase = await tx.purchaseOrderItem.findFirst({
        where: { productId },
        orderBy: { createdAt: 'desc' }
    });

    if (lastPurchase?.unitPrice) {
        return Number(lastPurchase.unitPrice);
    }

    // 🥈 Menor preço fornecedor
    const supplier = await tx.productSupplier.findFirst({
        where: { productId },
        orderBy: { price: 'asc' }
    });

    if (supplier?.price) {
        return Number(supplier.price);
    }

    // 🥉 fallback
    const product = await tx.product.findUnique({
        where: { id: productId }
    });

    if (product?.currentCost && product.currentCost > 0) {
        return Number(product.currentCost);
    }

    if (product?.unitPrice && product.unitPrice > 0) {
        return Number(product.unitPrice);
    }

    return 0;
};

// 🔍 CONSULTA
const getMovements = (filters) => stockMovementRepo.findAll(filters);

// 🔥 CONSUMO (CORE)
const consumeProduct = async ({
    productId,
    quantity,
    establishmentId,
    reason,
    reference
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    // 🟢 INVENTORY
    if (product.type === "INVENTORY") {
        try {
            const updatedResult = await tx.product.updateMany({
                where: {
                    id: product.id,
                    establishmentId,
                    quantity: { gte: quantity }
                },
                data: {
                    quantity: { decrement: quantity }
                }
            });

            if (updatedResult.count === 0) {
                throw new Error(`Estoque insuficiente para ${product.name}`);
            }

            // Busca saldo atualizado para o log de movimentação
            const finalProduct = await tx.product.findUnique({ where: { id: product.id } });

            const previousQuantity = Number(finalProduct.quantity) + Number(quantity);
            const newQuantity = Number(finalProduct.quantity);

            const unitCost = await getProductCost(product.id, tx);
            const totalCost = unitCost * Number(quantity);

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
                    establishmentId,
                    unitCost,
                    totalCost
                }
            });

        } catch (err) {
            console.error("❌ ERRO REAL DETECTADO (INVENTORY):", err);
            throw err;
        }

        return;
    }

    // 🔴 PRODUCTION
    const recipe = await tx.recipe.findFirst({
        where: { productId: product.id, establishmentId },
        include: {
            items: {
                include: { product: true }
            }
        }
    });

    if (!recipe) throw new Error("Produto de produção sem receita");

    const { convertToBaseUnit } = require('../utils/unitConverter');

    // 🔥 BAIXA
    for (const item of recipe.items) {

        const ingredient = item.product;

        const totalNeeded = convertToBaseUnit(
            Number(item.quantity) * Number(quantity),
            ingredient.unit
        );

        console.log(`[CONVERSÃO_RECIPE] Ingrediente: ${ingredient.name} | Original: ${item.quantity} * ${quantity} | Unidade: ${ingredient.unit} | Result: ${totalNeeded}`);

        try {
            const updatedIngRes = await tx.product.updateMany({
                where: {
                    id: ingredient.id,
                    quantity: { gte: totalNeeded }
                },
                data: {
                    quantity: { decrement: totalNeeded }
                }
            });

            if (updatedIngRes.count === 0) {
                throw new Error(`Estoque insuficiente para ${ingredient.name}`);
            }

            const finalIngredient = await tx.product.findUnique({ where: { id: ingredient.id } });

            const previousQuantity = Number(finalIngredient.quantity) + Number(totalNeeded);
            const newQuantity = Number(finalIngredient.quantity);

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
                    establishmentId,
                    unitCost: await getProductCost(ingredient.id, tx),
                    totalCost: (await getProductCost(ingredient.id, tx)) * Number(totalNeeded)
                }
            });
        } catch (err) {
            console.error("❌ ERRO REAL DETECTADO (PRODUCTION):", err);
            throw err;
        }
    }
};

// 🔥 ENTRADA DE ESTOQUE
const addStock = async ({
    productId,
    quantity,
    establishmentId,
    reason,
    reference
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    const previousQuantity = Number(product.quantity);
    const newQuantity = previousQuantity + Number(quantity);

    const unitCost = await getProductCost(product.id, tx);
    const totalCost = unitCost * Number(quantity);

    await tx.product.update({
        where: { id: product.id },
        data: {
            quantity: newQuantity,
            currentCost: unitCost // 🔥 AQUI
        }
    });

    let movementType = "PURCHASE";
    if (reason === "BONUS") movementType = "BONUS";

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
            establishmentId,
            unitCost,
            totalCost
        }
    });
};

// 🎁 BONUS
const addBonus = async ({
    productId,
    quantity,
    establishmentId
}) => {

    if (!productId) throw new Error("Produto é obrigatório");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

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

// 🍺 CONSUMO INTERNO
const createInternalUse = async ({
    productId,
    quantity,
    establishmentId
}) => {

    const openAudit = await prisma.stockAudit.findFirst({
        where: { establishmentId, status: "OPEN" }
    });

    if (openAudit) throw new Error("Auditoria em andamento");

    if (!productId) throw new Error("Produto é obrigatório");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

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

module.exports = {
    getMovements,
    createInternalUse,
    consumeProduct,
    addStock,
    addBonus
};