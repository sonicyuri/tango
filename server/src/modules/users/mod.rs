use actix_web::{web, Scope};
use sqlx::MySqlPool;

use crate::error::ApiError;

mod api;
mod config;
mod invites;
pub mod middleware;
mod model;
mod schema;
pub mod util;

pub fn scope() -> Scope {
    web::scope("/user")
        .service(api::user_login_handler)
        .service(api::user_info_handler)
        .service(api::user_refresh_handler)
        .service(api::user_nginx_callback_handler)
        .service(api::user_signup_handler)
        .service(config::api::user_config_get_handler)
        .service(config::api::user_config_set_handler)
        .service(invites::scope())
}

pub async fn init_db(db: &MySqlPool) -> Result<(), ApiError> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `users` (
		`id` int(11) NOT NULL AUTO_INCREMENT,
		`name` varchar(32) NOT NULL,
		`pass` varchar(250) DEFAULT NULL,
		`joindate` timestamp NOT NULL DEFAULT current_timestamp(),
		`class` varchar(32) NOT NULL DEFAULT 'user',
		`email` varchar(128) DEFAULT NULL,
		PRIMARY KEY (`id`),
		UNIQUE KEY `name` (`name`),
		KEY `users_name_idx` (`name`)
	  )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `user_config` (
		`user_id` int(11) NOT NULL,
		`name` varchar(128) NOT NULL,
		`value` text DEFAULT NULL,
		PRIMARY KEY (`user_id`,`name`),
		KEY `user_config_user_id_idx` (`user_id`),
		CONSTRAINT `user_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
	  )",
    )
    .execute(db)
    .await?;

    sqlx::query(
		"CREATE TABLE IF NOT EXISTS `user_invites` (
			`id` int(11) NOT NULL AUTO_INCREMENT,
			`creator_id` int(11) NOT NULL DEFAULT 0,
			`invite_code` varchar(10) NOT NULL,
			`redeemed` tinyint(1) NOT NULL DEFAULT 0,
			`redeemed_time` datetime DEFAULT NULL,
			PRIMARY KEY (`id`),
			UNIQUE KEY `invite_code` (`invite_code`),
			KEY `creator_id_fk` (`creator_id`),
			CONSTRAINT `creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
		  )"
	)
	.execute(db)
	.await?;

    Ok(())
}
