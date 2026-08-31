const test = require('node:test');
const assert = require('node:assert/strict');
const requireRole = require('../src/middlewares/requireRole');

const execute = role => {
    const response = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
    let nextCalled = false;

    requireRole(['ADMIN'])({ user: role ? { role } : {} }, response, () => {
        nextCalled = true;
    });

    return { response, nextCalled };
};

test('autoriza função administrativa', () => {
    const result = execute('ADMIN');
    assert.equal(result.nextCalled, true);
    assert.equal(result.response.statusCode, 200);
});

test('nega função sem permissão', () => {
    const result = execute('STOCK_COUNTER');
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 403);
});

test('nega requisição sem função autenticada', () => {
    const result = execute(null);
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 401);
});
