/*
  Warnings:

  - You are about to drop the column `address` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `applicationType` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentExpirationDate` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `authorizationVideo` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `companyRuc` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `companySocialReason` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `countryCode` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `fingerCode` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `identificationBack` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `identificationFront` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `identificationSelfie` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pdfAppointmentAcceptance` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pdfCompanyConstitution` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pdfCompanyRuc` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pdfRepresentativeAppointment` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `positionCompany` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `referenceTransaction` on the `Client` table. All the data in the column will be lost.
  - Added the required column `applicationId` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Client` DROP COLUMN `address`,
    DROP COLUMN `applicationType`,
    DROP COLUMN `appointmentExpirationDate`,
    DROP COLUMN `authorizationVideo`,
    DROP COLUMN `city`,
    DROP COLUMN `companyRuc`,
    DROP COLUMN `companySocialReason`,
    DROP COLUMN `countryCode`,
    DROP COLUMN `documentType`,
    DROP COLUMN `fingerCode`,
    DROP COLUMN `identificationBack`,
    DROP COLUMN `identificationFront`,
    DROP COLUMN `identificationSelfie`,
    DROP COLUMN `pdfAppointmentAcceptance`,
    DROP COLUMN `pdfCompanyConstitution`,
    DROP COLUMN `pdfCompanyRuc`,
    DROP COLUMN `pdfRepresentativeAppointment`,
    DROP COLUMN `period`,
    DROP COLUMN `positionCompany`,
    DROP COLUMN `province`,
    DROP COLUMN `referenceTransaction`,
    ADD COLUMN `applicationId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
