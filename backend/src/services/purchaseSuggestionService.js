const purchaseSuggestionRepo = require('../repositories/purchaseSuggestionRepository');
const productRepo = require('../repositories/productRepository');
const purchaseOrderRepo = require('../repositories/purchaseOrderRepository');
// ─── PURCHASE SUGGESTIONS ─────────────────────────

const getPurchaseSuggestions = async (establishmentId) => {

    const products = await purchaseSuggestionRepo.getProductsBelowMinimum(establishmentId);

    const suggestions = [];

    for (const product of products) {
        const hasOpenOrder = await purchaseOrderRepo.productHasOpenPendingOrder(product.id);
        const suggestedQuantity = product.minQuantity - product.quantity;

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
            hasOpenOrder
        });

    }

    return {
        items: suggestions
    };
};

module.exports = {
    getPurchaseSuggestions
};