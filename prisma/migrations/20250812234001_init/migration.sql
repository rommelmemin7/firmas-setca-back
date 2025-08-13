/*
  Warnings:

  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clientId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Document` DROP FOREIGN KEY `Document_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_planId_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_subscriptionId_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Subscription` DROP FOREIGN KEY `Subscription_userId_fkey`;

-- DropIndex
DROP INDEX `Subscription_userId_fkey` ON `Subscription`;

-- AlterTable
ALTER TABLE `Subscription` DROP COLUMN `userId`,
    ADD COLUMN `clientId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Document`;

-- DropTable
DROP TABLE `Payment`;

-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identificationNumber` VARCHAR(10) NOT NULL,
    `applicantName` VARCHAR(100) NOT NULL,
    `applicantLastName` VARCHAR(100) NULL,
    `applicantSecondLastName` VARCHAR(100) NULL,
    `fingerCode` VARCHAR(10) NULL,
    `emailAddress` VARCHAR(100) NOT NULL,
    `cellphoneNumber` VARCHAR(20) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `address` VARCHAR(100) NOT NULL,
    `countryCode` VARCHAR(10) NOT NULL,
    `companyRuc` VARCHAR(13) NULL,
    `positionCompany` VARCHAR(100) NULL,
    `companySocialReason` VARCHAR(250) NULL,
    `appointmentExpirationDate` DATETIME(3) NULL,
    `applicationType` VARCHAR(50) NOT NULL,
    `documentType` VARCHAR(50) NOT NULL,
    `referenceTransaction` VARCHAR(150) NOT NULL,
    `period` VARCHAR(50) NOT NULL,
    `identificationFront` LONGBLOB NOT NULL,
    `identificationBack` LONGBLOB NOT NULL,
    `identificationSelfie` LONGBLOB NOT NULL,
    `pdfCompanyRuc` LONGBLOB NULL,
    `pdfRepresentativeAppointment` LONGBLOB NULL,
    `pdfAppointmentAcceptance` LONGBLOB NULL,
    `pdfCompanyConstitution` LONGBLOB NULL,
    `authorizationVideo` LONGBLOB NULL,
    `approvedById` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identificationNumber` VARCHAR(10) NOT NULL,
    `applicantName` VARCHAR(100) NOT NULL,
    `applicantLastName` VARCHAR(100) NULL,
    `applicantSecondLastName` VARCHAR(100) NULL,
    `fingerCode` VARCHAR(10) NULL,
    `emailAddress` VARCHAR(100) NOT NULL,
    `cellphoneNumber` VARCHAR(20) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `address` VARCHAR(100) NOT NULL,
    `countryCode` VARCHAR(10) NOT NULL,
    `companyRuc` VARCHAR(13) NULL,
    `positionCompany` VARCHAR(100) NULL,
    `companySocialReason` VARCHAR(250) NULL,
    `appointmentExpirationDate` DATETIME(3) NULL,
    `applicationType` VARCHAR(50) NOT NULL,
    `documentType` VARCHAR(50) NOT NULL,
    `referenceTransaction` VARCHAR(150) NOT NULL,
    `period` VARCHAR(50) NOT NULL,
    `identificationFront` LONGBLOB NOT NULL,
    `identificationBack` LONGBLOB NOT NULL,
    `identificationSelfie` LONGBLOB NOT NULL,
    `pdfCompanyRuc` LONGBLOB NULL,
    `pdfRepresentativeAppointment` LONGBLOB NULL,
    `pdfAppointmentAcceptance` LONGBLOB NULL,
    `pdfCompanyConstitution` LONGBLOB NULL,
    `authorizationVideo` LONGBLOB NULL,
    `approvedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
