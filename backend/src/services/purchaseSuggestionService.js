const prisma = require('../config/prisma');
const purchaseSuggestionRepo = require('../repositories/purchaseSuggestionRepository');
const purchaseOrderRepo = require('../repositories/purchaseOrderRepository');

// 🧠 CALCULAR CONSUMO
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

// ─── PURCHASE SUGGESTIONS ─────────────────────────

const getPurchaseSuggestions = async (establishmentId, targetDays = 7) => {

    targetDays = Number(targetDays) || 7;

    const products = await purchaseSuggestionRepo.getProductsBelowMinimum(establishmentId);

    const suggestions = [];

    for (const product of products) {

        const hasOpenOrder = await purchaseOrderRepo.productHasOpenPendingOrder(product.id);

        const consumption = await calculateAverageConsumption(
            product.id,
            establishmentId,
            7
        );

        let suggestedQuantity;

        if (consumption.totalConsumed > 0) {

            const safetyFactor = 1.5;

            const eventMultiplier = targetDays / 7;

            const projectedConsumption =
                Number(consumption.totalConsumed) * eventMultiplier;

            suggestedQuantity =
                (projectedConsumption * safetyFactor) -
                Number(product.quantity);

        } else {

            suggestedQuantity =
                Number(product.minQuantity) - Number(product.quantity);
        }

        suggestedQuantity = Math.ceil(suggestedQuantity);

        if (suggestedQuantity <= 0) continue;

        const suppliers = product.productSuppliers.map(ps => ({
            supplierId: ps.supplier.id,
            supplierName: ps.supplier.name,
            price: Number(ps.price)
        }));

        suppliers.sort((a, b) => a.price - b.price);

        let bestSupplierId = null;
        let bestSupplierName = null;
        let bestPrice = null;
        let lastPrice = null;
        let saving = null;

        if (suppliers.length > 0) {

            const cheapest = suppliers[0];
            const mostExpensive = suppliers[suppliers.length - 1];

            bestSupplierId = cheapest.supplierId;
            bestSupplierName = cheapest.supplierName;
            bestPrice = cheapest.price;

            if (suppliers.length > 1) {
                saving = mostExpensive.price - cheapest.price;
            }
        }

        suggestions.push({
            productId: product.id,
            productName: product.name,
            unit: product.unit,
            currentStock: product.quantity,
            minimumStock: product.minQuantity,
            suggestedQuantity,
            suppliers,

            bestSupplierId,
            bestSupplierName,
            bestPrice,
            lastPrice,
            saving,
            hasOpenOrder,

            // 🧠 NOVO (não quebra front)
            consumptionLast7Days: consumption.totalConsumed,
            averageDailyConsumption: consumption.averageDailyConsumption
        });
    }

    return {
        items: suggestions
    };
};

module.exports = {
    getPurchaseSuggestions,
};