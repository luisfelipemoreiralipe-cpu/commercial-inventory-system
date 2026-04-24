const prisma = require('../config/prisma');
const purchaseSuggestionRepo = require('../repositories/purchaseSuggestionRepository');
const purchaseOrderRepo = require('../repositories/purchaseOrderRepository');

/**
 * 🧠 CALCULAR CONSUMO
 */
const calculateAverageConsumption = async (productId, establishmentId, days = 7) => {

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await prisma.stockMovement.findMany({
        where: {
            productId,
            establishmentId,
            type: "OUT",
            reason: {
                in: ["CSV", "INTERNAL_USE"]
            },
            createdAt: {
                gte: startDate
            }
        }
    });

    const totalConsumed = movements.reduce((sum, m) => {
        return sum + Number(m.quantity);
    }, 0);

    const average = totalConsumed / days;

    return {
        totalConsumed,
        averageDailyConsumption: average
    };
};

/**
 * 🧠 GERAR SUGESTÕES DE COMPRA
 * 🛡️ Blindado com establishmentId
 */
const getPurchaseSuggestions = async (establishmentId, targetDays = 7) => {

    targetDays = Number(targetDays) || 7;

    const products = await purchaseSuggestionRepo.getProductsBelowMinimum(establishmentId);

    const suggestions = (await Promise.all(products.map(async (product) => {
        const hasOpenOrder = await purchaseOrderRepo.productHasOpenPendingOrder(
            product.id,
            establishmentId
        );

        if (hasOpenOrder) return null;

        const consumption = await calculateAverageConsumption(
            product.id,
            establishmentId,
            7
        );

        const safetyFactor = 1.5;
        const eventMultiplier = targetDays / 7;
        const projectedConsumption = Number(consumption.totalConsumed || 0) * eventMultiplier * safetyFactor;

        const targetStockMl = Math.max(Number(product.minQuantity), projectedConsumption);
        const suggestedMl = targetStockMl - Number(product.quantity);

        const packQuantity = Number(product.packQuantity || 1);
        const suggestedInUnits = suggestedMl > 0 ? Math.ceil(suggestedMl / packQuantity) : 0;

        if (suggestedInUnits <= 0) return null;

        const suppliers = await Promise.all(product.productSuppliers.map(async (ps) => {
            const sid = ps.supplier.id;

            // Histórico (Últimas 3 compras deste fornecedor/produto e ESTABELECIMENTO)
            const history = await prisma.supplierPriceHistory.findMany({
                where: { 
                    productId: product.id, 
                    supplierId: sid,
                    product: {
                        establishmentId
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 3
            });

            let nominalPrice = Number(ps.price);
            if (history.length > 0) {
                nominalPrice = Math.min(...history.map(h => Number(h.price)));
            }

            // Fator Bônus (Validando tenant)
            const bonusCount = await prisma.stockMovement.count({
                where: {
                    productId: product.id,
                    supplierId: sid,
                    establishmentId,
                    type: 'IN',
                    reason: 'BONUS'
                }
            });

            const bonusAdvantage = Math.min(bonusCount * 0.05, 0.20);
            const score = nominalPrice * (1 - bonusAdvantage);

            return {
                supplierId: sid,
                supplierName: ps.supplier.name,
                price: nominalPrice,
                score,
                bonusCount
            };
        }));

        suppliers.sort((a, b) => a.score - b.score);

        let bestSupplierId = null;
        let bestSupplierName = null;
        let bestPrice = null;
        let lastPrice = null;
        let saving = null;

        if (suppliers.length > 0) {
            const cheapest = suppliers[0];
            const mostExpensive = [...suppliers].sort((a,b) => b.price - a.price)[0];

            bestSupplierId = cheapest.supplierId;
            bestSupplierName = cheapest.supplierName;
            bestPrice = cheapest.price;
            
            if (suppliers.length > 1 && mostExpensive.price > cheapest.price) {
                saving = mostExpensive.price - cheapest.price;
            }
        }

        return {
            productId: product.id,
            productName: product.name,
            unit: product.unit,
            purchaseUnit: product.purchaseUnit,
            packQuantity: product.packQuantity,
            currentStock: product.quantity,
            minimumStock: product.minQuantity,
            suggestedQuantity: suggestedInUnits,
            suppliers,
            bestSupplierId,
            bestSupplierName,
            bestPrice,
            lastPrice,
            saving,
            hasOpenOrder,
            consumptionLast7Days: consumption.totalConsumed,
            averageDailyConsumption: consumption.averageDailyConsumption
        };
    }))).filter(Boolean);

    return {
        items: suggestions
    };
};

module.exports = {
    getPurchaseSuggestions,
};