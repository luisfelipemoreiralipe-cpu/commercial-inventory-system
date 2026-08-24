const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');

const stocks = new Map([
    ['product:location-a', { id: 'stock-a', productId: 'product', locationId: 'location-a', quantity: 10 }],
    ['product:location-b', { id: 'stock-b', productId: 'product', locationId: 'location-b', quantity: 5 }]
]);
const movements = [];
let savedProductQuantity = 15;

const tx = {
    product: {
        findFirst: async ({ where }) => where.id === 'product' && where.establishmentId === 'establishment'
            ? { id: 'product', name: 'Produto', unit: 'un', defaultLocationId: 'location-a' }
            : null,
        update: async ({ data }) => {
            savedProductQuantity += Number(data.quantity.increment);
            return { id: 'product', quantity: savedProductQuantity };
        }
    },
    stockLocation: {
        findFirst: async ({ where }) => where.establishmentId === 'establishment'
            && ['location-a', 'location-b'].includes(where.id)
            ? { id: where.id }
            : null
    },
    productStock: {
        findUnique: async ({ where }) => stocks.get(
            `${where.productId_locationId.productId}:${where.productId_locationId.locationId}`
        ) || null,
        upsert: async ({ where, create, update }) => {
            const key = `${where.productId_locationId.productId}:${where.productId_locationId.locationId}`;
            const stock = stocks.get(key) || { id: `stock-${key}`, ...create };
            stock.quantity = Number(update.quantity ?? stock.quantity);
            stocks.set(key, stock);
            return { ...stock };
        },
    },
    stockMovement: { create: async ({ data }) => movements.push(data) },
    auditLog: { create: async () => ({}) }
};

require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: { $transaction: async (callback) => callback(tx) }
};

const { updateProductQuantity } = require('../src/services/productService');

test('ajuste manual aplica a diferença local ao total global de forma atômica', async () => {
    const result = await updateProductQuantity('product', 20, 'establishment', 'location-a');

    assert.equal(savedProductQuantity, 25);
    assert.equal(result.quantity, 25);
    assert.equal(result.adjustedLocationQuantity, 20);
    assert.equal(movements.length, 1);
    assert.equal(movements[0].previousQuantity, 10);
    assert.equal(movements[0].newQuantity, 20);
    assert.equal(movements[0].locationId, 'location-a');
});

test('ajuste manual rejeita local de outro estabelecimento', async () => {
    await assert.rejects(
        updateProductQuantity('product', 10, 'establishment', 'foreign-location'),
        /não pertence ao estabelecimento/
    );
});
