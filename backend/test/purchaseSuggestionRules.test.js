const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSuggestedUnits } = require('../src/services/purchaseSuggestionService');

test('material operacional usa estoque ideal e respeita embalagem', () => {
    const quantity = calculateSuggestedUnits({
        product: { purchaseClassification: 'CLEANING', quantity: 3, idealQuantity: 20, minQuantity: 2, packQuantity: 6 },
        consumed: 500,
        targetDays: 7
    });
    assert.equal(quantity, 3);
});

test('bebida usa o maior valor entre mÃ­nimo e consumo projetado', () => {
    const quantity = calculateSuggestedUnits({
        product: { purchaseClassification: 'CMV_BEVERAGES', quantity: 10, minQuantity: 20, idealQuantity: 999, packQuantity: 12 },
        consumed: 100,
        targetDays: 7
    });
    assert.equal(quantity, 12);
});

test('sugestÃ£o nunca retorna quantidade negativa', () => {
    const quantity = calculateSuggestedUnits({
        product: { purchaseClassification: 'OPERATING', quantity: 30, idealQuantity: 20, minQuantity: 2, packQuantity: 1 },
        consumed: 0,
        targetDays: 7
    });
    assert.equal(quantity, 0);
});
