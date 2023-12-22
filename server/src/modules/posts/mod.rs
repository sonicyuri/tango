use actix_web::{web, Scope};
use sqlx::MySqlPool;

use crate::error::ApiError;

mod api;
mod edit;
pub mod model;
mod new;
mod query;
mod schema;
mod util;

pub fn scope() -> Scope {
    web::scope("/post")
        .service(api::post_info_handler)
        .service(edit::post_edit_handler)
        .service(api::post_vote_handler)
        .service(api::post_list_votes_handler)
        .service(new::api::post_new_handler)
        .service(query::api::post_list_handler)
        .service(api::post_delete_handler)
}

pub async fn init_db(db: &MySqlPool) -> Result<(), ApiError> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS `images` (
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
	  )",
    )
    .execute(db)
    .await?;

    sqlx::query("CREATE TABLE IF NOT EXISTS `image_tags` (
		`image_id` int(11) NOT NULL,
		`tag_id` int(11) NOT NULL,
		UNIQUE KEY `image_id` (`image_id`,`tag_id`),
		UNIQUE KEY `image_tags_tag_id_image_id_idx` (`tag_id`,`image_id`),
		KEY `images_tags_image_id_idx` (`image_id`),
		KEY `images_tags_tag_id_idx` (`tag_id`),
		CONSTRAINT `image_tags_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
		CONSTRAINT `image_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
	  )").execute(db).await?;

    sqlx::query("CREATE TABLE IF NOT EXISTS `numeric_score_votes` (
		`image_id` int(11) NOT NULL,
		`user_id` int(11) NOT NULL,
		`score` int(11) NOT NULL,
		UNIQUE KEY `image_id` (`image_id`,`user_id`),
		KEY `numeric_score_votes_image_id_idx` (`image_id`),
		KEY `numeric_score_votes__user_votes` (`user_id`,`score`),
		CONSTRAINT `numeric_score_votes_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
		CONSTRAINT `numeric_score_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
	  )").execute(db).await?;

    Ok(())
}
