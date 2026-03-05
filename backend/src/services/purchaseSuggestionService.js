const purchaseSuggestionRepo = require('../repositories/purchaseSuggestionRepository');
const productRepo = require('../repositories/productRepository');

// ─── PURCHASE SUGGESTIONS ─────────────────────────

const getPurchaseSuggestions = async (establishmentId) => {

    const products = await purchaseSuggestionRepo.getProductsBelowMinimum(establishmentId);

    const suggestions = [];

    for (const product of products) {

        const suggestedQuantity = product.minQuantity - product.quantity;

        if (suggestedQuantity <= 0) continue;

        const suppliers = product.productSuppliers.map(ps => ({
            id: ps.supplier.id,
            name: ps.supplier.name
        }));

        const priceHistory = await productRepo.getPriceHistory(product.id);

        let bestSupplierId = null;
        let bestSupplierName = null;
        let bestPrice = null;
        let lastPrice = null;
        let saving = null;

        if (priceHistory.length) {

            const lastPurchase = priceHistory[0];
            lastPrice = Number(lastPurchase.unitPrice);

            let best = priceHistory[0];

            for (const item of priceHistory) {
                if (Number(item.unitPrice) < Number(best.unitPrice)) {
                    best = item;
                }
            }

            bestSupplierId = best.supplier?.id || null;
            bestSupplierName = best.supplier?.name || null;
            bestPrice = Number(best.unitPrice);

            saving = lastPrice - bestPrice;
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
            saving
        });

    }

    return {
        items: suggestions
    };
};

module.exports = {
    getPurchaseSuggestions
};