const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeText,
    normalizeBarcode,
    buildProductCandidateKey
} = require('../src/utils/catalogNormalization');

test('normaliza acentos, caixa e pontuação sem fundir palavras', () => {
    assert.equal(normalizeText('  Água Tônica — Lata  '), 'agua tonica lata');
});

test('normaliza código de barras mantendo somente dígitos', () => {
    assert.equal(normalizeBarcode('789-123 456'), '789123456');
    assert.equal(normalizeBarcode(''), null);
});

test('chave candidata considera nome, unidades e embalagem', () => {
    const base = {
        name: 'Heineken Long Neck',
        unit: 'un',
        purchaseUnit: 'caixa',
        packQuantity: 24
    };

    assert.equal(buildProductCandidateKey(base), buildProductCandidateKey({
        ...base,
        name: 'HEINEKEN  LONG-NÉCK'
    }));
    assert.notEqual(buildProductCandidateKey(base), buildProductCandidateKey({
        ...base,
        packQuantity: 12
    }));
});
