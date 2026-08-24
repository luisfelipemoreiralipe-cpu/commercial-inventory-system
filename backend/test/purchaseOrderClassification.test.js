const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
let createdOrderData;

const fakePrisma = {
    product: {
        findFirst: async ({ where }) => {
            if (where.id === 'cleaning-product' && where.establishmentId === 'establishment') {
                return { id: 'cleaning-product', purchaseClassification: 'CLEANING' };
            }
            return null;
        }
    },
    productSupplier: { findFirst: async () => null },
    purchaseOrder: {
        create: async ({ data }) => {
            createdOrderData = data;
            return {
                id: 'order',
                items: data.items.create.map((item, index) => ({ id: `item-${index}`, ...item }))
            };
        }
    }
};

require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: fakePrisma
};

const purchaseOrderRepository = require('../src/repositories/purchaseOrderRepository');

test('ordem guarda a classificação financeira atual do produto', async () => {
    const order = await purchaseOrderRepository.create({
        user_id: 'user',
        establishmentId: 'establishment',
        items: [{
            productId: 'cleaning-product',
            productName: 'Detergente',
            adjustedQuantity: 2,
            unitPrice: 10
        }]
    });

    assert.equal(createdOrderData.items.create[0].purchaseClassification, 'CLEANING');
    assert.equal(order.items[0].purchaseClassification, 'CLEANING');
});

test('ordem rejeita produto de outro estabelecimento', async () => {
    await assert.rejects(
        purchaseOrderRepository.create({
            user_id: 'user',
            establishmentId: 'another-establishment',
            items: [{
                productId: 'cleaning-product',
                productName: 'Detergente',
                adjustedQuantity: 1,
                unitPrice: 10
            }]
        }),
        /Produto não encontrado neste estabelecimento/
    );
});
