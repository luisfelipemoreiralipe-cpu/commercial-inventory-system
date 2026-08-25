const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/utils/prisma');
const repositoryPath = require.resolve('../src/repositories/productRepository');

const loadRepositoryWithProduct = (product) => {
    require.cache[prismaPath] = {
        id: prismaPath,
        filename: prismaPath,
        loaded: true,
        exports: {
            supplierPriceHistory: { findFirst: async () => null },
            productSupplier: { findFirst: async () => null },
            product: { findFirst: async () => product }
        }
    };

    delete require.cache[repositoryPath];
    return require('../src/repositories/productRepository');
};

test('converte currentCost unitário para valor de pacote sem causar dupla divisão', async () => {
    const repository = loadRepositoryWithProduct({
        currentCost: '0.0017',
        unitPrice: '0',
        packQuantity: 1000
    });

    const packagePrice = await repository.getLastPurchasePrice('xarope', 'estabelecimento');
    const costForTwentyMl = 20 * (packagePrice / 1000);

    assert.equal(packagePrice, 1.7);
    assert.ok(Math.abs(costForTwentyMl - 0.034) < Number.EPSILON);
});

test('mantém currentCost unitário quando o produto não possui embalagem fracionada', async () => {
    const repository = loadRepositoryWithProduct({
        currentCost: '2.5',
        unitPrice: '0',
        packQuantity: 1
    });

    assert.equal(
        await repository.getLastPurchasePrice('gelo', 'estabelecimento'),
        2.5
    );
});
