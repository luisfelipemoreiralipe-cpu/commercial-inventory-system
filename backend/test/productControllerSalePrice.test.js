const test = require('node:test');
const assert = require('node:assert/strict');

const calls = [];
const servicePath = require.resolve('../src/services/productService');
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {
    createProduct: async (data, tenant) => { calls.push({ data, tenant }); return data; },
    updateProduct: async (id, data, tenant) => { calls.push({ id, data, tenant }); return data; }
} };
const controller = require('../src/controllers/productController');

test('controller encaminha preço de venda na criação e edição, inclusive zero e remoção', async () => {
    for (const action of ['create', 'update']) {
        for (const salePrice of [25.9, 0, null, undefined]) {
            const req = {
                body: { name: ' Bebida ', salePrice, establishmentId: 'untrusted' },
                params: { id: 'product' }, user: { establishmentId: 'tenant' }
            };
            await new Promise((resolve, reject) => {
                const res = { status() { return this; }, json: resolve };
                controller[action](req, res, reject);
            });
            const call = calls.at(-1);
            assert.equal(call.data.salePrice, salePrice);
            assert.equal(call.data.name, 'Bebida');
            assert.equal(call.tenant, 'tenant');
        }
    }
});
