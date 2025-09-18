-- CreateTable
CREATE TABLE `User` (
    `uid` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwd` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Party` (
    `party_id` VARCHAR(191) NOT NULL,
    `date_time` DATETIME(3) NULL,
    `party_name` VARCHAR(191) NOT NULL,
    `party_type` ENUM('AI_COURSE', 'CUSTOM_COURSE') NULL,

    PRIMARY KEY (`party_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participant` (
    `participant_id` VARCHAR(191) NOT NULL,
    `party_id` VARCHAR(191) NOT NULL,
    `user_uid` VARCHAR(191) NULL,
    `transport_mode` ENUM('BUS', 'SUBWAY') NULL,
    `role` ENUM('LEADER', 'MEMBER') NULL,
    `code` VARCHAR(191) NULL,
    `start_lat` DECIMAL(9, 6) NULL,
    `start_lng` DECIMAL(9, 6) NULL,
    `start_address` VARCHAR(191) NULL,

    INDEX `Participant_party_id_idx`(`party_id`),
    INDEX `Participant_user_uid_idx`(`user_uid`),
    UNIQUE INDEX `Participant_party_id_user_uid_key`(`party_id`, `user_uid`),
    PRIMARY KEY (`participant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `course_id` VARCHAR(191) NOT NULL,
    `party_id` VARCHAR(191) NOT NULL,
    `place_name` VARCHAR(191) NULL,
    `place_address` VARCHAR(191) NULL,
    `course_no` INTEGER NULL,
    `tag` VARCHAR(191) NULL,

    INDEX `Course_party_id_course_no_idx`(`party_id`, `course_no`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `Party`(`party_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_user_uid_fkey` FOREIGN KEY (`user_uid`) REFERENCES `User`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `Party`(`party_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
