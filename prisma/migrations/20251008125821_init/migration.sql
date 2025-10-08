-- DropForeignKey
ALTER TABLE `Course` DROP FOREIGN KEY `Course_party_id_fkey`;

-- AlterTable
ALTER TABLE `Participant` MODIFY `transport_mode` ENUM('BUS', 'SUBWAY', 'CAR') NULL;

-- AlterTable
ALTER TABLE `Party` ADD COLUMN `participant_count` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `Party`(`party_id`) ON DELETE CASCADE ON UPDATE CASCADE;
