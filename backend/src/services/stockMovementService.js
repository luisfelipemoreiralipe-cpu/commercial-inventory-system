const prisma = require('../config/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');

/**
 * 🔐 REGRA DE CUSTO (CORE FINANCEIRO)
 * 🛡️ Blindado com establishmentId
 */
/**
 * Busca custo usando um cliente de transação (tx).
 * Usado internamente em operações que já estão dentro de uma transação.
 */
const getProductCost = async (productId, establishmentId, tx) => {

    // 🥇 Última compra do estabelecimento
    const lastPurchase = await tx.purchaseOrderItem.findFirst({
        where: { 
            productId,
            purchaseOrder: {
                establishmentId
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (lastPurchase?.unitPrice) {
        const product = await tx.product.findFirst({
            where: { id: productId, establishmentId },
            select: { packQuantity: true }
        });
        const packQuantity = product?.packQuantity || 1;
        return Number(lastPurchase.unitPrice) / packQuantity;
    }

    // 🥈 Menor preço fornecedor do estabelecimento
    const supplier = await tx.productSupplier.findFirst({
        where: { 
            productId,
            product: {
                establishmentId
            }
        },
        orderBy: { price: 'asc' }
    });

    if (supplier?.price) {
        const product = await tx.product.findFirst({
            where: { id: productId, establishmentId },
            select: { packQuantity: true }
        });
        const packQuantity = product?.packQuantity || 1;
        return Number(supplier.price) / packQuantity;
    }

    // 🥉 fallback (dados do próprio produto)
    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (product?.currentCost && product.currentCost > 0) {
        return Number(product.currentCost);
    }

    if (product?.unitPrice && product.unitPrice > 0) {
        return Number(product.unitPrice);
    }

    return 0;
};

/**
 * 🔓 Versão FORA de transação — usa prisma diretamente.
 * Usada para pré-carregar custos antes de abrir uma transação longa,
 * evitando timeout P2028 em lotes grandes (ex: importação CSV).
 */
const getProductCostOutsideTx = async (productId, establishmentId) => {
    return getProductCost(productId, establishmentId, prisma);
};

// 🔍 CONSULTA
const getMovements = (filters) => stockMovementRepo.findAll(filters);

/**
 * 🔥 CONSUMO (CORE)
 * 🛡️ Isolamento total garantido
 */
const consumeProduct = async ({
    productId,
    quantity,
    establishmentId,
    reason,
    reference,
    preloadedCost  // opcional: custo pré-calculado fora da transação
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado ou acesso negado.");
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

            // Busca saldo atualizado para o log de movimentação (com filtro!)
            const finalProduct = await tx.product.findFirst({ 
                where: { id: product.id, establishmentId } 
            });

            const previousQuantity = Number(finalProduct.quantity) + Number(quantity);
            const newQuantity = Number(finalProduct.quantity);

            // Usa custo pré-calculado se disponível (evita queries extras dentro da transação)
            const unitCost = preloadedCost !== undefined ? preloadedCost : await getProductCost(product.id, establishmentId, tx);
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

    if (!recipe) throw new Error("Produto de produção sem receita cadastrada.");

    const { convertToBaseUnit } = require('../utils/unitConverter');

    // 🔥 BAIXA RECURSIVA/ITENS
    for (const item of recipe.items) {

        const ingredient = item.product;

        const totalNeeded = convertToBaseUnit(
            Number(item.quantity) * Number(quantity),
            ingredient.unit
        );

        try {
            const updatedIngRes = await tx.product.updateMany({
                where: {
                    id: ingredient.id,
                    establishmentId, // 🛡️ CRITICAL
                    quantity: { gte: totalNeeded }
                },
                data: {
                    quantity: { decrement: totalNeeded }
                }
            });

            if (updatedIngRes.count === 0) {
                throw new Error(`Estoque insuficiente para ingrediente: ${ingredient.name}`);
            }

            const finalIngredient = await tx.product.findFirst({ 
                where: { id: ingredient.id, establishmentId } 
            });

            const previousQuantity = Number(finalIngredient.quantity) + Number(totalNeeded);
            const newQuantity = Number(finalIngredient.quantity);

            const unitCost = await getProductCost(ingredient.id, establishmentId, tx);

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
                    unitCost,
                    totalCost: unitCost * Number(totalNeeded)
                }
            });
        } catch (err) {
            console.error("❌ ERRO REAL DETECTADO (PRODUCTION):", err);
            throw err;
        }
    }
};

/**
 * 🟢 ENTRADA DE ESTOQUE
 */
const addStock = async ({
    productId,
    quantity,
    establishmentId,
    reason,
    reference,
    supplierId,
    unitCost: manualUnitCost
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado ou acesso negado.");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    const previousQuantity = Number(product.quantity);
    const newQuantity = previousQuantity + Number(quantity);

    const unitCost = manualUnitCost !== undefined ? manualUnitCost : await getProductCost(product.id, establishmentId, tx);
    const totalCost = unitCost * Number(quantity);

    await tx.product.updateMany({
        where: { id: product.id, establishmentId },
        data: {
            quantity: newQuantity,
            currentCost: unitCost
        }
    });

    let movementType = "PURCHASE";
    if (reason === "BONUS") movementType = "IN";

    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
        const ps = await tx.productSupplier.findFirst({ 
            where: { 
                productId,
                product: { establishmentId }
            } 
        });
        if (ps) finalSupplierId = ps.supplierId;
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
            establishmentId,
            unitCost,
            totalCost,
            supplierId: finalSupplierId
        }
    });
};

// 🎁 BONUS
const addBonus = async ({
    productId,
    quantity,
    establishmentId,
    supplierId
}) => {
    if (!productId) throw new Error("Produto é obrigatório");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    return prisma.$transaction(async (tx) => {
        await addStock({
            productId,
            quantity,
            establishmentId,
            reason: "BONUS",
            reference: "BONIFICAÇÃO",
            supplierId
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

    if (openAudit) throw new Error("Operação bloqueada: Existe uma auditoria em andamento.");

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
    addBonus,
    getProductCostOutsideTx
};