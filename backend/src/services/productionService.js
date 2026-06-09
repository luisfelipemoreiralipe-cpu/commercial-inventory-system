const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const productionRepo = require('../repositories/productionRepository');
const stockMovementService = require('./stockMovementService');

/**
 * 🔍 PREVIEW — Calcula ingredientes necessários para N unidades SEM alterar estoque
 * Regra: a ficha técnica define ingredientes para 1 unidade do produto.
 * Para produzir X unidades, multiplica cada ingrediente por X.
 */
const previewProduction = async (productId, quantity, establishmentId) => {

    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new AppError('Quantidade inválida.', 400);

    // Busca produto
    const product = await prisma.product.findFirst({
        where: { id: productId, establishmentId, isActive: true }
    });

    if (!product) throw new AppError('Produto não encontrado.', 404);
    if (product.type !== 'PRODUCTION') throw new AppError('Este produto não é do tipo Produção.', 400);

    // Busca ficha técnica com ingredientes
    const recipe = await prisma.recipe.findFirst({
        where: { productId, establishmentId },
        include: {
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, unit: true, quantity: true, currentCost: true, packQuantity: true }
                    }
                }
            }
        }
    });

    if (!recipe) throw new AppError('Este produto não possui ficha técnica cadastrada.', 400);
    if (recipe.items.length === 0) throw new AppError('A ficha técnica não possui ingredientes.', 400);

    // Calcula ingredientes necessários proporcionalmente
    let totalCost = 0;
    const ingredients = [];
    let hasInsufficient = false;

    for (const item of recipe.items) {
        const ingredient = item.product;
        const needed = Number(item.quantity) * qty;
        const available = Number(ingredient.quantity);
        const sufficient = available >= needed;

        if (!sufficient) hasInsufficient = true;

        // Calcula custo unitário do ingrediente
        const unitCost = ingredient.currentCost
            ? Number(ingredient.currentCost)
            : 0;

        const cost = unitCost * needed;
        totalCost += cost;

        ingredients.push({
            id: item.id,
            productId: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            quantityPerUnit: Number(item.quantity),    // quantidade na ficha (para 1 unidade)
            quantityNeeded: needed,                    // quantidade total necessária
            quantityAvailable: available,              // estoque atual
            sufficient,
            unitCost,
            totalCost: cost
        });
    }

    return {
        productId: product.id,
        productName: product.name,
        productUnit: product.unit,
        quantity: qty,
        ingredients,
        estimatedTotalCost: totalCost,
        canProduce: !hasInsufficient
    };
};

/**
 * 📋 CRIAR ORDEM DE PRODUÇÃO (status: PENDING)
 */
const createProductionOrder = async ({ productId, quantity, notes, establishmentId, createdBy }) => {

    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new AppError('Quantidade inválida.', 400);

    // Valida produto
    const product = await prisma.product.findFirst({
        where: { id: productId, establishmentId, isActive: true }
    });

    if (!product) throw new AppError('Produto não encontrado.', 404);
    if (product.type !== 'PRODUCTION') throw new AppError('Este produto não é do tipo Produção.', 400);

    // Valida ficha técnica
    const recipe = await prisma.recipe.findFirst({
        where: { productId, establishmentId },
        include: { items: true }
    });

    if (!recipe || recipe.items.length === 0) {
        throw new AppError('Este produto não possui ficha técnica cadastrada. Cadastre a ficha técnica antes de criar uma produção.', 400);
    }

    const order = await productionRepo.create({
        productId,
        quantity: qty,
        notes,
        establishmentId,
        createdBy
    });

    return order;
};

/**
 * 📃 LISTAR ORDENS DE PRODUÇÃO
 */
const listProductionOrders = async ({ establishmentId, status, page, limit }) => {
    return productionRepo.findAll({ establishmentId, status, page, limit });
};

/**
 * ✅ CONCLUIR PRODUÇÃO
 * 1. Dá baixa nos insumos (consumeProduct para cada ingrediente)
 * 2. Dá entrada no produto final (addStock)
 * 3. Marca a ordem como COMPLETED
 */
const completeProductionOrder = async (orderId, establishmentId) => {

    // Busca a ordem com todos os detalhes
    const order = await productionRepo.findById(orderId, establishmentId);

    if (!order) throw new AppError('Ordem de produção não encontrada.', 404);
    if (order.status !== 'PENDING') {
        throw new AppError(`Esta ordem já foi ${order.status === 'COMPLETED' ? 'concluída' : 'cancelada'}.`, 400);
    }

    const recipe = order.product.Recipe;
    if (!recipe || recipe.items.length === 0) {
        throw new AppError('Ficha técnica não encontrada para este produto.', 400);
    }

    const qty = Number(order.quantity);
    const reference = `PRODUCAO-${orderId.slice(0, 8).toUpperCase()}`;

    // Tudo em uma única transação atômica
    await prisma.$transaction(async (tx) => {

        // 1️⃣ Baixa de cada insumo proporcionalmente
        for (const item of recipe.items) {
            const ingredient = item.product;
            const needed = Number(item.quantity) * qty;

            // Verifica estoque disponível
            const current = await tx.product.findFirst({
                where: { id: ingredient.id, establishmentId },
                select: { quantity: true, name: true }
            });

            if (!current) throw new Error(`Ingrediente ${ingredient.name} não encontrado.`);
            if (Number(current.quantity) < needed) {
                throw new Error(`Estoque insuficiente para: ${ingredient.name}. Disponível: ${current.quantity}, Necessário: ${needed}`);
            }

            // Baixa no estoque do ingrediente
            await stockMovementService.consumeProduct({
                productId: ingredient.id,
                quantity: needed,
                establishmentId,
                reason: 'PRODUCTION',
                reference
            }, tx);
        }

        // 2️⃣ Entrada do produto produzido
        await stockMovementService.addStock({
            productId: order.productId,
            quantity: qty,
            establishmentId,
            reason: 'PRODUCTION_OUTPUT',
            reference,
            unitCost: 0  // custo calculado pelo sistema conforme política de custo
        }, tx);

        // 3️⃣ Marca como concluída
        await tx.productionOrder.update({
            where: { id: orderId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });
    });

    return { success: true, message: 'Produção concluída com sucesso!' };
};

/**
 * ❌ CANCELAR ORDEM
 */
const cancelProductionOrder = async (orderId, establishmentId) => {

    const order = await productionRepo.findById(orderId, establishmentId);

    if (!order) throw new AppError('Ordem de produção não encontrada.', 404);
    if (order.status !== 'PENDING') {
        throw new AppError('Apenas ordens pendentes podem ser canceladas.', 400);
    }

    await productionRepo.updateStatus(orderId, establishmentId, 'CANCELLED');

    return { success: true };
};

/**
 * 📊 ESTATÍSTICAS DE PRODUÇÃO
 * Retorna contagem por status e custo total no período
 */
const getProductionStats = async ({ establishmentId, startDate, endDate }) => {
    const where = { establishmentId };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const [pending, completed, cancelled] = await Promise.all([
        prisma.productionOrder.count({ where: { ...where, status: 'PENDING' } }),
        prisma.productionOrder.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.productionOrder.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    // Custo de produção: soma dos movimentos OUT com reason=PRODUCTION no período
    const costWhere = { establishmentId, reason: 'PRODUCTION' };
    if (startDate || endDate) {
        costWhere.createdAt = {};
        if (startDate) costWhere.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            costWhere.createdAt.lte = end;
        }
    }
    const costResult = await prisma.stockMovement.aggregate({
        where: costWhere,
        _sum: { totalCost: true }
    });

    return {
        pending,
        completed,
        cancelled,
        total: pending + completed + cancelled,
        productionCost: Number(costResult._sum.totalCost || 0)
    };
};

module.exports = {
    previewProduction,
    createProductionOrder,
    listProductionOrders,
    completeProductionOrder,
    cancelProductionOrder,
    getProductionStats
};
