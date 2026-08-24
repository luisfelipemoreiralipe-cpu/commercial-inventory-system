const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAutomaticOrderClassifications } = require('../src/utils/purchaseOrderRules');

test('ordem automÃ¡tica rejeita mistura de bebidas e limpeza', () => {
    assert.throws(() => validateAutomaticOrderClassifications([
        { purchaseClassification: 'CMV_BEVERAGES' },
        { purchaseClassification: 'CLEANING' }
    ], 'AUTOMATIC'), /nÃ£o pode misturar/);
});

test('ordem manual permite classificaÃ§Ãµes diferentes', () => {
    assert.doesNotThrow(() => validateAutomaticOrderClassifications([
        { purchaseClassification: 'CMV_BEVERAGES' },
        { purchaseClassification: 'CLEANING' }
    ], 'MANUAL'));
});
