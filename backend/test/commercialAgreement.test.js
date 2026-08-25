const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAccrual } = require('../src/services/commercialAgreementService');

test('acumula compras de varias notas ate atingir a bonificacao', () => {
    const first = calculateAccrual({ balanceBefore: 0, eligibleQuantity: 6, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(first, { earnedBonusQuantity: 0, balanceAfter: 6 });
    const second = calculateAccrual({ balanceBefore: first.balanceAfter, eligibleQuantity: 4, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(second, { earnedBonusQuantity: 1, balanceAfter: 0 });
});

test('preserva o saldo excedente e calcula mais de um ciclo', () => {
    const result = calculateAccrual({ balanceBefore: 7, eligibleQuantity: 16, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(result, { earnedBonusQuantity: 2, balanceAfter: 3 });
});

test('aceita mais de uma unidade bonificada por ciclo', () => {
    const result = calculateAccrual({ balanceBefore: 0, eligibleQuantity: 24, buyQuantity: 12, bonusQuantity: 2 });
    assert.deepEqual(result, { earnedBonusQuantity: 4, balanceAfter: 0 });
});
