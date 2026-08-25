CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "externalId" TEXT,
    "grossTotal" DECIMAL(14,2),
    "discountTotal" DECIMAL(14,2),
    "netTotal" DECIMAL(14,2),
    "costTotal" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sale_items" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "productId" UUID,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitSalePrice" DECIMAL(12,4),
    "grossTotal" DECIMAL(14,2),
    "discountTotal" DECIMAL(14,2),
    "netTotal" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_establishmentId_soldAt_idx" ON "sales"("establishmentId", "soldAt");
CREATE INDEX "sales_establishmentId_status_soldAt_idx" ON "sales"("establishmentId", "status", "soldAt");
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");
CREATE UNIQUE INDEX "sales_establishmentId_source_externalId_key" ON "sales"("establishmentId", "source", "externalId");

ALTER TABLE "stock_movements" ADD COLUMN "saleId" UUID;
CREATE INDEX "stock_movements_saleId_idx" ON "stock_movements"("saleId");

ALTER TABLE "sales"
ADD CONSTRAINT "sales_establishmentId_fkey"
FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sale_items"
ADD CONSTRAINT "sale_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
