/*
  Warnings:

  - You are about to alter the column `tag` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `Course` ADD COLUMN `place_lat` DECIMAL(9, 6) NULL,
    ADD COLUMN `place_lng` DECIMAL(9, 6) NULL,
    MODIFY `tag` JSON NULL;
