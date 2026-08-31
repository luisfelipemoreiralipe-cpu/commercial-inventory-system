const service = require('../src/services/organizationProductService');
const prisma = require('../src/utils/prisma');

const establishmentId = process.argv[2];

if (!establishmentId) {
    console.error('Uso: node scripts/smoke-organization-products.js <establishmentId>');
    process.exitCode = 1;
} else {
    Promise.all([
        service.list(establishmentId),
        service.listUnlinked(establishmentId)
    ])
        .then(([centralProducts, unlinkedProducts]) => {
            console.log(JSON.stringify({
                readOnly: true,
                centralProducts: centralProducts.length,
                unlinkedProducts: unlinkedProducts.length
            }, null, 2));
        })
        .catch(error => {
            console.error(error.message);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
