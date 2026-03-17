/*
  Warnings:

  - A unique constraint covering the columns `[name,establishmentId]` on the table `stock_sectors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "stock_sectors_name_establishmentId_key" ON "stock_sectors"("name", "establishmentId");
