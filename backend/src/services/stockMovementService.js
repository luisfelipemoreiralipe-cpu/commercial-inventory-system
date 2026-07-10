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
        const packQuantity = product.packQuantity || 1;
        return Number(product.unitPrice) / packQuantity;
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
    preloadedCost, // opcional: custo pré-calculado fora da transação
    locationId // opcional: local de onde o estoque vai sair
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado ou acesso negado.");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    // Identificar o local de saída
    let targetLocationId = locationId || product.defaultLocationId;
    if (!targetLocationId) {
        const defaultLoc = await tx.stockLocation.findFirst({ where: { establishmentId, isDefault: true }});
        targetLocationId = defaultLoc ? defaultLoc.id : null;
    }

    if (!targetLocationId) throw new Error("Local de estoque não definido para este produto.");

    // 🟢 TENTA BAIXA DIRETA (INVENTORY ou PRODUCTION com estoque)
    try {
        const stockRecord = await tx.productStock.findUnique({
            where: { productId_locationId: { productId: product.id, locationId: targetLocationId } }
        });

        const isAudit = reference === "STOCK_AUDIT";
        const currentQty = stockRecord ? Number(stockRecord.quantity) : 0;

        // Se tiver saldo suficiente OU for auditoria (que permite zerar sem dar erro)
        if (currentQty >= quantity || isAudit) {
            
            // Quantidade real que vamos deduzir do registro físico (productStock) para não negativar
            const deductAmount = Math.min(currentQty, quantity);
            
            // 1. Desconta do Estoque do Local (apenas o que tem, não negativa)
            if (stockRecord && deductAmount > 0) {
                await tx.productStock.update({
                    where: { id: stockRecord.id },
                    data: { quantity: { decrement: deductAmount } }
                });
            }

            // 2. Desconta do Total Global do Produto (Cache)
            // Na auditoria, baixamos a quantidade total pedida para o global refletir a contagem.
            await tx.product.update({
                where: { id: product.id },
                data: { quantity: { decrement: quantity } }
            });

            const previousQuantity = currentQty;
            const newQuantity = currentQty - deductAmount;

            // Usa custo pré-calculado se disponível
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
                    totalCost,
                    locationId: targetLocationId
                }
            });

            return; // Sucesso na baixa direta
        }
    } catch (err) {
        console.error("❌ ERRO REAL DETECTADO (BAIXA DIRETA):", err);
        throw err;
    }

    // Se falhou (count === 0) e é INVENTORY, lança erro
    if (product.type === "INVENTORY" || product.type === "ASSET") {
        throw new Error(`Estoque insuficiente para ${product.name}`);
    }

    // Se falhou (count === 0) e é PRODUCTION, faz a baixa pela receita (produção sob demanda)
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

        const totalNeeded = Number(item.quantity) * Number(quantity);

        // 1. localId (informado na venda) > 2. product.defaultLocation (do drink) > 3. ingrediente.defaultLocation
        let ingTargetLoc = targetLocationId || ingredient.defaultLocationId;
        if (!ingTargetLoc) {
            const defaultLoc = await tx.stockLocation.findFirst({ where: { establishmentId, isDefault: true }});
            ingTargetLoc = defaultLoc ? defaultLoc.id : null;
        }

        try {
            const ingStock = await tx.productStock.findUnique({
                where: { productId_locationId: { productId: ingredient.id, locationId: ingTargetLoc } }
            });

            if (!ingStock || Number(ingStock.quantity) < totalNeeded) {
                throw new Error(`Estoque insuficiente para ingrediente: ${ingredient.name}`);
            }

            // Desconta do Local
            await tx.productStock.update({
                where: { id: ingStock.id },
                data: { quantity: { decrement: totalNeeded } }
            });

            // Desconta do Total
            await tx.product.update({
                where: { id: ingredient.id },
                data: { quantity: { decrement: totalNeeded } }
            });

            const previousQuantity = Number(ingStock.quantity);
            const newQuantity = previousQuantity - totalNeeded;

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
                    totalCost: unitCost * Number(totalNeeded),
                    locationId: ingTargetLoc
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
    unitCost: manualUnitCost,
    locationId
}, tx) => {

    const product = await tx.product.findFirst({
        where: { id: productId, establishmentId }
    });

    if (!product) throw new Error("Produto não encontrado ou acesso negado.");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    let targetLocationId = locationId || product.defaultLocationId;
    if (!targetLocationId) {
        const defaultLoc = await tx.stockLocation.findFirst({ where: { establishmentId, isDefault: true }});
        targetLocationId = defaultLoc ? defaultLoc.id : null;
    }

    if (!targetLocationId) throw new Error("Local de estoque não definido para este produto.");

    const stockRecord = await tx.productStock.upsert({
        where: { productId_locationId: { productId: product.id, locationId: targetLocationId } },
        create: { productId: product.id, locationId: targetLocationId, quantity: Number(quantity) },
        update: { quantity: { increment: quantity } }
    });

    const previousQuantity = Number(stockRecord.quantity) - Number(quantity);
    const newQuantity = Number(stockRecord.quantity);

    const unitCost = manualUnitCost !== undefined ? manualUnitCost : await getProductCost(product.id, establishmentId, tx);
    const totalCost = unitCost * Number(quantity);

    await tx.product.update({
        where: { id: product.id },
        data: {
            quantity: { increment: quantity },
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
            supplierId: finalSupplierId,
            locationId: targetLocationId
        }
    });
};

// 🎁 BONUS
const addBonus = async ({
    productId,
    quantity,
    establishmentId,
    supplierId,
    locationId
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
            supplierId,
            locationId
        }, tx);
    });
};

// 🍺 CONSUMO INTERNO
const createInternalUse = async ({
    productId,
    quantity,
    establishmentId,
    locationId
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
            reference: "CONSUMO INTERNO",
            locationId
        }, tx);
    });
};

// 📋 TIPOS DE LANÇAMENTO
const ENTRY_TYPES = {
    COURTESY: { reason: 'COURTESY', reference: 'CORTESIA', label: 'Cortesia' },
    DOUBLE_DRINK: { reason: 'DOUBLE_DRINK', reference: 'DRINK EM DOBRO', label: 'Drink em Dobro' },
    PROMO: { reason: 'PROMO', reference: 'PROMOÇÃO', label: 'Promoção' },
    TASTING: { reason: 'TASTING', reference: 'DEGUSTAÇÃO', label: 'Degustação' },
    OPERATIONAL_LOSS: { reason: 'OPERATIONAL_LOSS', reference: 'PERDA OPERACIONAL', label: 'Perda Operacional' },
};

// 🎯 CRIAR LANÇAMENTO (Cortesia, Drink em Dobro, Promoção, etc.)
const createEntry = async ({
    productId,
    quantity,
    entryType,
    notes,
    establishmentId,
    locationId
}) => {
    const typeConfig = ENTRY_TYPES[entryType];
    if (!typeConfig) throw new Error(`Tipo de lançamento inválido: ${entryType}`);
    if (!productId) throw new Error("Produto é obrigatório");
    if (!quantity || quantity <= 0) throw new Error("Quantidade inválida");

    const openAudit = await prisma.stockAudit.findFirst({
        where: { establishmentId, status: "OPEN" }
    });
    if (openAudit) throw new Error("Operação bloqueada: Existe uma auditoria em andamento.");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    const productName = product ? product.name : 'Produto Desconhecido';
    
    // Injeta a quantidade e o nome do produto raiz na referência para relatórios
    // Isso é essencial porque produtos de PRODUÇÃO viram ingredientes no banco
    const rootInfo = `[${quantity} ${productName.trim()}]`;

    const reference = notes
        ? `${typeConfig.reference} ${rootInfo} — ${notes}`
        : `${typeConfig.reference} ${rootInfo}`;

    return prisma.$transaction(async (tx) => {
        await consumeProduct({
            productId,
            quantity,
            establishmentId,
            reason: typeConfig.reason,
            reference,
            locationId
        }, tx);
    });
};

// 📊 RESUMO DE LANÇAMENTOS POR TIPO
const getEntrySummary = async ({ establishmentId, dateFrom, dateTo }) => {
    const entryReasons = Object.values(ENTRY_TYPES).map(t => t.reason);

    const where = {
        establishmentId,
        type: 'OUT',
        reason: { in: entryReasons }
    };

    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        select: {
            reason: true,
            totalCost: true,
            quantity: true,
            productName: true,
            productId: true
        }
    });

    // Agrupa por tipo
    const byType = {};
    for (const r of entryReasons) {
        byType[r] = { count: 0, totalCost: 0 };
    }

    // Top produto por tipo
    const productMap = {};

    for (const m of movements) {
        if (byType[m.reason]) {
            byType[m.reason].count += 1;
            byType[m.reason].totalCost += Number(m.totalCost || 0);
        }

        const key = `${m.reason}:${m.productId}`;
        if (!productMap[key]) {
            productMap[key] = {
                reason: m.reason,
                productId: m.productId,
                productName: m.productName,
                totalQty: 0,
                totalCost: 0
            };
        }
        productMap[key].totalQty += Number(m.quantity || 0);
        productMap[key].totalCost += Number(m.totalCost || 0);
    }

    // Top produto geral
    const topProduct = Object.values(productMap)
        .sort((a, b) => b.totalCost - a.totalCost)[0] || null;

    return { byType, topProduct, totalMovements: movements.length };
};

module.exports = {
    getMovements,
    createInternalUse,
    consumeProduct,
    addStock,
    addBonus,
    getProductCostOutsideTx,
    getProductCost,
    createEntry,
    getEntrySummary,
    ENTRY_TYPES
};