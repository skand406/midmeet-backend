/*
  Warnings:

  - Added the required column `id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `id` VARCHAR(191) NOT NULL;
