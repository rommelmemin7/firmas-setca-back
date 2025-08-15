-- AlterTable
ALTER TABLE `Application` ADD COLUMN `externalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `lastCheckedAt` DATETIME(3) NULL;
