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
