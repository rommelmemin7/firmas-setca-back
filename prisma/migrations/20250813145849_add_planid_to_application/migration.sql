-- AlterTable
ALTER TABLE `Application` ADD COLUMN `planId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
