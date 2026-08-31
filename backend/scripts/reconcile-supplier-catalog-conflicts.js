require('dotenv').config();

const prisma = require('../src/utils/prisma');
const supplierArg = process.argv.find(argument => argument.startsWith('--supplier-id='));
const organizationSupplierId = supplierArg?.split('=')[1];
const apply = process.argv.includes('--apply');

if (!organizationSupplierId) throw new Error('Informe --supplier-id=<uuid>.');

async function run() {
    const links = await prisma.productSupplier.findMany({
        where: {
            price: { gt: 0 },
            product: { organizationProductId: { not: null } },
            supplier: { organizationSupplierId }
        },
        include: {
            product: { select: { organizationProductId: true, purchaseUnit: true, unit: true, packQuantity: true, establishmentId: true } },
            supplier: { select: { establishmentId: true } }
        }
    });
    const groups = new Map();
    for (const link of links) {
        if (link.product.establishmentId !== link.supplier.establishmentId) continue;
        const productId = link.product.organizationProductId;
        groups.set(productId, [...(groups.get(productId) || []), link]);
    }
    const existing = await prisma.supplierCatalogItem.findMany({ where: { organizationSupplierId }, select: { organizationProductId: true } });
    const existingIds = new Set(existing.map(item => item.organizationProductId));
    const candidates = [];
    for (const [organizationProductId, items] of groups) {
        if (existingIds.has(organizationProductId)) continue;
        const first = items[0];
        const unitsPerPackage = Number(first.product.packQuantity || 1);
        const packagePrice = Number(first.price);
        candidates.push({
            organizationProductId,
            commercialUnit: first.product.purchaseUnit || first.product.unit,
            unitsPerPackage,
            packagePrice,
            normalizedUnitPrice: Number((packagePrice / unitsPerPackage).toFixed(4)),
            localLinks: items.length,
            previousPrices: [...new Set(items.map(item => Number(item.price)))]
        });
    }
    if (apply) {
        await prisma.$transaction(candidates.map(candidate => prisma.supplierCatalogItem.create({
            data: {
                organizationSupplierId,
                organizationProductId: candidate.organizationProductId,
                commercialUnit: candidate.commercialUnit,
                unitsPerPackage: candidate.unitsPerPackage,
                packagePrice: candidate.packagePrice,
                normalizedUnitPrice: candidate.normalizedUnitPrice,
                available: true,
                status: 'PENDING'
            }
        })));
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', organizationSupplierId, candidates: candidates.length, created: apply ? candidates.length : 0, items: candidates }, null, 2));
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
