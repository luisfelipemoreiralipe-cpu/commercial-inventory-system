const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const mode = process.argv[2] || 'snapshot';

async function snapshot() {
    const establishments = await prisma.$queryRawUnsafe(`
        SELECT e.id, e.name,
            (SELECT COUNT(*)::int FROM products p WHERE p."establishmentId" = e.id) AS products,
            (SELECT COUNT(*)::int FROM stock_movements m WHERE m."establishmentId" = e.id) AS movements,
            (SELECT COALESCE(SUM(p.quantity), 0)::text FROM products p WHERE p."establishmentId" = e.id) AS quantity
        FROM establishments e
        WHERE LOWER(e.name) LIKE '%teste%'
        ORDER BY e.name
    `);
    const [global] = await prisma.$queryRawUnsafe(`
        SELECT
            (SELECT COUNT(*)::int FROM products) AS "productCount",
            (SELECT COALESCE(SUM(quantity), 0)::text FROM products) AS "productQuantity",
            (SELECT COUNT(*)::int FROM stock_movements) AS "movementCount",
            (SELECT COALESCE(SUM(quantity), 0)::text FROM stock_movements) AS "movementQuantity",
            (SELECT COALESCE(SUM("totalCost"), 0)::text FROM stock_movements) AS "movementCost"
    `);
    console.log(JSON.stringify({ global, establishments }, null, 2));
}

async function candidates() {
    const rows = await prisma.$queryRawUnsafe(`
        SELECT p.id, p.name, p.type, p.quantity::text, p."packQuantity"::text,
               p."currentCost"::text, p."unitPrice"::text, ps."locationId",
               ps.quantity::text AS "locationQuantity", sl.name AS "locationName",
               (SELECT ue."userId" FROM "UserEstablishment" ue
                 WHERE ue."establishmentId" = e.id AND ue.role = 'ADMIN' LIMIT 1) AS "userId",
               COALESCE(
                 (SELECT poi."unitPrice" / NULLIF(p."packQuantity", 0)
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON po.id = poi."purchaseOrderId"
                   WHERE poi."productId" = p.id AND po."establishmentId" = e.id
                   ORDER BY poi."createdAt" DESC LIMIT 1),
                 (SELECT psu.price / NULLIF(p."packQuantity", 0)
                    FROM product_suppliers psu WHERE psu."productId" = p.id
                   ORDER BY psu.price ASC LIMIT 1),
                 NULLIF(p."currentCost", 0),
                 p."unitPrice" / NULLIF(p."packQuantity", 0),
                 0
               )::text AS "effectiveUnitCost"
        FROM products p
        JOIN establishments e ON e.id = p."establishmentId"
        JOIN product_stocks ps ON ps."productId" = p.id
        JOIN stock_locations sl ON sl.id = ps."locationId"
        WHERE LOWER(e.name) = 'estabelecimento teste'
          AND p."isActive" = true
          AND p."purchaseClassification" = 'CMV_BEVERAGES'
        ORDER BY COALESCE(
          (SELECT poi."unitPrice" FROM purchase_order_items poi WHERE poi."productId" = p.id ORDER BY poi."createdAt" DESC LIMIT 1),
          p."currentCost", p."unitPrice", 0
        ) DESC, ps.quantity DESC, p.name
        LIMIT 20
    `);
    console.log(JSON.stringify(rows, null, 2));
}

async function verify() {
    const [result] = await prisma.$queryRawUnsafe(`
        SELECT
          to_regclass('public.sales') IS NOT NULL AS "salesTable",
          to_regclass('public.sale_items') IS NOT NULL AS "saleItemsTable",
          (SELECT COUNT(*)::int FROM sales) AS sales,
          (SELECT COUNT(*)::int FROM sale_items) AS "saleItems",
          (SELECT COUNT(*)::int FROM stock_movements WHERE "saleId" IS NOT NULL) AS "linkedMovements"
    `);
    console.log(JSON.stringify(result, null, 2));
}

const actions = { snapshot, candidates, verify };

(actions[mode] || (() => { throw new Error(`Modo inválido: ${mode}`); }))()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
