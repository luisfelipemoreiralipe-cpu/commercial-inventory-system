const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');

const snapshotPath = process.argv[2];
const quoteIdentifier = value => `"${String(value).replace(/"/g, '""')}"`;

if (!snapshotPath) {
    console.error('Uso: node scripts/verify-organization-products-migration.js <snapshot.json>');
    process.exitCode = 1;
} else {
    verify(snapshotPath)
        .catch(error => {
            console.error(error.message);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}

async function verify(target) {
    const snapshot = JSON.parse(fs.readFileSync(path.resolve(target), 'utf8'));
    const oldCounts = snapshot.counts;
    const currentCounts = {};

    for (const tableName of Object.keys(oldCounts)) {
        const safeTable = quoteIdentifier(tableName);
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM ${safeTable}`);
        currentCounts[tableName] = Number(result[0].count);
    }

    const changedOldTables = Object.keys(oldCounts)
        .filter(tableName => Number(oldCounts[tableName]) !== currentCounts[tableName])
        .map(tableName => ({
            table: tableName,
            before: Number(oldCounts[tableName]),
            after: currentCounts[tableName]
        }));

    const [centralProducts, sequences, linkedProducts, products] = await Promise.all([
        prisma.organizationProduct.count(),
        prisma.organizationProductSequence.count(),
        prisma.product.count({ where: { organizationProductId: { not: null } } }),
        prisma.product.count()
    ]);

    const snapshotTime = new Date(snapshot.server.snapshot_time);
    const productsCreatedAfterSnapshot = await prisma.product.findMany({
        where: { createdAt: { gt: snapshotTime } },
        select: {
            id: true,
            name: true,
            createdAt: true,
            establishment: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
    });

    const unexplainedChanges = changedOldTables.filter(change => {
        if (change.table === '_prisma_migrations' && change.after === change.before + 1) return false;
        if (change.table === 'products'
            && change.after - change.before === productsCreatedAfterSnapshot.length) return false;
        return true;
    });

    const result = {
        valid: unexplainedChanges.length === 0
            && centralProducts === 0
            && sequences === 0
            && linkedProducts === 0,
        previousTablesChecked: Object.keys(oldCounts).length,
        changedOldTables,
        unexplainedChanges,
        productsCreatedAfterSnapshot,
        products,
        organizationProducts: centralProducts,
        organizationProductSequences: sequences,
        linkedProducts
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
}
