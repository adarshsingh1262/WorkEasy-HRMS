/*
  Warnings:

  - Added the required column `createdById` to the `automation_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "automation_rules" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
