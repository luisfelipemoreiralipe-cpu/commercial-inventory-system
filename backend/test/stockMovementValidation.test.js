const test = require('node:test');
const assert = require('node:assert/strict');
const { listQuerySchema } = require('../src/validations/stockMovementValidation');

test('aceita paginação e filtros válidos', () => {
    const parsed = listQuerySchema.parse({
        page: '2',
        pageSize: '50',
        movementType: 'entry',
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31'
    });

    assert.equal(parsed.page, 2);
    assert.equal(parsed.pageSize, 50);
});
test('mantém consultas antigas sem paginação e aceita limit', () => {
    assert.equal(listQuerySchema.parse({ type: 'OUT' }).pageSize, undefined);
    assert.equal(listQuerySchema.parse({ page: '1', limit: '100' }).limit, 100);
});

test('rejeita UUID, período, tipo e limites inválidos', () => {
    assert.equal(listQuerySchema.safeParse({ productId: 'invalid' }).success, false);
    assert.equal(listQuerySchema.safeParse({ movementType: 'unknown' }).success, false);
    assert.equal(listQuerySchema.safeParse({ pageSize: '101' }).success, false);
    assert.equal(listQuerySchema.safeParse({ dateFrom: '2026-02-30' }).success, false);
    assert.equal(listQuerySchema.safeParse({ dateFrom: '2026-09-01', dateTo: '2026-08-31' }).success, false);
});
