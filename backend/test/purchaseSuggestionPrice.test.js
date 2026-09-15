const test = require('node:test');
const assert = require('node:assert/strict');

const mockModule = (relativePath, exports) => {
    const resolved = require.resolve(relativePath);
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

test('sugestao usa precos atuais mesmo com historico menor e recalcula fornecedor e economia', async () => {
    mockModule('../src/config/prisma', {
        stockMovement: { findMany: async () => [], count: async () => 0 },
        supplierPriceHistory: {
            findMany: async ({ where }) => where.supplierId === 'supplier-a'
                ? [{ price: 120 }, { price: 100 }, { price: 110 }]
                : [{ price: 115 }, { price: 130 }]
        }
    });
    mockModule('../src/repositories/purchaseSuggestionRepository', {
        getProductsBelowMinimum: async () => [{
            id: 'product', name: 'Produto', purchaseClassification: 'CLEANING',
            quantity: 0, idealQuantity: 2, packQuantity: 1,
            productSuppliers: [
                { price: '120', supplier: { id: 'supplier-a', name: 'Fornecedor A' } },
                { price: '115', supplier: { id: 'supplier-b', name: 'Fornecedor B' } }
            ]
        }]
    });
    mockModule('../src/repositories/purchaseOrderRepository', {
        productHasOpenPendingOrder: async () => false
    });

    const { getPurchaseSuggestions } = require('../src/services/purchaseSuggestionService');
    const { items } = await getPurchaseSuggestions('establishment');
    assert.equal(items.length, 1);
    assert.equal(items[0].suppliers.find(s => s.supplierId === 'supplier-a').price, 120);
    assert.equal(items[0].suppliers.find(s => s.supplierId === 'supplier-b').price, 115);
    assert.equal(items[0].bestSupplierId, 'supplier-b');
    assert.equal(items[0].bestPrice, 115);
    assert.equal(items[0].saving, 5);
});
