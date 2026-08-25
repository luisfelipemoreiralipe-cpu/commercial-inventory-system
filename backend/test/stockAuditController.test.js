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
