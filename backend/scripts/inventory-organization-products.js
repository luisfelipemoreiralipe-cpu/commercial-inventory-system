const prisma = require('../src/utils/prisma');
const { buildProductCandidateKey } = require('../src/utils/catalogNormalization');

const establishmentId = process.argv[2];
const summaryOnly = process.argv.includes('--summary');

if (establishmentId === '--list') {
    listScopes().catch(handleError).finally(() => prisma.$disconnect());
} else if (!establishmentId) {
    console.error('Uso: node scripts/inventory-organization-products.js <establishmentId|--list>');
    process.exitCode = 1;
} else {
    run().catch(handleError).finally(() => prisma.$disconnect());
}

function handleError(error) {
    console.error(error.message);
    process.exitCode = 1;
}

async function listScopes() {
    const establishments = await prisma.establishments.findMany({
        select: {
            id: true,
            name: true,
            organizationId: true,
            organization: { select: { name: true } },
            _count: { select: { products: true, suppliers: true } }
        },
        orderBy: [{ organizationId: 'asc' }, { name: 'asc' }]
    });

    console.log(JSON.stringify({
        generatedAt: new Date().toISOString(),
        readOnly: true,
        establishments
    }, null, 2));
}

async function run() {
    const current = await prisma.establishments.findUnique({
        where: { id: establishmentId },
        select: { id: true, name: true, organizationId: true }
    });

    if (!current) throw new Error('Estabelecimento não encontrado.');

    const establishmentFilter = current.organizationId
        ? { organizationId: current.organizationId }
        : { id: current.id };

    const products = await prisma.product.findMany({
        where: { establishment: establishmentFilter },
        select: {
            id: true,
            name: true,
            unit: true,
            purchaseUnit: true,
            packQuantity: true,
            isActive: true,
            type: true,
            purchaseClassification: true,
            trackInventory: true,
            establishment: { select: { id: true, name: true } }
        },
        orderBy: [{ name: 'asc' }, { establishmentId: 'asc' }]
    });

    const eligibleProducts = products.filter(product =>
        product.isActive
        && product.type === 'INVENTORY'
        && product.purchaseClassification !== 'EXCLUDED'
    );

    const groups = new Map();
    for (const product of eligibleProducts) {
        const key = buildProductCandidateKey(product);
        const group = groups.get(key) || [];
        group.push(product);
        groups.set(key, group);
    }

    const candidates = [...groups.entries()]
        .map(([key, items]) => ({
            key,
            classification: new Set(items.map(item => item.establishment.id)).size > 1
                ? 'EXACT_NORMALIZED_CANDIDATE'
                : 'ISOLATED',
            items
        }))
        .sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));

    const report = {
        generatedAt: new Date().toISOString(),
        readOnly: true,
        scope: {
            organizationId: current.organizationId,
            sourceEstablishmentId: current.id,
            sourceEstablishmentName: current.name
        },
        totals: {
            products: products.length,
            eligibleForSupplierCatalog: eligibleProducts.length,
            excludedFromSupplierCatalog: products.length - eligibleProducts.length,
            alreadyLinked: null,
            unlinked: eligibleProducts.length,
            candidateGroups: candidates.filter(item => item.classification === 'EXACT_NORMALIZED_CANDIDATE').length,
            isolatedGroups: candidates.filter(item => item.classification === 'ISOLATED').length
        },
        candidates
    };

    if (summaryOnly) {
        console.log(JSON.stringify({
            ...report,
            candidates: candidates
                .filter(item => item.classification === 'EXACT_NORMALIZED_CANDIDATE')
                .map(item => ({
                    key: item.key,
                    establishments: item.items.map(product => product.establishment.name),
                    products: item.items.map(product => ({
                        id: product.id,
                        name: product.name,
                        unit: product.unit,
                        purchaseUnit: product.purchaseUnit,
                        packQuantity: product.packQuantity,
                        establishment: product.establishment.name
                    }))
                }))
        }, null, 2));
        return;
    }

    console.log(JSON.stringify(report, null, 2));
}
