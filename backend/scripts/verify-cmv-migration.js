const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const baseline = {
    productCount: 432,
    productQuantity: '2836511.784',
    purchaseItemCount: 805,
    purchaseItemsWithoutProduct: 1,
    movementCount: 6837,
    movementsWithoutProduct: 15,
    movementQuantity: '40193424.749',
    movementCost: '1278979.7087'
};

async function main() {
    const [current] = await prisma.$queryRaw`
        SELECT
            (SELECT COUNT(*)::int FROM "products") AS "productCount",
            (SELECT COALESCE(SUM("quantity"), 0)::text FROM "products") AS "productQuantity",
            (SELECT COUNT(*)::int FROM "purchase_order_items") AS "purchaseItemCount",
            (SELECT COUNT(*)::int FROM "purchase_order_items" WHERE "productId" IS NULL) AS "purchaseItemsWithoutProduct",
            (SELECT COUNT(*)::int FROM "stock_movements") AS "movementCount",
            (SELECT COUNT(*)::int FROM "stock_movements" WHERE "productId" IS NULL) AS "movementsWithoutProduct",
            (SELECT COALESCE(SUM("quantity"), 0)::text FROM "stock_movements") AS "movementQuantity",
            (SELECT COALESCE(SUM("totalCost"), 0)::text FROM "stock_movements") AS "movementCost"
    `;

    const differences = Object.entries(baseline)
        .filter(([key, value]) => String(current[key]) !== String(value))
        .map(([key, value]) => ({ key, expected: value, current: current[key] }));
    if (differences.length) throw new Error(`Linha de base alterada: ${JSON.stringify(differences)}`);

    const classifications = await prisma.product.groupBy({
        by: ['establishmentId', 'purchaseClassification'],
        _count: { _all: true }
    });
    const [nullCounts] = await prisma.$queryRaw`
        SELECT
            (SELECT COUNT(*)::int FROM "products" WHERE "purchaseClassification" IS NULL) AS "invalidProducts",
            (SELECT COUNT(*)::int FROM "purchase_order_items" WHERE "purchaseClassification" IS NULL) AS "invalidOrderItems"
    `;
    const { invalidProducts, invalidOrderItems } = nullCounts;

    if (invalidProducts || invalidOrderItems) {
        throw new Error(`ClassificaÃ§Ãµes nulas: produtos=${invalidProducts}; itens=${invalidOrderItems}.`);
    }

    console.log(JSON.stringify({ baselinePreserved: true, classifications, invalidProducts, invalidOrderItems }, null, 2));
}

main()
    .catch(error => { console.error(error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
