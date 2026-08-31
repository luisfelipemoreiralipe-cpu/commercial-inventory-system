const prisma = require('../src/utils/prisma');

async function verify() {
    const [catalogItems, updates, updateItems, productSuppliers, priceHistory] = await Promise.all([
        prisma.supplierCatalogItem.count(),
        prisma.supplierPriceUpdate.count(),
        prisma.supplierPriceUpdateItem.count(),
        prisma.productSupplier.count(),
        prisma.supplierPriceHistory.count()
    ]);
    const result = {
        valid: catalogItems === 0 && updates === 0 && updateItems === 0,
        catalogItems, updates, updateItems, productSuppliers, priceHistory
    };
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
}
verify().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
