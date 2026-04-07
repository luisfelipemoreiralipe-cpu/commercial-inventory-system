/*
  Warnings:

  - You are about to drop the column `conversionFactor` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "conversionFactor",
ADD COLUMN     "packQuantity" DOUBLE PRECISION DEFAULT 1;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "supplierId" UUID;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
