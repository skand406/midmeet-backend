-- AlterTable
ALTER TABLE `Course` ADD COLUMN `course_view` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Party` ADD COLUMN `party_status` BOOLEAN NOT NULL DEFAULT false;
