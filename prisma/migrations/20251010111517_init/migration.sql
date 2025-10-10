/*
  Warnings:

  - The values [BUS,SUBWAY,CAR] on the enum `Participant_transport_mode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Participant` MODIFY `transport_mode` ENUM('PRIVATE', 'PUBLIC') NULL;
