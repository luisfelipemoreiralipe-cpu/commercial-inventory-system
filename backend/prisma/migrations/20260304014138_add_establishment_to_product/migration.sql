/*
  Warnings:

  - Added the required column `establishmentId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "establishmentId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
