/*
  Warnings:

  - Made the column `planId` on table `Application` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Application` DROP FOREIGN KEY `Application_planId_fkey`;

-- DropIndex
DROP INDEX `Application_planId_fkey` ON `Application`;

-- AlterTable
ALTER TABLE `Application` MODIFY `planId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
