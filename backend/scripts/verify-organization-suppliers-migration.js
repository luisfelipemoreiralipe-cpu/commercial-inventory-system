const prisma = require('../src/utils/prisma');

async function verify() {
    const [organizationSuppliers, organizationSupplierReviews, linkedLocalSuppliers, totalLocalSuppliers] = await Promise.all([
        prisma.organizationSupplier.count(),
        prisma.organizationSupplierReview.count(),
        prisma.supplier.count({ where: { organizationSupplierId: { not: null } } }),
        prisma.supplier.count()
    ]);

    const result = {
        valid: organizationSuppliers === 0
            && organizationSupplierReviews === 0
            && linkedLocalSuppliers === 0,
        organizationSuppliers,
        organizationSupplierReviews,
        linkedLocalSuppliers,
        totalLocalSuppliers
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
}

verify()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
