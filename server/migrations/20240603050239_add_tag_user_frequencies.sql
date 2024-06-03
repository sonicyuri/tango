-- Add migration script here
CREATE TABLE IF NOT EXISTS `tag_user_frequencies` (
	`user_id` int(11) NOT NULL,
	`tag` varchar(255) NOT NULL,
	`num` int(11) NOT NULL DEFAULT 0,
	UNIQUE KEY `tag_user` (`tag`, `user_id`),
	CONSTRAINT `tag_user_frequencies_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
)