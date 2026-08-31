const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
const repositoryPath = require.resolve('../src/repositories/organizationProductRepository');
const servicePath = require.resolve('../src/services/organizationProductService');

const loadService = overrides => {
    const calls = { created: null, linked: 0, audits: [] };
    const tx = {};

    require.cache[prismaPath] = {
        id: prismaPath,
        filename: prismaPath,
        loaded: true,
        exports: { $transaction: async callback => callback(tx) }
    };

    const repository = {
        findEstablishmentScope: async () => ({
            id: 'establishment-a',
            organizationId: 'organization-a'
        }),
        nextCodeNumber: async () => 12,
        create: async data => {
            calls.created = data;
            return { id: 'central-a', ...data };
        },
        createAudit: async data => calls.audits.push(data),
        findById: async () => ({ id: 'central-a', internalCode: 'PROD-000012' }),
        findProductsForLink: async () => [],
        findLocalLinks: async () => [],
        linkProducts: async ids => {
            calls.linked += ids.length;
        },
        ...overrides
    };

    require.cache[repositoryPath] = {
        id: repositoryPath,
        filename: repositoryPath,
        loaded: true,
        exports: repository
    };

    delete require.cache[servicePath];
    return { service: require('../src/services/organizationProductService'), calls };
};

test('formata código interno imutável com sequência da organização', () => {
    const { service } = loadService();
    assert.equal(service.formatInternalCode(1), 'PROD-000001');
    assert.equal(service.formatInternalCode(1234567), 'PROD-1234567');
});

test('cria produto central com código sequencial dentro da organização', async () => {
    const { service, calls } = loadService();

    const result = await service.create({
        name: ' Água Mineral ',
        baseUnit: 'un',
        barcode: '789-123'
    }, 'establishment-a', 'user-a');

    assert.equal(result.internalCode, 'PROD-000012');
    assert.equal(calls.created.organizationId, 'organization-a');
    assert.equal(calls.created.name, 'Água Mineral');
    assert.equal(calls.created.barcode, '789123');
    assert.equal(calls.audits.length, 1);
});

test('rejeita vínculo quando algum produto não pertence à organização', async () => {
    const { service, calls } = loadService({
        findProductsForLink: async () => [{
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Produto A',
            establishmentId: 'establishment-a',
            organizationProductId: null
        }]
    });

    await assert.rejects(
        service.linkProducts('central-a', [
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222'
        ], 'establishment-a', 'user-a'),
        error => error.statusCode === 404
    );
    assert.equal(calls.linked, 0);
});

test('rejeita dois produtos locais do mesmo estabelecimento na mesma identidade', async () => {
    const { service, calls } = loadService({
        findProductsForLink: async () => [
            { id: 'product-a', name: 'A', establishmentId: 'establishment-a', organizationProductId: null },
            { id: 'product-b', name: 'B', establishmentId: 'establishment-a', organizationProductId: null }
        ]
    });

    await assert.rejects(
        service.linkProducts('central-a', ['product-a', 'product-b'], 'establishment-a', 'user-a'),
        error => error.statusCode === 409
    );
    assert.equal(calls.linked, 0);
});

test('vínculo repetido com a mesma identidade é idempotente', async () => {
    const { service, calls } = loadService({
        findProductsForLink: async () => [{
            id: 'product-a',
            name: 'A',
            establishmentId: 'establishment-a',
            organizationProductId: 'central-a'
        }],
        findLocalLinks: async () => [{ id: 'product-a', establishmentId: 'establishment-a' }]
    });

    await service.linkProducts('central-a', ['product-a'], 'establishment-a', 'user-a');
    assert.equal(calls.linked, 0);
});

test('sugere consolidação somente quando o grupo alcança estabelecimentos distintos', () => {
    const { service } = loadService();
    const base = {
        name: 'Água Mineral 500ml',
        unit: 'un',
        purchaseUnit: 'fardo',
        packQuantity: 12
    };
    const groups = service.buildCandidateGroups([
        { id: 'a', ...base, establishment: { id: 'est-a', name: 'A' } },
        { id: 'b', ...base, establishment: { id: 'est-b', name: 'B' } },
        { id: 'c', name: 'Produto isolado', unit: 'un', purchaseUnit: null, packQuantity: 1, establishment: { id: 'est-a', name: 'A' } }
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].confidence, 'EXACT_NORMALIZED');
    assert.deepEqual(groups[0].products.map(product => product.id), ['a', 'b']);
});

test('não sugere dois cadastros equivalentes do mesmo estabelecimento', () => {
    const { service } = loadService();
    const groups = service.buildCandidateGroups([
        { id: 'a', name: 'Café', unit: 'kg', purchaseUnit: 'pct', packQuantity: 1, establishment: { id: 'est-a', name: 'A' } },
        { id: 'b', name: 'Cafe', unit: 'kg', purchaseUnit: 'pct', packQuantity: 1, establishment: { id: 'est-a', name: 'A' } }
    ]);

    assert.equal(groups.length, 0);
});
