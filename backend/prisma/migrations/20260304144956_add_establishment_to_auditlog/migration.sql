/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `establishmentId` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Made the column `supplierId` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_establishmentId_fkey";

-- DropForeignKey
ALTER TABLE "establishment" DROP CONSTRAINT "fk_user";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_supplierId_fkey";

-- DropIndex
DROP INDEX "categories_name_establishmentId_key";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "establishmentId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "establishmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "establishment" ALTER COLUMN "cnpj" SET DATA TYPE TEXT,
ALTER COLUMN "telefone" SET DATA TYPE TEXT,
ALTER COLUMN "endereco" SET DATA TYPE TEXT,
ALTER COLUMN "cidade" SET DATA TYPE TEXT,
ALTER COLUMN "estado" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "supplierId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment" ADD CONSTRAINT "establishment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
