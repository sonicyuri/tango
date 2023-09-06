-- CreateTable
CREATE TABLE `aliases` (
    `oldtag` VARCHAR(255) NOT NULL,
    `newtag` VARCHAR(255) NOT NULL,

    INDEX `aliases_newtag_idx`(`newtag`),
    PRIMARY KEY (`oldtag`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artist_alias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artist_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created` DATETIME(0) NULL,
    `updated` DATETIME(0) NULL,
    `alias` VARCHAR(255) NULL,

    INDEX `artist_id`(`artist_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artist_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artist_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created` DATETIME(0) NOT NULL,
    `updated` DATETIME(0) NOT NULL,

    INDEX `artist_id`(`artist_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artist_urls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artist_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created` DATETIME(0) NOT NULL,
    `updated` DATETIME(0) NOT NULL,
    `url` VARCHAR(1000) NOT NULL,

    INDEX `artist_id`(`artist_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created` DATETIME(0) NOT NULL,
    `updated` DATETIME(0) NOT NULL,
    `notes` TEXT NULL,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pages` VARCHAR(128) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `area` VARCHAR(16) NOT NULL,
    `priority` INTEGER NOT NULL,
    `content` TEXT NOT NULL,

    INDEX `blocks_pages_idx`(`pages`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_id` INTEGER NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `owner_ip` VARCHAR(45) NOT NULL,
    `posted` DATETIME(0) NULL,
    `comment` TEXT NOT NULL,

    INDEX `comments_image_id_idx`(`image_id`),
    INDEX `comments_owner_id_idx`(`owner_id`),
    INDEX `comments_posted_idx`(`posted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config` (
    `name` VARCHAR(128) NOT NULL,
    `value` TEXT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `image_tag_categories` (
    `category` VARCHAR(60) NOT NULL,
    `display_singular` VARCHAR(60) NULL,
    `display_multiple` VARCHAR(60) NULL,
    `color` VARCHAR(7) NULL,

    PRIMARY KEY (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `image_tags` (
    `image_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    INDEX `images_tags_image_id_idx`(`image_id`),
    INDEX `images_tags_tag_id_idx`(`tag_id`),
    UNIQUE INDEX `image_id`(`image_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `image_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `timestamp` INTEGER NOT NULL,
    `ipaddress` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NOT NULL,
    `owner_ip` VARCHAR(45) NOT NULL,
    `filename` VARCHAR(64) NOT NULL,
    `filesize` INTEGER NOT NULL,
    `hash` CHAR(32) NOT NULL,
    `ext` CHAR(4) NOT NULL,
    `source` VARCHAR(255) NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `posted` DATETIME(0) NOT NULL DEFAULT ('1970-01-01 00:00:00'),
    `locked` ENUM('Y', 'N') NOT NULL DEFAULT 'N',
    `author` VARCHAR(255) NULL,
    `rating` CHAR(1) NOT NULL DEFAULT 'u',
    `favorites` INTEGER NOT NULL DEFAULT 0,
    `parent_id` INTEGER NULL,
    `has_children` ENUM('Y', 'N') NOT NULL DEFAULT 'N',
    `numeric_score` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `hash`(`hash`),
    INDEX `images__favorites`(`favorites`),
    INDEX `images__numeric_score`(`numeric_score`),
    INDEX `images__parent_id`(`parent_id`),
    INDEX `images__rating`(`rating`),
    INDEX `images_hash_idx`(`hash`),
    INDEX `images_height_idx`(`height`),
    INDEX `images_owner_id_idx`(`owner_id`),
    INDEX `images_width_idx`(`width`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `numeric_score_votes` (
    `image_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `score` INTEGER NOT NULL,

    INDEX `numeric_score_votes__user_votes`(`user_id`, `score`),
    INDEX `numeric_score_votes_image_id_idx`(`image_id`),
    UNIQUE INDEX `image_id`(`image_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pool_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `action` INTEGER NOT NULL,
    `images` TEXT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `date` DATETIME(0) NOT NULL,

    INDEX `pool_id`(`pool_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_images` (
    `pool_id` INTEGER NOT NULL,
    `image_id` INTEGER NOT NULL,
    `image_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `image_id`(`image_id`),
    INDEX `pool_id`(`pool_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `public` ENUM('Y', 'N') NOT NULL DEFAULT 'N',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(0) NOT NULL,
    `posts` INTEGER NOT NULL DEFAULT 0,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(255) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `tag`(`tag`),
    INDEX `tags_tag_idx`(`tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_favorites` (
    `image_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL,

    INDEX `user_favorites_image_id_idx`(`image_id`),
    INDEX `user_id`(`user_id`),
    UNIQUE INDEX `image_id`(`image_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL,
    `pass` VARCHAR(250) NULL,
    `joindate` DATETIME(0) NOT NULL DEFAULT ('1970-01-01 00:00:00'),
    `class` VARCHAR(32) NOT NULL DEFAULT 'user',
    `email` VARCHAR(128) NULL,

    UNIQUE INDEX `name`(`name`),
    INDEX `users_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `artist_alias` ADD CONSTRAINT `artist_alias_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artist_alias` ADD CONSTRAINT `artist_alias_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artist_members` ADD CONSTRAINT `artist_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artist_members` ADD CONSTRAINT `artist_members_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artist_urls` ADD CONSTRAINT `artist_urls_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artist_urls` ADD CONSTRAINT `artist_urls_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `artists` ADD CONSTRAINT `artists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `image_tags` ADD CONSTRAINT `image_tags_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `image_tags` ADD CONSTRAINT `image_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `numeric_score_votes` ADD CONSTRAINT `numeric_score_votes_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `numeric_score_votes` ADD CONSTRAINT `numeric_score_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pool_history` ADD CONSTRAINT `pool_history_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `pools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_history` ADD CONSTRAINT `pool_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_images` ADD CONSTRAINT `pool_images_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `pools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_images` ADD CONSTRAINT `pool_images_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pools` ADD CONSTRAINT `pools_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
