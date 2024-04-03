/*
  Warnings:

  - You are about to drop the column `code` on the `Code` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[value]` on the table `Code` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `Code` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Code_code_key";

-- AlterTable
ALTER TABLE "Code" DROP COLUMN "code",
ADD COLUMN     "value" TEXT NOT NULL,
ALTER COLUMN "used" SET DEFAULT false,
ALTER COLUMN "ticket" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Code_value_key" ON "Code"("value");
