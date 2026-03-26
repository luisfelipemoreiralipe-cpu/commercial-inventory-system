-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sectorId" UUID;

-- CreateTable
CREATE TABLE "stock_audits" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_audit_items" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "systemQuantity" DECIMAL(12,3) NOT NULL,
    "countedQuantity" DECIMAL(12,3) NOT NULL,
    "difference" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "stock_audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_sectors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "establishmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_sectors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "stock_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audits" ADD CONSTRAINT "stock_audits_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audits" ADD CONSTRAINT "stock_audits_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "stock_sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audits" ADD CONSTRAINT "stock_audits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audit_items" ADD CONSTRAINT "stock_audit_items_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "stock_audits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_audit_items" ADD CONSTRAINT "stock_audit_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sectors" ADD CONSTRAINT "stock_sectors_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
