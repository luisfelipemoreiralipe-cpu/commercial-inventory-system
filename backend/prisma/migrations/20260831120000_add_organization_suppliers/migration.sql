CREATE TABLE "organization_suppliers" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "cnpj" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_supplier_reviews" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "supplierIds" JSONB NOT NULL,
    "suggestedName" TEXT NOT NULL,
    "normalizedCnpj" TEXT NOT NULL,
    "appliedOrganizationSupplierId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_supplier_reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Supplier" ADD COLUMN "organizationSupplierId" UUID;

CREATE INDEX "organization_suppliers_organizationId_idx" ON "organization_suppliers"("organizationId");
CREATE INDEX "organization_suppliers_organizationId_cnpj_idx" ON "organization_suppliers"("organizationId", "cnpj");
CREATE UNIQUE INDEX "organization_supplier_reviews_organizationId_candidateKey_key" ON "organization_supplier_reviews"("organizationId", "candidateKey");
CREATE INDEX "organization_supplier_reviews_organizationId_status_idx" ON "organization_supplier_reviews"("organizationId", "status");
CREATE INDEX "Supplier_organizationSupplierId_idx" ON "Supplier"("organizationSupplierId");
CREATE UNIQUE INDEX "Supplier_establishmentId_organizationSupplierId_key" ON "Supplier"("establishmentId", "organizationSupplierId");

ALTER TABLE "organization_suppliers" ADD CONSTRAINT "organization_suppliers_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_supplier_reviews" ADD CONSTRAINT "organization_supplier_reviews_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationSupplierId_fkey"
FOREIGN KEY ("organizationSupplierId") REFERENCES "organization_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
