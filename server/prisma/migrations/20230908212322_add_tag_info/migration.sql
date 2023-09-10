-- CreateTable
CREATE TABLE `TagInfo` (
    `id` VARCHAR(191) NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `description` TEXT NOT NULL,

    UNIQUE INDEX `TagInfo_tag_id_key`(`tag_id`),
    INDEX `TagInfo_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TagInfo` ADD CONSTRAINT `TagInfo_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
