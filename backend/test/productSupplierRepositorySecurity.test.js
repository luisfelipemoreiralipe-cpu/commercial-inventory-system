const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
const repositoryPath = require.resolve('../src/repositories/productSupplierRepository');

const calls = { findMany: null, deleteMany: null };

require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {
        productSupplier: {
            findMany: async args => {
                calls.findMany = args;
                return [];
            },
            deleteMany: async args => {
                calls.deleteMany = args;
                return { count: 0 };
            }
        }
    }
};

delete require.cache[repositoryPath];
const repository = require('../src/repositories/productSupplierRepository');

test('leitura de vínculos filtra produto e fornecedor pelo estabelecimento', async () => {
    await repository.getSuppliersByProduct('product-a', 'establishment-a');

    assert.deepEqual(calls.findMany.where, {
        productId: 'product-a',
        product: { establishmentId: 'establishment-a' },
        supplier: { establishmentId: 'establishment-a' }
    });
});

test('exclusão de vínculo filtra produto e fornecedor pelo estabelecimento', async () => {
    await repository.removeSupplierFromProduct('product-a', 'supplier-a', 'establishment-a');

    assert.deepEqual(calls.deleteMany.where, {
        productId: 'product-a',
        supplierId: 'supplier-a',
        product: { establishmentId: 'establishment-a' },
        supplier: { establishmentId: 'establishment-a' }
    });
});
