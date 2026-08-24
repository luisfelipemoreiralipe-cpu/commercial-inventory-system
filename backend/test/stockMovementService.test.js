const test = require('node:test');
const assert = require('node:assert/strict');
const { consumeProduct } = require('../src/services/stockMovementService');

const createFakeTransaction = ({ products, stocks, recipes }) => {
    const movements = [];
    const stockMap = new Map(stocks.map(stock => [`${stock.productId}:${stock.locationId}`, { ...stock }]));
    const productMap = new Map(products.map(product => [product.id, { ...product }]));

    const tx = {
        product: {
            findFirst: async ({ where }) => {
                const product = productMap.get(where.id);
                return product && product.establishmentId === where.establishmentId ? { ...product } : null;
            },
            update: async ({ where, data }) => {
                const product = productMap.get(where.id);
                if (data.quantity?.decrement !== undefined) {
                    product.quantity -= Number(data.quantity.decrement);
                }
                return { ...product };
            }
        },
        productStock: {
            findUnique: async ({ where }) => {
                const key = `${where.productId_locationId.productId}:${where.productId_locationId.locationId}`;
                return stockMap.get(key) || null;
            },
            upsert: async ({ where, update, create }) => {
                const key = `${where.productId_locationId.productId}:${where.productId_locationId.locationId}`;
                let stock = stockMap.get(key);
                if (!stock) {
                    stock = { ...create };
                    stockMap.set(key, stock);
                } else {
                    stock.quantity -= Number(update.quantity.decrement);
                }
                return { ...stock };
            }
        },
        recipe: {
            findFirst: async ({ where }) => recipes[where.productId] || null
        },
        stockLocation: { findFirst: async () => null },
        stockMovement: { create: async ({ data }) => movements.push(data) },
        purchaseOrderItem: { findFirst: async () => null },
        productSupplier: { findFirst: async () => null }
    };

    return { tx, productMap, stockMap, movements };
};

test('consome saldo pronto e explode apenas a diferença da produção', async () => {
    const fixture = createFakeTransaction({
        products: [
            { id: 'drink', name: 'Drink', type: 'PRODUCTION', quantity: 5, establishmentId: 'est', defaultLocationId: 'loc' },
            { id: 'insumo', name: 'Insumo', type: 'INVENTORY', quantity: 100, establishmentId: 'est', defaultLocationId: 'loc', currentCost: 1 }
        ],
        stocks: [
            { productId: 'drink', locationId: 'loc', quantity: 5 },
            { productId: 'insumo', locationId: 'loc', quantity: 100 }
        ],
        recipes: {
            drink: { yieldQuantity: 1, items: [{ quantity: 1, product: { id: 'insumo' } }] }
        }
    });

    await consumeProduct({
        productId: 'drink', quantity: 10, establishmentId: 'est',
        reason: 'SALE', reference: 'TEST', preloadedCost: 2
    }, fixture.tx);

    assert.equal(fixture.productMap.get('drink').quantity, 0);
    assert.equal(fixture.productMap.get('insumo').quantity, 95);
    assert.deepEqual(fixture.movements.map(m => [m.productId, m.quantity]), [['drink', 5], ['insumo', 5]]);
});

test('explode ingredientes de produção de forma recursiva', async () => {
    const fixture = createFakeTransaction({
        products: [
            { id: 'final', name: 'Final', type: 'PRODUCTION', quantity: 0, establishmentId: 'est', defaultLocationId: 'loc' },
            { id: 'intermediario', name: 'Intermediário', type: 'PRODUCTION', quantity: 1, establishmentId: 'est', defaultLocationId: 'loc', currentCost: 1 },
            { id: 'base', name: 'Base', type: 'INVENTORY', quantity: 100, establishmentId: 'est', defaultLocationId: 'loc', currentCost: 1 }
        ],
        stocks: [
            { productId: 'final', locationId: 'loc', quantity: 0 },
            { productId: 'intermediario', locationId: 'loc', quantity: 1 },
            { productId: 'base', locationId: 'loc', quantity: 100 }
        ],
        recipes: {
            final: { yieldQuantity: 1, items: [{ quantity: 2, product: { id: 'intermediario' } }] },
            intermediario: { yieldQuantity: 1, items: [{ quantity: 3, product: { id: 'base' } }] }
        }
    });

    await consumeProduct({
        productId: 'final', quantity: 2, establishmentId: 'est',
        reason: 'SALE', reference: 'TEST'
    }, fixture.tx);

    assert.equal(fixture.productMap.get('intermediario').quantity, 0);
    assert.equal(fixture.productMap.get('base').quantity, 91);
});

test('interrompe ciclos em fichas técnicas', async () => {
    const fixture = createFakeTransaction({
        products: [
            { id: 'a', name: 'A', type: 'PRODUCTION', quantity: 0, establishmentId: 'est', defaultLocationId: 'loc' },
            { id: 'b', name: 'B', type: 'PRODUCTION', quantity: 0, establishmentId: 'est', defaultLocationId: 'loc' }
        ],
        stocks: [],
        recipes: {
            a: { yieldQuantity: 1, items: [{ quantity: 1, product: { id: 'b' } }] },
            b: { yieldQuantity: 1, items: [{ quantity: 1, product: { id: 'a' } }] }
        }
    });

    await assert.rejects(
        consumeProduct({
            productId: 'a', quantity: 1, establishmentId: 'est',
            reason: 'SALE', reference: 'TEST'
        }, fixture.tx),
        /Ciclo detectado/
    );
});
