/*
  Warnings:

  - You are about to drop the column `supplierId` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_supplierId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "supplierId";
