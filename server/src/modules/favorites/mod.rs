use actix_web::{web, Scope};
use sqlx::MySqlPool;

use crate::error::ApiError;

mod api;
mod schema;

pub fn scope() -> Scope {
    web::scope("/favorite")
        .service(api::favorites_list_handler)
        .service(api::favorites_set_handler)
}

pub async fn init_db(db: &MySqlPool) -> Result<(), ApiError> {
    sqlx::query("CREATE TABLE IF NOT EXISTS `user_favorites` (
		`image_id` int(11) NOT NULL,
		`user_id` int(11) NOT NULL,
		`created_at` timestamp NOT NULL DEFAULT current_timestamp(),
		UNIQUE KEY `image_id` (`image_id`,`user_id`),
		KEY `user_id` (`user_id`),
		KEY `user_favorites_image_id_idx` (`image_id`),
		CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
		CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
	  )").execute(db).await?;

    Ok(())
}
