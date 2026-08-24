const test = require('node:test');
const assert = require('node:assert/strict');
const { operationalUseSchema } = require('../src/validations/operationalUseValidation');

const validData = {
    productId: '11111111-1111-4111-8111-111111111111',
    locationId: '22222222-2222-4222-8222-222222222222',
    quantity: '1.5',
    periodFrom: '2026-08-18',
    periodTo: '2026-08-24'
};

test('baixa operacional converte quantidade e aceita período válido', () => {
    const parsed = operationalUseSchema.parse(validData);
    assert.equal(parsed.quantity, 1.5);
});

test('baixa operacional rejeita período invertido', () => {
    assert.equal(operationalUseSchema.safeParse({ ...validData, periodFrom: '2026-08-25' }).success, false);
});

test('baixa operacional rejeita quantidade negativa e campos excessivos', () => {
    assert.equal(operationalUseSchema.safeParse({ ...validData, quantity: -1 }).success, false);
    assert.equal(operationalUseSchema.safeParse({ ...validData, notes: 'x'.repeat(501) }).success, false);
});

test('baixa operacional rejeita data inexistente', () => {
    assert.equal(operationalUseSchema.safeParse({ ...validData, periodTo: '2026-02-31' }).success, false);
});
