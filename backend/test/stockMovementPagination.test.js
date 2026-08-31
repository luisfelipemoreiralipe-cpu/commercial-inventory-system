const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
const repositoryPath = require.resolve('../src/repositories/stockMovementRepository');

const calls = { count: [], findMany: [], aggregate: [] };
const aggregateValues = [100, 70, 5, 12];

require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {
        stockMovement: {
            fields: { previousQuantity: { _ref: 'previousQuantity' } },
            count: async (args) => {
                calls.count.push(args);
                return 120;
            },
            findMany: async (args) => {
                calls.findMany.push(args);
                return [{ id: 'movement-1' }];
            },
            aggregate: async (args) => {
                calls.aggregate.push(args);
                return { _sum: { quantity: aggregateValues[calls.aggregate.length - 1] } };
            }
        }
    }
};

delete require.cache[repositoryPath];
const repository = require('../src/repositories/stockMovementRepository');

test('pagina, limita página excedente e calcula resumos independentes', async () => {
    const result = await repository.findPaginated({
        establishmentId: 'establishment-a',
        page: 9,
        pageSize: 50
    });

    assert.deepEqual(result.items, [{ id: 'movement-1' }]);
    assert.deepEqual(result.pagination, {
        page: 3,
        pageSize: 50,
        totalItems: 120,
        totalPages: 3
    });
    assert.equal(calls.findMany[0].skip, 100);
    assert.equal(calls.findMany[0].take, 50);
    assert.equal(calls.findMany[0].where.establishmentId, 'establishment-a');
    assert.deepEqual(result.summary, {
        total: 120,
        entry: 100,
        exit: 70,
        bonus: 5,
        consumption: 12
    });
});
test('classifica compras e transferências recebidas no filtro de entrada', async () => {
    await repository.findPaginated({
        establishmentId: 'establishment-a',
        movementType: 'entry',
        page: 1,
        pageSize: 50
    });

    const where = calls.findMany.at(-1).where;
    assert.deepEqual(where.OR[0], { type: { in: ['PURCHASE', 'IN', 'BONUS'] } });
    assert.equal(where.OR[1].type, 'TRANSFER');
    assert.deepEqual(where.OR[1].newQuantity, { gt: { _ref: 'previousQuantity' } });
});

test('usa limites explícitos de São Paulo para o período', async () => {
    await repository.findPaginated({
        establishmentId: 'establishment-a',
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
        page: 1,
        pageSize: 50
    });

    const createdAt = calls.count.at(-1).where.createdAt;
    assert.equal(createdAt.gte.toISOString(), '2026-08-01T03:00:00.000Z');
    assert.equal(createdAt.lte.toISOString(), '2026-09-01T02:59:59.999Z');
});
