-- AlterTable
ALTER TABLE `Payment`
ADD COLUMN `banco` VARCHAR(191) NOT NULL DEFAULT 'Banco xxxxx',
ADD COLUMN `numeroCuenta` VARCHAR(191) NOT NULL DEFAULT 'xxxxxxxx',
MODIFY COLUMN `comprobanteImage` LONGBLOB;
