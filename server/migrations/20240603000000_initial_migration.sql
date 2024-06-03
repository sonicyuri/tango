-- Add migration script here
CREATE TABLE IF NOT EXISTS `users` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`name` varchar(32) NOT NULL,
	`pass` varchar(250) DEFAULT NULL,
	`joindate` timestamp NOT NULL DEFAULT current_timestamp(),
	`class` varchar(32) NOT NULL DEFAULT 'user',
	`email` varchar(128) DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `name` (`name`),
	KEY `users_name_idx` (`name`)
);

CREATE TABLE IF NOT EXISTS `user_config` (
	`user_id` int(11) NOT NULL,
	`name` varchar(128) NOT NULL,
	`value` text DEFAULT NULL,
	PRIMARY KEY (`user_id`, `name`),
	KEY `user_config_user_id_idx` (`user_id`),
	CONSTRAINT `user_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_invites` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`creator_id` int(11) NOT NULL DEFAULT 0,
	`invite_code` varchar(10) NOT NULL,
	`redeemed` tinyint(1) NOT NULL DEFAULT 0,
	`redeemed_time` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `invite_code` (`invite_code`),
	KEY `creator_id_fk` (`creator_id`),
	CONSTRAINT `creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `tags` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`tag` varchar(255) NOT NULL,
	`count` int(11) NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	UNIQUE KEY `tag` (`tag`),
	KEY `tags_tag_idx` (`tag`)
);

CREATE TABLE IF NOT EXISTS `image_tag_categories` (
	`category` varchar(60) NOT NULL,
	`display_singular` varchar(60) DEFAULT NULL,
	`display_multiple` varchar(60) DEFAULT NULL,
	`color` varchar(7) DEFAULT NULL,
	PRIMARY KEY (`category`)
);

CREATE TABLE IF NOT EXISTS `aliases` (
	`oldtag` varchar(255) NOT NULL,
	`newtag` varchar(255) NOT NULL,
	PRIMARY KEY (`oldtag`),
	KEY `aliases_newtag_idx` (`newtag`)
);

CREATE TABLE IF NOT EXISTS `images` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`owner_id` int(11) NOT NULL,
	`owner_ip` varchar(45) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`filesize` int(11) NOT NULL,
	`hash` char(32) NOT NULL,
	`ext` char(4) NOT NULL,
	`source` varchar(255) DEFAULT NULL,
	`width` int(11) NOT NULL,
	`height` int(11) NOT NULL,
	`posted` timestamp NOT NULL DEFAULT current_timestamp(),
	`locked` tinyint(1) NOT NULL DEFAULT 0,
	`lossless` tinyint(1) DEFAULT NULL,
	`video` tinyint(1) DEFAULT NULL,
	`audio` tinyint(1) DEFAULT NULL,
	`length` int(11) DEFAULT NULL,
	`mime` varchar(512) DEFAULT NULL,
	`image` tinyint(1) DEFAULT NULL,
	`video_codec` varchar(512) DEFAULT NULL,
	`favorites` int(11) NOT NULL DEFAULT 0,
	`numeric_score` int(11) NOT NULL DEFAULT 0,
	`parent_id` int(11) DEFAULT NULL,
	`has_children` tinyint(1) NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	UNIQUE KEY `hash` (`hash`),
	KEY `images_owner_id_idx` (`owner_id`),
	KEY `images_width_idx` (`width`),
	KEY `images_height_idx` (`height`),
	KEY `images_hash_idx` (`hash`),
	KEY `images_video_idx` (`video`),
	KEY `images_audio_idx` (`audio`),
	KEY `images_length_idx` (`length`),
	KEY `images_ext_idx` (`ext`),
	KEY `images_mime_idx` (`mime`),
	KEY `images_image_idx` (`image`),
	KEY `images__favorites` (`favorites`),
	KEY `images__numeric_score` (`numeric_score`),
	KEY `images__parent_id` (`parent_id`),
	KEY `images__has_children` (`has_children`),
	CONSTRAINT `images_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
);

CREATE TABLE IF NOT EXISTS `image_tags` (
	`image_id` int(11) NOT NULL,
	`tag_id` int(11) NOT NULL,
	UNIQUE KEY `image_id` (`image_id`, `tag_id`),
	UNIQUE KEY `image_tags_tag_id_image_id_idx` (`tag_id`, `image_id`),
	KEY `images_tags_image_id_idx` (`image_id`),
	KEY `images_tags_tag_id_idx` (`tag_id`),
	CONSTRAINT `image_tags_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
	CONSTRAINT `image_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `numeric_score_votes` (
	`image_id` int(11) NOT NULL,
	`user_id` int(11) NOT NULL,
	`score` int(11) NOT NULL,
	UNIQUE KEY `image_id` (`image_id`, `user_id`),
	KEY `numeric_score_votes_image_id_idx` (`image_id`),
	KEY `numeric_score_votes__user_votes` (`user_id`, `score`),
	CONSTRAINT `numeric_score_votes_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
	CONSTRAINT `numeric_score_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `image_views` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`image_id` INT(11) NOT NULL,
	`user_id` INT(11) NOT NULL,
	`timestamp` INT(11) NOT NULL,
	`ipaddress` VARCHAR(45) NOT NULL COLLATE 'utf8mb3_general_ci',
	PRIMARY KEY (`id`) USING BTREE
);

CREATE TABLE IF NOT EXISTS `user_favorites` (
	`image_id` int(11) NOT NULL,
	`user_id` int(11) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT current_timestamp(),
	UNIQUE KEY `image_id` (`image_id`, `user_id`),
	KEY `user_id` (`user_id`),
	KEY `user_favorites_image_id_idx` (`image_id`),
	CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
	CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `pools` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`public` tinyint(1) NOT NULL DEFAULT 0,
	`title` varchar(255) NOT NULL,
	`description` text DEFAULT NULL,
	`date` timestamp NOT NULL DEFAULT current_timestamp(),
	`posts` int(11) NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	KEY `user_id` (`user_id`),
	CONSTRAINT `pools_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `pool_history` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`pool_id` int(11) NOT NULL,
	`user_id` int(11) NOT NULL,
	`action` int(11) NOT NULL,
	`images` text DEFAULT NULL,
	`count` int(11) NOT NULL DEFAULT 0,
	`date` timestamp NOT NULL DEFAULT current_timestamp(),
	PRIMARY KEY (`id`),
	KEY `pool_id` (`pool_id`),
	KEY `user_id` (`user_id`),
	CONSTRAINT `pool_history_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `pools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `pool_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `pool_images` (
	`pool_id` int(11) NOT NULL,
	`image_id` int(11) NOT NULL,
	`image_order` int(11) NOT NULL DEFAULT 0,
	KEY `pool_id` (`pool_id`),
	KEY `image_id` (`image_id`),
	CONSTRAINT `pool_images_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `pools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `pool_images_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);