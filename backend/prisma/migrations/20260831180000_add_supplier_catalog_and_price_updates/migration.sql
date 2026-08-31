CREATE TABLE "supplier_catalog_items" (
    "id" UUID NOT NULL, "organizationSupplierId" UUID NOT NULL, "organizationProductId" UUID NOT NULL,
    "supplierCode" TEXT, "commercialUnit" TEXT NOT NULL, "unitsPerPackage" DECIMAL(12,3) NOT NULL,
    "packagePrice" DECIMAL(12,4) NOT NULL, "normalizedUnitPrice" DECIMAL(12,4) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true, "minimumOrder" DECIMAL(12,3), "deliveryLeadDays" INTEGER,
    "validUntil" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'ACTIVE', "lastSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_catalog_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "supplier_price_updates" (
    "id" UUID NOT NULL, "organizationSupplierId" UUID NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT, "submittedAt" TIMESTAMP(3), "approvedAt" TIMESTAMP(3), "appliedAt" TIMESTAMP(3),
    "approvedByUserId" UUID, "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_price_updates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "supplier_price_update_items" (
    "id" UUID NOT NULL, "supplierPriceUpdateId" UUID NOT NULL, "supplierCatalogItemId" UUID NOT NULL,
    "previousPackagePrice" DECIMAL(12,4) NOT NULL, "newPackagePrice" DECIMAL(12,4) NOT NULL,
    "previousNormalizedPrice" DECIMAL(12,4) NOT NULL, "newNormalizedPrice" DECIMAL(12,4) NOT NULL,
    "commercialUnit" TEXT NOT NULL, "unitsPerPackage" DECIMAL(12,3) NOT NULL, "available" BOOLEAN NOT NULL,
    "deliveryLeadDays" INTEGER, "status" TEXT NOT NULL DEFAULT 'PENDING', "rejectionReason" TEXT,
    "affectedEstablishments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_price_update_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "supplier_catalog_items_organizationSupplierId_organizationProductId_key" ON "supplier_catalog_items"("organizationSupplierId", "organizationProductId");
CREATE INDEX "supplier_catalog_items_organizationProductId_idx" ON "supplier_catalog_items"("organizationProductId");
CREATE INDEX "supplier_price_updates_organizationSupplierId_status_idx" ON "supplier_price_updates"("organizationSupplierId", "status");
CREATE UNIQUE INDEX "supplier_price_update_items_supplierPriceUpdateId_supplierCatalogItemId_key" ON "supplier_price_update_items"("supplierPriceUpdateId", "supplierCatalogItemId");
CREATE INDEX "supplier_price_update_items_supplierCatalogItemId_idx" ON "supplier_price_update_items"("supplierCatalogItemId");
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_organizationSupplierId_fkey" FOREIGN KEY ("organizationSupplierId") REFERENCES "organization_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_organizationProductId_fkey" FOREIGN KEY ("organizationProductId") REFERENCES "organization_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_price_updates" ADD CONSTRAINT "supplier_price_updates_organizationSupplierId_fkey" FOREIGN KEY ("organizationSupplierId") REFERENCES "organization_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_price_update_items" ADD CONSTRAINT "supplier_price_update_items_supplierPriceUpdateId_fkey" FOREIGN KEY ("supplierPriceUpdateId") REFERENCES "supplier_price_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_price_update_items" ADD CONSTRAINT "supplier_price_update_items_supplierCatalogItemId_fkey" FOREIGN KEY ("supplierCatalogItemId") REFERENCES "supplier_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
