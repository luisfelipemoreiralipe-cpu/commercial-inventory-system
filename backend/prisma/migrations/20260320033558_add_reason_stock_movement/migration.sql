/*
  Warnings:

  - The values [RECIPE] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('INVENTORY', 'PRODUCTION');
ALTER TABLE "products" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
ALTER TABLE "products" ALTER COLUMN "type" SET DEFAULT 'INVENTORY';
COMMIT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "reason" TEXT;
