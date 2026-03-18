/*
  Warnings:

  - You are about to drop the column `sectorId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sectorId` on the `stock_audits` table. All the data in the column will be lost.
  - You are about to drop the `stock_sectors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "stock_audits" DROP CONSTRAINT "stock_audits_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "stock_sectors" DROP CONSTRAINT "stock_sectors_establishmentId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "sectorId";

-- AlterTable
ALTER TABLE "stock_audits" DROP COLUMN "sectorId";

-- DropTable
DROP TABLE "stock_sectors";
