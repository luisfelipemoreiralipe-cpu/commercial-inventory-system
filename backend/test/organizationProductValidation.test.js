const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createOrganizationProductSchema,
    updateOrganizationProductSchema,
    linkOrganizationProductsSchema,
    approveProductCandidateSchema
} = require('../src/validations/organizationProductValidation');

test('não aceita internalCode informado pelo cliente', () => {
    const result = createOrganizationProductSchema.safeParse({
        name: 'Produto',
        baseUnit: 'un',
        internalCode: 'PROD-999999'
    });
    assert.equal(result.success, false);
});

test('não aceita edição vazia nem alteração de internalCode', () => {
    assert.equal(updateOrganizationProductSchema.safeParse({}).success, false);
    assert.equal(updateOrganizationProductSchema.safeParse({ internalCode: 'PROD-999999' }).success, false);
});

test('remove IDs duplicados no service, mas valida formato UUID na borda', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    assert.equal(linkOrganizationProductsSchema.safeParse({ productIds: [id, id] }).success, true);
    assert.equal(linkOrganizationProductsSchema.safeParse({ productIds: ['invalido'] }).success, false);
});

test('aprova candidato somente com pelo menos dois produtos', () => {
    const result = approveProductCandidateSchema.safeParse({
        candidateKey: 'agua|un|fardo|12',
        productIds: ['11111111-1111-4111-8111-111111111111'],
        name: 'Água',
        baseUnit: 'un'
    });

    assert.equal(result.success, false);
});
