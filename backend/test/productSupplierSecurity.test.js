const test = require('node:test');
const assert = require('node:assert/strict');

const productRepositoryPath = require.resolve('../src/repositories/productRepository');
const supplierRepositoryPath = require.resolve('../src/repositories/supplierRepository');
const productSupplierRepositoryPath = require.resolve('../src/repositories/productSupplierRepository');
const servicePath = require.resolve('../src/services/productSupplierService');

const loadService = ({ product, supplier }) => {
    const calls = { supplierLookups: [], upserts: 0, removals: 0 };

    require.cache[productRepositoryPath] = {
        id: productRepositoryPath,
        filename: productRepositoryPath,
        loaded: true,
        exports: {
            findByIdAndEstablishment: async () => product
        }
    };

    require.cache[supplierRepositoryPath] = {
        id: supplierRepositoryPath,
        filename: supplierRepositoryPath,
        loaded: true,
        exports: {
            findById: async (supplierId, establishmentId) => {
                calls.supplierLookups.push({ supplierId, establishmentId });
                return supplier;
            }
        }
    };

    require.cache[productSupplierRepositoryPath] = {
        id: productSupplierRepositoryPath,
        filename: productSupplierRepositoryPath,
        loaded: true,
        exports: {
            upsertSupplierToProduct: async () => {
                calls.upserts += 1;
                return {};
            },
            removeSupplierFromProduct: async () => {
                calls.removals += 1;
            }
        }
    };

    delete require.cache[servicePath];
    return { service: require('../src/services/productSupplierService'), calls };
};

test('não permite vincular fornecedor que não pertence ao estabelecimento', async () => {
    const { service, calls } = loadService({
        product: { id: 'product-a' },
        supplier: null
    });

    await assert.rejects(
        service.addSupplierToProduct('product-a', 'supplier-b', 10, 'establishment-a', false),
        error => error.statusCode === 404
    );

    assert.deepEqual(calls.supplierLookups, [
        { supplierId: 'supplier-b', establishmentId: 'establishment-a' }
    ]);
    assert.equal(calls.upserts, 0);
});

test('não permite remover vínculo usando fornecedor de outro estabelecimento', async () => {
    const { service, calls } = loadService({
        product: { id: 'product-a' },
        supplier: null
    });

    await assert.rejects(
        service.removeSupplierFromProduct('product-a', 'supplier-b', 'establishment-a'),
        error => error.statusCode === 404
    );

    assert.deepEqual(calls.supplierLookups, [
        { supplierId: 'supplier-b', establishmentId: 'establishment-a' }
    ]);
    assert.equal(calls.removals, 0);
});
