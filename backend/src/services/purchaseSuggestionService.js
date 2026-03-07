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
            supplierId: ps.supplier.id,
            supplierName: ps.supplier.name,
            price: Number(ps.price)
        }));




        let bestSupplierId = null;
        let bestSupplierName = null;
        let bestPrice = null;
        let lastPrice = null;
        let saving = null;

        if (suppliers.length > 0) {

            let best = suppliers[0];

            for (const s of suppliers) {
                if (Number(s.price) < Number(best.price)) {
                    best = s;
                }
            }

            bestSupplierId = best.supplierId;
            bestSupplierName = best.supplierName;
            bestPrice = best.price;
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