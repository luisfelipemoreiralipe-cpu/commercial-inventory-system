const test = require('node:test');
const assert = require('node:assert/strict');

const mockModule = (relativePath, exports) => {
    const resolved = require.resolve(relativePath);
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

test('recebimento persiste preço editado no item, produto, fornecedor e histórico', async () => {
    const calls = {};
    const order = {
        id: '00000000-0000-0000-0000-000000000001',
        status: 'pending',
        items: [{
            id: '00000000-0000-0000-0000-000000000002',
            productId: '00000000-0000-0000-0000-000000000003',
            supplierId: '00000000-0000-0000-0000-000000000004',
            adjustedQuantity: 2,
            unitPrice: 100
        }]
    };

    const tx = {
        purchaseOrder: {
            updateMany: async ({ data }) => data.status === 'processing' ? { count: 1 } : { count: 1 }
        },
        product: {
            findFirst: async () => ({ packQuantity: 10 }),
            updateMany: async (args) => { calls.product = args.data; return { count: 1 }; }
        },
        purchaseOrderItem: {
            update: async (args) => { calls.item = args.data; return args.data; }
        },
        productSupplier: {
            upsert: async (args) => { calls.supplier = args.update; return args.update; }
        },
        supplierPriceHistory: {
            create: async (args) => { calls.history = args.data; return args.data; }
        },
        purchaseInvoice: {
            create: async ({ data }) => ({ id: 'invoice-id', ...data })
        },
        auditLog: { create: async () => ({}) }
    };

    mockModule('../src/repositories/purchaseOrderRepository', {
        findById: async () => order
    });
    mockModule('../src/repositories/auditLogRepository', { create: async () => ({}) });
    mockModule('../src/utils/prisma', { $transaction: async (callback) => callback(tx) });
    mockModule('../src/services/stockMovementService', {
        addStock: async (data) => { calls.stock = data; }
    });
    mockModule('../src/services/commercialAgreementService', {
        processInvoiceAccruals: async () => {}
    });

    const { completeOrder } = require('../src/services/purchaseOrderService');
    await completeOrder(
        order.id,
        '00000000-0000-0000-0000-000000000005',
        [{ id: order.items[0].id, adjustedQuantity: 3, unitPrice: 125 }],
        { invoiceNumber: '123', issuedAt: '2026-08-30' },
        '00000000-0000-0000-0000-000000000006'
    );

    assert.deepEqual(calls.item, { adjustedQuantity: 3, unitPrice: 125 });
    assert.deepEqual(calls.product, { unitPrice: 125, currentCost: 12.5 });
    assert.deepEqual(calls.supplier, { price: 125 });
    assert.equal(calls.history.price, 125);
    assert.equal(calls.history.purchaseOrderId, order.id);
    assert.equal(calls.stock.unitCost, 12.5);
});
