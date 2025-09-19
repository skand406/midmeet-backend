/*
  Warnings:

  - You are about to drop the column `party_status` on the `Party` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Party` DROP COLUMN `party_status`,
    ADD COLUMN `party_state` BOOLEAN NOT NULL DEFAULT false;
