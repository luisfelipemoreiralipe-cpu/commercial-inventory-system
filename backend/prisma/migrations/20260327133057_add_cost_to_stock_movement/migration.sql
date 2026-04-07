/*
  Warnings:

  - You are about to drop the column `establishmentId` on the `categories` table. All the data in the column will be lost.
  - Added the required column `establishmentId` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_establishmentId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "establishmentId";

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "establishmentId" UUID NOT NULL,
ADD COLUMN     "totalCost" DECIMAL(14,2),
ADD COLUMN     "unitCost" DECIMAL(12,2);

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
