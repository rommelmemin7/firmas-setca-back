-- AlterTable
ALTER TABLE `Application` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pendiente';

-- AlterTable
ALTER TABLE `Client` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'active';
