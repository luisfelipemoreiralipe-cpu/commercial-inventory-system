const test = require('node:test');
const assert = require('node:assert/strict');
const { _private } = require('../src/controllers/salesController');

test('venda usa saldo pronto e explode apenas a produção restante', async () => {
    const totalDemand = {};
    const lemon = {
        id: 'lemon', name: 'Limão', type: 'INVENTORY',
        quantity: -100, packQuantity: 1, defaultLocationId: 'loc'
    };
    const juice = {
        id: 'juice', name: 'Suco', type: 'PRODUCTION',
        quantity: 230, packQuantity: 1, defaultLocationId: 'loc',
        Recipe: {
            yieldQuantity: 1,
            items: [{ quantity: 3.3, product: lemon }]
        }
    };

    await _private.explodeDemandRecursive(juice, 5600, totalDemand, 'est');

    assert.equal(totalDemand.juice_loc.qty, 230);
    assert.equal(totalDemand.lemon_loc.qty, 17721);
});

test('venda respeita packQuantity do produto raiz ao explodir a ficha', async () => {
    const totalDemand = {};
    const ingredient = {
        id: 'ingredient', name: 'Ingrediente', type: 'INVENTORY',
        quantity: 100, packQuantity: 1, defaultLocationId: 'loc'
    };
    const root = {
        id: 'root', name: 'Raiz', type: 'PRODUCTION',
        quantity: 0, packQuantity: 2, defaultLocationId: 'loc',
        Recipe: {
            yieldQuantity: 1,
            items: [{ quantity: 10, product: ingredient }]
        }
    };

    await _private.explodeDemandRecursive(root, 1, totalDemand, 'est');

    assert.equal(totalDemand.ingredient_loc.qty, 20);
});

test('normaliza valores monetários brasileiros do PDV', () => {
    assert.equal(_private.parseMoney('R$ 1.234,56'), 1234.56);
    assert.equal(_private.parseMoney('12,50'), 12.5);
    assert.equal(_private.parseMoney(''), null);
});

test('calcula valor líquido a partir de preço, quantidade e desconto', () => {
    assert.deepEqual(
        _private.financialValues({ quantity: 3, unitSalePrice: '10,00', discountTotal: '5,00' }),
        { unitSalePrice: 10, grossTotal: 30, discountTotal: 5, netTotal: 25 }
    );
});

test('gera a mesma chave para reimportação do mesmo CSV na mesma data', () => {
    const file = Buffer.from('Produto;Quantidade\nGin;2');
    const first = _private.buildCsvExternalId(file, '2026-08-24T12:00:00-03:00');
    const retry = _private.buildCsvExternalId(file, '2026-08-24T18:00:00-03:00');

    assert.equal(first, retry);
    assert.equal(first.length, 64);
});

test('permite o mesmo conteúdo de CSV em outra data de venda', () => {
    const file = Buffer.from('Produto;Quantidade\nGin;2');
    const first = _private.buildCsvExternalId(file, '2026-08-24T12:00:00-03:00');
    const nextDay = _private.buildCsvExternalId(file, '2026-08-25T12:00:00-03:00');

    assert.notEqual(first, nextDay);
});

test('normaliza identificador externo vazio como ausente', () => {
    assert.equal(_private.normalizeExternalId('  venda-123  '), 'venda-123');
    assert.equal(_private.normalizeExternalId('   '), null);
});
