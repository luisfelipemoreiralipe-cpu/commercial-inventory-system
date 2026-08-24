CREATE TYPE "PurchaseClassification" AS ENUM (
    'CMV_BEVERAGES',
    'CLEANING',
    'DISPOSABLES',
    'OPERATING',
    'EXCLUDED'
);

CREATE TYPE "RestockFrequency" AS ENUM (
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'ON_DEMAND'
);

ALTER TABLE "products"
    ADD COLUMN "purchaseClassification" "PurchaseClassification" NOT NULL DEFAULT 'CMV_BEVERAGES',
    ADD COLUMN "restockFrequency" "RestockFrequency" NOT NULL DEFAULT 'ON_DEMAND',
    ADD COLUMN "idealQuantity" DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "responsibleSector" TEXT;

UPDATE "products" AS p
SET "purchaseClassification" = CASE
    WHEN p."type" = 'ASSET' THEN 'EXCLUDED'::"PurchaseClassification"
    WHEN LOWER(p."name") IN ('açucar', 'açúcar') THEN 'CMV_BEVERAGES'::"PurchaseClassification"
    WHEN EXISTS (
        SELECT 1 FROM "categories" c
        WHERE c."id" = p."categoryId"
          AND (
              c."name" ILIKE '%comida%'
              OR c."name" ILIKE '%carne%'
              OR c."name" ILIKE '%milkshake%'
              OR c."name" ILIKE '%alimento%'
          )
    ) THEN 'EXCLUDED'::"PurchaseClassification"
    WHEN EXISTS (
        SELECT 1 FROM "categories" c
        WHERE c."id" = p."categoryId"
          AND (c."name" ILIKE '%limpeza%' OR c."name" ILIKE '%higiene%')
    ) THEN 'CLEANING'::"PurchaseClassification"
    WHEN EXISTS (
        SELECT 1 FROM "categories" c
        WHERE c."id" = p."categoryId"
          AND (c."name" ILIKE '%descart%' OR c."name" ILIKE '%embalagem%')
    ) THEN 'DISPOSABLES'::"PurchaseClassification"
    ELSE 'CMV_BEVERAGES'::"PurchaseClassification"
END;

UPDATE "products"
SET "trackInventory" = false
WHERE "type" = 'ASSET';

ALTER TABLE "purchase_order_items"
    ADD COLUMN "purchaseClassification" "PurchaseClassification" NOT NULL DEFAULT 'CMV_BEVERAGES';

UPDATE "purchase_order_items" AS poi
SET "purchaseClassification" = p."purchaseClassification"
FROM "products" p
WHERE poi."productId" = p."id";

UPDATE "purchase_order_items"
SET "purchaseClassification" = 'EXCLUDED'
WHERE "productId" IS NULL;

CREATE INDEX "products_establishmentId_purchaseClassification_idx"
    ON "products"("establishmentId", "purchaseClassification");

CREATE INDEX "purchase_order_items_purchaseClassification_idx"
    ON "purchase_order_items"("purchaseClassification");

ALTER TABLE "stock_movements"
    ADD COLUMN "purchaseClassification" "PurchaseClassification",
    ADD COLUMN "responsibleSector" TEXT,
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "periodFrom" TIMESTAMP(3),
    ADD COLUMN "periodTo" TIMESTAMP(3),
    ADD COLUMN "recordedByUserId" UUID;

CREATE INDEX "stock_movements_establishmentId_purchaseClassification_createdAt_idx"
    ON "stock_movements"("establishmentId", "purchaseClassification", "createdAt");

UPDATE "stock_movements" AS sm
SET "purchaseClassification" = p."purchaseClassification"
FROM "products" p
WHERE sm."productId" = p."id"
  AND sm."purchaseClassification" IS NULL;
