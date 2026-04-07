/*
  Warnings:

  - A unique constraint covering the columns `[name,establishmentId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `establishmentId` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "categories_name_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "establishmentId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_establishmentId_key" ON "categories"("name", "establishmentId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
