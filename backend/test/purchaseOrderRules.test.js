const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAutomaticOrderClassifications } = require('../src/utils/purchaseOrderRules');

test('ordem automática rejeita mistura de bebidas e limpeza', () => {
    assert.throws(() => validateAutomaticOrderClassifications([
        { purchaseClassification: 'CMV_BEVERAGES' },
        { purchaseClassification: 'CLEANING' }
    ], 'AUTOMATIC'), /não pode misturar/);
});

test('ordem manual permite classificações diferentes', () => {
    assert.doesNotThrow(() => validateAutomaticOrderClassifications([
        { purchaseClassification: 'CMV_BEVERAGES' },
        { purchaseClassification: 'CLEANING' }
    ], 'MANUAL'));
});
