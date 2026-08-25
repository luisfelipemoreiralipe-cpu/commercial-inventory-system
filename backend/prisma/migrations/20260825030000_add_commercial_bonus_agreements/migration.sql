CREATE TYPE "CommercialAgreementStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "BonusReceiptStatus" AS ENUM ('RECEIVED', 'CANCELLED');

CREATE TABLE "commercial_agreements" (
  "id" UUID NOT NULL,
  "establishmentId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "buyQuantity" DECIMAL(12,3) NOT NULL,
  "bonusQuantity" DECIMAL(12,3) NOT NULL,
  "currentRemainder" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "allowMixedProducts" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" "CommercialAgreementStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commercial_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_agreement_products" (
  "id" UUID NOT NULL,
  "agreementId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "eligibilityFactor" DECIMAL(12,4) NOT NULL DEFAULT 1,
  "canGenerateBonus" BOOLEAN NOT NULL DEFAULT true,
  "canBeReceivedAsBonus" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "commercial_agreement_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_invoices" (
  "id" UUID NOT NULL,
  "establishmentId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "purchaseOrderId" UUID NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceSeries" TEXT NOT NULL DEFAULT '',
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "netPaidAmount" DECIMAL(14,2),
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_invoice_items" (
  "id" UUID NOT NULL,
  "invoiceId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL,
  "unitPrice" DECIMAL(12,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bonus_accruals" (
  "id" UUID NOT NULL,
  "agreementId" UUID NOT NULL,
  "invoiceId" UUID NOT NULL,
  "eligibleQuantity" DECIMAL(12,3) NOT NULL,
  "balanceBefore" DECIMAL(12,3) NOT NULL,
  "earnedBonusQuantity" DECIMAL(12,3) NOT NULL,
  "balanceAfter" DECIMAL(12,3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bonus_accruals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bonus_receipts" (
  "id" UUID NOT NULL,
  "establishmentId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "agreementId" UUID NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceSeries" TEXT NOT NULL DEFAULT '',
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "additionalCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" "BonusReceiptStatus" NOT NULL DEFAULT 'RECEIVED',
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bonus_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bonus_receipt_items" (
  "id" UUID NOT NULL,
  "bonusReceiptId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL,
  "fiscalUnitPrice" DECIMAL(12,4) NOT NULL,
  "commercialReferencePrice" DECIMAL(12,4) NOT NULL,
  "fiscalTotal" DECIMAL(14,2) NOT NULL,
  "commercialBenefit" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bonus_receipt_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_agreement_products_agreementId_productId_key" ON "commercial_agreement_products"("agreementId", "productId");
CREATE UNIQUE INDEX "purchase_invoices_purchaseOrderId_key" ON "purchase_invoices"("purchaseOrderId");
CREATE UNIQUE INDEX "purchase_invoices_establishmentId_supplierId_invoiceNumber_invoiceSeries_key" ON "purchase_invoices"("establishmentId", "supplierId", "invoiceNumber", "invoiceSeries");
CREATE UNIQUE INDEX "bonus_accruals_agreementId_invoiceId_key" ON "bonus_accruals"("agreementId", "invoiceId");
CREATE UNIQUE INDEX "bonus_receipts_establishmentId_supplierId_invoiceNumber_invoiceSeries_key" ON "bonus_receipts"("establishmentId", "supplierId", "invoiceNumber", "invoiceSeries");
CREATE INDEX "commercial_agreements_establishmentId_status_idx" ON "commercial_agreements"("establishmentId", "status");
CREATE INDEX "commercial_agreements_supplierId_status_idx" ON "commercial_agreements"("supplierId", "status");
CREATE INDEX "purchase_invoices_establishmentId_issuedAt_idx" ON "purchase_invoices"("establishmentId", "issuedAt");
CREATE INDEX "bonus_accruals_agreementId_createdAt_idx" ON "bonus_accruals"("agreementId", "createdAt");
CREATE INDEX "bonus_receipts_agreementId_invoiceDate_idx" ON "bonus_receipts"("agreementId", "invoiceDate");

ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreements_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commercial_agreement_products" ADD CONSTRAINT "commercial_agreement_products_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commercial_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_agreement_products" ADD CONSTRAINT "commercial_agreement_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_accruals" ADD CONSTRAINT "bonus_accruals_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commercial_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_accruals" ADD CONSTRAINT "bonus_accruals_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_receipts" ADD CONSTRAINT "bonus_receipts_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_receipts" ADD CONSTRAINT "bonus_receipts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_receipts" ADD CONSTRAINT "bonus_receipts_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commercial_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_receipt_items" ADD CONSTRAINT "bonus_receipt_items_bonusReceiptId_fkey" FOREIGN KEY ("bonusReceiptId") REFERENCES "bonus_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bonus_receipt_items" ADD CONSTRAINT "bonus_receipt_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
