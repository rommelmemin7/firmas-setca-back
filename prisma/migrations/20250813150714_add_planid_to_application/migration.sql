/*
  Warnings:

  - You are about to drop the column `durationMonths` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Plan` DROP COLUMN `durationMonths`,
    ADD COLUMN `durationdays` INTEGER NOT NULL DEFAULT 7;
