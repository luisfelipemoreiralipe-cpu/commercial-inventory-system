const test = require('node:test');
const assert = require('node:assert/strict');
const { serializePriceHistory } = require('../src/utils/priceHistory');

test('calcula aumento de preço comparando a compra com a anterior', () => {
    const result = serializePriceHistory([
        { id: 'new', price: '120.0000', supplier: { name: 'Fornecedor A' } },
        { id: 'old', price: '100.0000', supplier: { name: 'Fornecedor A' } }
    ]);

    assert.equal(result[0].price, 120);
    assert.equal(result[0].previousPrice, 100);
    assert.equal(result[0].absoluteVariation, 20);
    assert.equal(result[0].percentageVariation, 20);
    assert.equal(result[0].supplierName, 'Fornecedor A');
});

test('registra variação zero e mantém a primeira compra sem comparação', () => {
    const result = serializePriceHistory([
        { id: 'new', price: '50.0000' },
        { id: 'old', price: '50.0000' }
    ]);

    assert.equal(result[0].percentageVariation, 0);
    assert.equal(result[1].previousPrice, null);
    assert.equal(result[1].percentageVariation, null);
});

test('não calcula percentual quando o preço anterior é zero', () => {
    const result = serializePriceHistory([
        { id: 'new', price: '10.0000' },
        { id: 'old', price: '0.0000' }
    ]);

    assert.equal(result[0].absoluteVariation, 10);
    assert.equal(result[0].percentageVariation, null);
});
