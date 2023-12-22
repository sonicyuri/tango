use actix_web::{web, Scope};
use sqlx::MySqlPool;

use crate::error::ApiError;

mod api;
mod model;

pub fn scope() -> Scope {
    web::scope("/tag").service(api::tags_list_handler)
}

pub async fn init_db(db: &MySqlPool) -> Result<(), ApiError> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `tags` (
		`id` int(11) NOT NULL AUTO_INCREMENT,
		`tag` varchar(255) NOT NULL,
		`count` int(11) NOT NULL DEFAULT 0,
		PRIMARY KEY (`id`),
		UNIQUE KEY `tag` (`tag`),
		KEY `tags_tag_idx` (`tag`)
	  )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `image_tag_categories` (
		`category` varchar(60) NOT NULL,
		`display_singular` varchar(60) DEFAULT NULL,
		`display_multiple` varchar(60) DEFAULT NULL,
		`color` varchar(7) DEFAULT NULL,
		PRIMARY KEY (`category`)
	  )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `aliases` (
		`oldtag` varchar(255) NOT NULL,
		`newtag` varchar(255) NOT NULL,
		PRIMARY KEY (`oldtag`),
		KEY `aliases_newtag_idx` (`newtag`)
	  )",
    )
    .execute(db)
    .await?;

    Ok(())
}
