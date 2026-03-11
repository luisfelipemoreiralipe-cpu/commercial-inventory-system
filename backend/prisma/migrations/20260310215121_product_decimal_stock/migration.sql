/*
  Warnings:

  - You are about to alter the column `quantity` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - You are about to alter the column `minQuantity` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.

*/
-- AlterTable
ALTER TABLE "products" ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "minQuantity" SET DEFAULT 0,
ALTER COLUMN "minQuantity" SET DATA TYPE DECIMAL(12,3);
