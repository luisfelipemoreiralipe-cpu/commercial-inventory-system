const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const portioningRecipeRepo = require('../repositories/portioningRecipeRepository');
const portioningOrderRepo = require('../repositories/portioningOrderRepository');
const stockMovementService = require('./stockMovementService');

// ─── RECIPE ─────────────────────────────────────────────────────────────

const createRecipe = async (sourceProductId, establishmentId) => {
    const existing = await portioningRecipeRepo.findBySourceProductId(sourceProductId, establishmentId);
    if (existing) {
        throw new AppError('Este produto já possui ficha de porcionamento.', 400);
    }

    const product = await prisma.product.findFirst({
        where: { id: sourceProductId, establishmentId }
    });

    if (!product) {
        throw new AppError('Produto não encontrado ou acesso negado.', 404);
    }

    return portioningRecipeRepo.create({
        sourceProductId,
        establishmentId
    });
};

const getRecipeByProduct = async (sourceProductId, establishmentId) => {
    return portioningRecipeRepo.findBySourceProductId(sourceProductId, establishmentId) || null;
};

const addRecipeItem = async (recipeId, targetProductId, costAllocationPercentage, establishmentId) => {
    const recipe = await prisma.portioningRecipe.findFirst({
        where: { id: recipeId, establishmentId }
    });
    if (!recipe) throw new AppError('Ficha não encontrada.', 404);

    return portioningRecipeRepo.addItem({
        portioningRecipeId: recipeId,
        targetProductId,
        costAllocationPercentage: Number(costAllocationPercentage || 0)
    });
};

const removeRecipeItem = async (id, establishmentId) => {
    const removed = await portioningRecipeRepo.removeItem(id, establishmentId);
    if (removed.count === 0) throw new AppError('Item não encontrado.', 404);
    return { success: true };
};

const updateRecipeItemCost = async (id, costAllocationPercentage, establishmentId) => {
    const updated = await portioningRecipeRepo.updateItemCostPercentage(id, Number(costAllocationPercentage), establishmentId);
    if (updated.count === 0) throw new AppError('Item não encontrado.', 404);
    return { success: true };
};

// ─── ORDER ──────────────────────────────────────────────────────────────

const createOrder = async ({ sourceProductId, sourceQuantity, notes, items, establishmentId, createdBy }) => {
    const qty = Number(sourceQuantity);
    if (!qty || qty <= 0) throw new AppError('Quantidade de origem inválida.', 400);

    const recipe = await portioningRecipeRepo.findBySourceProductId(sourceProductId, establishmentId);
    if (!recipe) throw new AppError('Ficha de porcionamento não encontrada.', 400);

    // items array format: [{ targetProductId, quantity, costAllocationPercentage }]
    const orderItems = items.map(item => ({
        targetProductId: item.targetProductId,
        quantity: Number(item.quantity),
        costAllocationPercentage: Number(item.costAllocationPercentage)
    }));

    // Verifica total de porcentagem
    const totalPercentage = orderItems.reduce((acc, item) => acc + item.costAllocationPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01 && totalPercentage > 0) {
        // Tolerância de falha, ou exigir exatamente 100% (ou 0 se sem custo)
        // Por ora, vamos permitir < 100% caso haja perda total do custo (não recomendado, mas possível)
        // O ideal é que a soma seja ~100%
    }

    const order = await portioningOrderRepo.create({
        sourceProductId,
        sourceQuantity: qty,
        notes,
        establishmentId,
        createdBy,
        items: {
            create: orderItems
        }
    });

    return order;
};

const listOrders = async ({ establishmentId, status, page, limit }) => {
    return portioningOrderRepo.findAll({ establishmentId, status, page, limit });
};

const completeOrder = async (orderId, establishmentId) => {
    const order = await portioningOrderRepo.findById(orderId, establishmentId);
    if (!order) throw new AppError('Ordem não encontrada.', 404);
    if (order.status !== 'PENDING') {
        throw new AppError(`A ordem já está ${order.status === 'COMPLETED' ? 'concluída' : 'cancelada'}.`, 400);
    }

    const reference = `PORCIONAMENTO-${orderId.slice(0, 8).toUpperCase()}`;

    await prisma.$transaction(async (tx) => {
        const sourceQty = Number(order.sourceQuantity);

        // Verifica estoque origem
        const sourceProd = await tx.product.findFirst({
            where: { id: order.sourceProductId, establishmentId }
        });
        if (Number(sourceProd.quantity) < sourceQty) {
            throw new Error(`Estoque insuficiente para a matéria prima: ${sourceProd.name}. Disp: ${sourceProd.quantity}, Nec: ${sourceQty}`);
        }

        // Descobre o custo atual da matéria prima
        const unitCostRaw = await stockMovementService.getProductCost(order.sourceProductId, establishmentId, tx);
        const totalSourceCost = unitCostRaw * sourceQty;

        // Baixa na peça inteira
        await stockMovementService.consumeProduct({
            productId: order.sourceProductId,
            quantity: sourceQty,
            establishmentId,
            reason: 'PORTIONING_SOURCE',
            reference,
            preloadedCost: unitCostRaw
        }, tx);

        // Entrada nos cortes rateados
        for (const item of order.items) {
            const yieldQty = Number(item.quantity);
            if (yieldQty > 0) {
                const percentage = Number(item.costAllocationPercentage);
                const allocatedCost = (totalSourceCost * (percentage / 100));
                const yieldUnitCost = allocatedCost / yieldQty;

                await stockMovementService.addStock({
                    productId: item.targetProductId,
                    quantity: yieldQty,
                    establishmentId,
                    reason: 'PORTIONING_YIELD',
                    reference,
                    unitCost: yieldUnitCost
                }, tx);
            }
        }

        // Atualiza Status
        await tx.portioningOrder.update({
            where: { id: orderId },
            data: { status: 'COMPLETED', completedAt: new Date() }
        });
    }, {
        maxWait: 10000,
        timeout: 30000
    });

    return { success: true, message: 'Porcionamento concluído com sucesso!' };
};

const cancelOrder = async (orderId, establishmentId) => {
    const order = await portioningOrderRepo.findById(orderId, establishmentId);
    if (!order) throw new AppError('Ordem não encontrada.', 404);
    if (order.status !== 'PENDING') throw new AppError('Apenas ordens pendentes podem ser canceladas.', 400);

    await portioningOrderRepo.updateStatus(orderId, establishmentId, 'CANCELLED');
    return { success: true };
};

module.exports = {
    createRecipe,
    getRecipeByProduct,
    addRecipeItem,
    removeRecipeItem,
    updateRecipeItemCost,
    createOrder,
    listOrders,
    completeOrder,
    cancelOrder
};
