CREATE TABLE "supplier_portal_users" (
    "id" UUID NOT NULL, "organizationSupplierId" UUID NOT NULL, "name" TEXT NOT NULL,
    "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false, "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3), "lastLoginAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3),
    "sessionVersion" INTEGER NOT NULL DEFAULT 1, "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "supplier_portal_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "supplier_portal_users_email_key" ON "supplier_portal_users"("email");
CREATE INDEX "supplier_portal_users_organizationSupplierId_isActive_idx" ON "supplier_portal_users"("organizationSupplierId", "isActive");
ALTER TABLE "supplier_portal_users" ADD CONSTRAINT "supplier_portal_users_organizationSupplierId_fkey"
FOREIGN KEY ("organizationSupplierId") REFERENCES "organization_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
