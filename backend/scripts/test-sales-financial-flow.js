require('dotenv').config();

const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

const testCase = {
    establishmentId: '32638f69-422d-4d02-84f0-40b7ec68cae4',
    userId: 'beb36cf7-aeb7-40bf-9388-2feb880feb2a',
    productId: 'bcb0a494-2028-4797-ab96-c28ab10d81e8',
    locationId: '35a0c972-d775-4dff-9bca-da1789c5c231',
    externalId: 'cmv-validation-20260824-absolut-v1',
    soldAt: '2026-08-24T12:00:00-03:00',
    quantity: 0.01,
    unitSalePrice: 100,
    discountTotal: 0
};

async function request(baseUrl, path, token, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    const body = await response.json();
    return { status: response.status, body };
}

async function main() {
    if (!process.argv.includes('--execute')) {
        throw new Error('Use --execute para confirmar a venda controlada no estabelecimento teste.');
    }

    const beforeProduct = await prisma.product.findFirstOrThrow({
        where: { id: testCase.productId, establishmentId: testCase.establishmentId },
        select: { name: true, quantity: true, packQuantity: true }
    });
    const beforeStock = await prisma.productStock.findUniqueOrThrow({
        where: { productId_locationId: { productId: testCase.productId, locationId: testCase.locationId } },
        select: { quantity: true }
    });

    const server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const token = jwt.sign({
        userId: testCase.userId,
        establishmentId: testCase.establishmentId,
        role: 'ADMIN'
    }, process.env.JWT_SECRET, { expiresIn: '10m' });

    try {
        const payload = {
            items: [{
                productId: testCase.productId,
                quantity: testCase.quantity,
                unitSalePrice: testCase.unitSalePrice,
                discountTotal: testCase.discountTotal
            }],
            locationId: testCase.locationId,
            soldAt: testCase.soldAt,
            externalId: testCase.externalId
        };

        const first = await request(baseUrl, '/sales/manual', token, {
            method: 'POST', body: JSON.stringify(payload)
        });
        if (![200, 409].includes(first.status)) {
            throw new Error(`Venda falhou (${first.status}): ${JSON.stringify(first.body)}`);
        }

        const duplicate = await request(baseUrl, '/sales/manual', token, {
            method: 'POST', body: JSON.stringify(payload)
        });
        if (duplicate.status !== 409) {
            throw new Error(`Idempotência falhou: esperado 409, recebido ${duplicate.status}.`);
        }

        const sale = await prisma.sale.findFirstOrThrow({
            where: {
                establishmentId: testCase.establishmentId,
                source: 'MANUAL',
                externalId: testCase.externalId
            },
            include: { items: true, stockMovements: true }
        });
        const afterProduct = await prisma.product.findUniqueOrThrow({
            where: { id: testCase.productId }, select: { quantity: true }
        });
        const afterStock = await prisma.productStock.findUniqueOrThrow({
            where: { productId_locationId: { productId: testCase.productId, locationId: testCase.locationId } },
            select: { quantity: true }
        });
        const report = await request(baseUrl, '/reports/financial-summary?dateFrom=2026-08-24&dateTo=2026-08-24', token);
        if (report.status !== 200) throw new Error(`Relatório falhou (${report.status}).`);

        const movementCost = sale.stockMovements.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
        const expectedConsumed = testCase.quantity * Number(beforeProduct.packQuantity || 1);
        const result = {
            requestStatus: first.status,
            duplicateStatus: duplicate.status,
            sale: {
                id: sale.id,
                product: beforeProduct.name,
                grossTotal: Number(sale.grossTotal),
                netTotal: Number(sale.netTotal),
                costTotal: Number(sale.costTotal),
                items: sale.items.length,
                linkedMovements: sale.stockMovements.length,
                movementCost
            },
            stock: {
                expectedConsumed,
                globalBefore: Number(beforeProduct.quantity),
                globalAfter: Number(afterProduct.quantity),
                localBefore: Number(beforeStock.quantity),
                localAfter: Number(afterStock.quantity)
            },
            report: report.body.data?.summary
        };

        if (Math.abs(Number(sale.costTotal) - movementCost) > 0.0001) throw new Error('Custo da venda diverge dos movimentos.');
        if (sale.stockMovements.length < 1) throw new Error('Venda sem movimento vinculado.');
        if (first.status === 200) {
            if (Math.abs((Number(beforeProduct.quantity) - Number(afterProduct.quantity)) - expectedConsumed) > 0.0001) {
                throw new Error('Saldo global não baixou a quantidade esperada.');
            }
            if (Math.abs((Number(beforeStock.quantity) - Number(afterStock.quantity)) - expectedConsumed) > 0.0001) {
                throw new Error('Saldo local não baixou a quantidade esperada.');
            }
        }
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await new Promise(resolve => server.close(resolve));
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
