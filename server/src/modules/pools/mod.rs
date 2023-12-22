use sqlx::MySqlPool;

use crate::error::ApiError;

pub mod model;

pub async fn init_db(db: &MySqlPool) -> Result<(), ApiError> {
    sqlx::query("CREATE TABLE IF NOT EXISTS `pools` (
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
	  )").execute(db).await?;

    sqlx::query("CREATE TABLE IF NOT EXISTS `pool_history` (
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
	  )").execute(db).await?;

    sqlx::query("CREATE TABLE IF NOT EXISTS `pool_images` (
		`pool_id` int(11) NOT NULL,
		`image_id` int(11) NOT NULL,
		`image_order` int(11) NOT NULL DEFAULT 0,
		KEY `pool_id` (`pool_id`),
		KEY `image_id` (`image_id`),
		CONSTRAINT `pool_images_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `pools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
		CONSTRAINT `pool_images_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
	  )").execute(db).await?;

    Ok(())
}
