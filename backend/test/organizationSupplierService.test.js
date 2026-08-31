const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
const repositoryPath = require.resolve('../src/repositories/organizationSupplierRepository');
const servicePath = require.resolve('../src/services/organizationSupplierService');

const loadService = overrides => {
    const calls = { linked: 0, created: null };
    require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { $transaction: async callback => callback({}) } };
    const repository = {
        findEstablishmentScope: async () => ({ id: 'est-a', organizationId: 'org-a' }),
        findReview: async () => null,
        findForLink: async () => [],
        create: async data => { calls.created = data; return { id: 'central-a', ...data }; },
        link: async ids => { calls.linked += ids.length; },
        upsertReview: async (_org, key, data) => ({ candidateKey: key, ...data }),
        createAudit: async () => {},
        findById: async () => ({ id: 'central-a', name: 'Central' }),
        ...overrides
    };
    require.cache[repositoryPath] = { id: repositoryPath, filename: repositoryPath, loaded: true, exports: repository };
    delete require.cache[servicePath];
    return { service: require('../src/services/organizationSupplierService'), calls };
};

test('normaliza CNPJ e rejeita valor incompleto', () => {
    const { service } = loadService();
    assert.equal(service.normalizeCnpj('12.345.678/0001-90'), '12345678000190');
    assert.equal(service.normalizeCnpj('123'), null);
});

test('sugere consolidação apenas para o mesmo CNPJ em estabelecimentos distintos', () => {
    const { service } = loadService();
    const groups = service.buildCandidateGroups([
        { id: 'a', name: 'Fornecedor A', cnpj: '12.345.678/0001-90', establishmentId: 'est-a' },
        { id: 'b', name: 'Fornecedor A Ltda', cnpj: '12345678000190', establishmentId: 'est-b' },
        { id: 'c', name: 'Sem CNPJ', cnpj: null, establishmentId: 'est-c' }
    ]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].confidence, 'EXACT_CNPJ');
});

test('aprovação recusa fornecedor de outra organização', async () => {
    const { service, calls } = loadService({ findForLink: async () => [{ id: 'a', cnpj: '12345678000190', establishmentId: 'est-a', organizationSupplierId: null }] });
    await assert.rejects(service.approveCandidate({ candidateKey: '12345678000190', supplierIds: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'], name: 'Fornecedor A' }, 'est-a', 'user-a'), error => error.statusCode === 404);
    assert.equal(calls.linked, 0);
});

test('aprovação cria identidade e vincula fornecedores atomicamente', async () => {
    const suppliers = [
        { id: '11111111-1111-4111-8111-111111111111', cnpj: '12.345.678/0001-90', establishmentId: 'est-a', organizationSupplierId: null },
        { id: '22222222-2222-4222-8222-222222222222', cnpj: '12345678000190', establishmentId: 'est-b', organizationSupplierId: null }
    ];
    const { service, calls } = loadService({ findForLink: async () => suppliers });
    const result = await service.approveCandidate({ candidateKey: '12345678000190', supplierIds: suppliers.map(item => item.id), name: 'Fornecedor A' }, 'est-a', 'user-a');
    assert.equal(result.idempotent, false);
    assert.equal(calls.created.organizationId, 'org-a');
    assert.equal(calls.linked, 2);
});
