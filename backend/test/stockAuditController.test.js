const test = require('node:test');
const assert = require('node:assert/strict');
const { _private } = require('../src/controllers/stockAuditController');

test('auditoria por local usa o saldo do local em vez do saldo global', async () => {
    const tx = {
        productStock: {
            findUnique: async () => ({ quantity: 7 })
        },
        product: {
            findFirst: async () => ({ quantity: 100 })
        }
    };

    const quantity = await _private.getCurrentAuditQuantity(tx, {
        productId: 'produto',
        locationId: 'local'
    }, 'estabelecimento');

    assert.equal(quantity, 7);
});

test('auditoria global antiga continua usando o saldo global', async () => {
    const tx = {
        productStock: { findUnique: async () => ({ quantity: 7 }) },
        product: { findFirst: async () => ({ quantity: 100 }) }
    };

    const quantity = await _private.getCurrentAuditQuantity(tx, {
        productId: 'produto',
        locationId: null
    }, 'estabelecimento');

    assert.equal(quantity, 100);
});

test('aceita contagem zero quando ela foi explicitamente enviada', () => {
    const error = _private.validateAuditItems([
        { id: 'item-1', countedQuantity: 0 },
        { id: 'item-2', countedQuantity: '0' }
    ]);

    assert.equal(error, null);
});

test('rejeita auditoria vazia ou com contagem inválida', () => {
    assert.ok(_private.validateAuditItems([]));
    assert.ok(_private.validateAuditItems([{ id: 'item-1', countedQuantity: -1 }]));
    assert.ok(_private.validateAuditItems([{ id: 'item-1', countedQuantity: 'texto' }]));
});

test('só permite finalizar auditoria aberta com contagem salva', () => {
    assert.equal(_private.isAuditReadyToFinish({ status: 'OPEN', countedAt: null }), false);
    assert.equal(_private.isAuditReadyToFinish({ status: 'OPEN', countedAt: new Date() }), true);
    assert.equal(_private.isAuditReadyToFinish({ status: 'CLOSED', countedAt: new Date() }), false);
});
