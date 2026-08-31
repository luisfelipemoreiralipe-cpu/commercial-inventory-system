CREATE TABLE "organization_product_reviews" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "productIds" JSONB NOT NULL,
    "suggestedName" TEXT NOT NULL,
    "appliedOrganizationProductId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_product_reviews_organizationId_candidateKey_key"
ON "organization_product_reviews"("organizationId", "candidateKey");

CREATE INDEX "organization_product_reviews_organizationId_status_idx"
ON "organization_product_reviews"("organizationId", "status");

ALTER TABLE "organization_product_reviews"
ADD CONSTRAINT "organization_product_reviews_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
