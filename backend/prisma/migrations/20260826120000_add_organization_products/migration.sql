-- CreateTable
CREATE TABLE "organization_products" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "baseUnit" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_product_sequences" (
    "organizationId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "organization_product_sequences_pkey" PRIMARY KEY ("organizationId")
);

-- AlterTable
ALTER TABLE "products" ADD COLUMN "organizationProductId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "organization_products_organizationId_internalCode_key"
ON "organization_products"("organizationId", "internalCode");

-- CreateIndex
CREATE INDEX "organization_products_organizationId_barcode_idx"
ON "organization_products"("organizationId", "barcode");

-- CreateIndex
CREATE INDEX "products_organizationProductId_idx"
ON "products"("organizationProductId");

-- CreateIndex
CREATE UNIQUE INDEX "products_establishmentId_organizationProductId_key"
ON "products"("establishmentId", "organizationProductId");

-- AddForeignKey
ALTER TABLE "organization_products"
ADD CONSTRAINT "organization_products_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_product_sequences"
ADD CONSTRAINT "organization_product_sequences_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"
ADD CONSTRAINT "products_organizationProductId_fkey"
FOREIGN KEY ("organizationProductId") REFERENCES "organization_products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
