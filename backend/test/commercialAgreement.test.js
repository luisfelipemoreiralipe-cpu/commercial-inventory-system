const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAccrual } = require('../src/services/commercialAgreementService');

test('calcula cada nota isoladamente sem acumular compras anteriores', () => {
    const first = calculateAccrual({ eligibleQuantity: 9, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(first, { earnedBonusQuantity: 0, balanceAfter: 0 });
    const second = calculateAccrual({ eligibleQuantity: 2, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(second, { earnedBonusQuantity: 0, balanceAfter: 0 });
});

test('descarta o excedente da nota depois de calcular ciclos completos', () => {
    const result = calculateAccrual({ eligibleQuantity: 19, buyQuantity: 10, bonusQuantity: 1 });
    assert.deepEqual(result, { earnedBonusQuantity: 1, balanceAfter: 0 });
});

test('aceita mais de uma unidade bonificada por ciclo', () => {
    const result = calculateAccrual({ eligibleQuantity: 24, buyQuantity: 12, bonusQuantity: 2 });
    assert.deepEqual(result, { earnedBonusQuantity: 4, balanceAfter: 0 });
});
