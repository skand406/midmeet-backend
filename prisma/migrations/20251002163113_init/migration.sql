/*
  Warnings:

  - A unique constraint covering the columns `[party_id,course_no]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Course_party_id_course_no_key` ON `Course`(`party_id`, `course_no`);
