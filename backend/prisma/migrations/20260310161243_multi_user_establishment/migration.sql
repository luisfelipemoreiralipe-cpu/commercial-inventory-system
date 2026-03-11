/*
  Warnings:

  - You are about to drop the column `user_id` on the `Establishment` table. All the data in the column will be lost.
  - Added the required column `establishmentId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Establishment" DROP CONSTRAINT "Establishment_user_id_fkey";

-- DropIndex
DROP INDEX "Establishment_user_id_key";

-- AlterTable
ALTER TABLE "Establishment" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "establishmentId" UUID NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
