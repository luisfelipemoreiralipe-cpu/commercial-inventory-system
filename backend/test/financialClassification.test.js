const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/config/prisma');
const movementDate = new Date('2026-08-20T15:00:00.000Z');

const fakePrisma = {
    stockMovement: {
        findMany: async () => [
            { reason: 'SALE', totalCost: 100, createdAt: movementDate, purchaseClassification: 'CMV_BEVERAGES', product: null },
            { reason: 'SALE', totalCost: 999, createdAt: movementDate, purchaseClassification: 'CLEANING', product: null },
            { reason: 'OPERATIONAL_USE', totalCost: 20, createdAt: movementDate, purchaseClassification: 'CLEANING', product: null },
            { reason: 'OPERATIONAL_USE', totalCost: 10, createdAt: movementDate, purchaseClassification: 'DISPOSABLES', product: null },
            { reason: 'OPERATIONAL_USE', totalCost: 5, createdAt: movementDate, purchaseClassification: 'OPERATING', product: null }
        ]
    },
    purchaseOrderItem: {
        findMany: async () => [
            { purchaseClassification: 'CMV_BEVERAGES', adjustedQuantity: 2, unitPrice: 30 },
            { purchaseClassification: 'CLEANING', adjustedQuantity: 3, unitPrice: 10 }
        ]
    },
    sale: {
        findMany: async () => [
            { grossTotal: 250, discountTotal: 50, netTotal: 200, soldAt: movementDate }
        ]
    }
};

require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };
const reportsService = require('../src/services/reportsService');

test('relatório separa CMV de bebidas dos custos operacionais', async () => {
    const result = await reportsService.getFinancialSummary('establishment', '2026-08-20', '2026-08-20');

    assert.equal(result.summary.salesCogs, 100);
    assert.equal(result.summary.cleaningConsumption, 20);
    assert.equal(result.summary.disposablesConsumption, 10);
    assert.equal(result.summary.otherOperationalConsumption, 5);
    assert.equal(result.summary.purchasesByClassification.CMV_BEVERAGES, 60);
    assert.equal(result.summary.purchasesByClassification.CLEANING, 30);
    assert.equal(result.summary.netRevenue, 200);
    assert.equal(result.summary.cogsPercentage, 50);
    assert.equal(result.summary.grossProfit, 100);
    assert.equal(result.summary.grossMarginPercentage, 50);
});
