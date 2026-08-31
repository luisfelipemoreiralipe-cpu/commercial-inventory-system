const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/supplierPriceUpdateService');

test('lotes remotos usam janela transacional suficiente para múltiplos itens', () => {
    assert.equal(service.TRANSACTION_OPTIONS.maxWait, 15000);
    assert.equal(service.TRANSACTION_OPTIONS.timeout, 60000);
});

test('normaliza preço do pacote pela quantidade sem usar Float persistido', () => {
    assert.equal(service.normalizedPrice(120, 24), 5);
    assert.equal(service.normalizedPrice(10, 3), 3.3333);
});

test('rejeita preço ou quantidade não positiva', () => {
    assert.throws(() => service.normalizedPrice(0, 12), error => error.statusCode === 422);
    assert.throws(() => service.normalizedPrice(10, 0), error => error.statusCode === 422);
});

test('propagação considera apenas produto e fornecedor do mesmo estabelecimento', async () => {
    const rows = [
        { id: 'valid', product: { establishmentId: 'a' }, supplier: { establishmentId: 'a' } },
        { id: 'cross-tenant', product: { establishmentId: 'a' }, supplier: { establishmentId: 'b' } }
    ];
    const db = { productSupplier: { findMany: async () => rows } };
    const links = await service.localLinks({ organizationProductId: 'product', organizationSupplierId: 'supplier' }, db);
    assert.deepEqual(links.map(item => item.id), ['valid']);
});
