use std::collections::BTreeMap;

use crate::modules::{
    posts::query::image_conditions::IMAGE_CONDITIONS, users::middleware::AuthFactory,
};
use actix_web::{get, web, HttpResponse};

use crate::{
    error::{api_success, ApiError},
    AppState,
};

use super::model::{TagCategory, TagListResponse};

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn tags_list_handler(data: web::Data<AppState>) -> Result<HttpResponse, ApiError> {
    let tag_query = sqlx::query!(r#"SELECT tag, COUNT(tag_id) AS count FROM tags AS t INNER JOIN image_tags AS it ON it.tag_id = t.id INNER JOIN images AS i ON i.id = it.image_id GROUP BY tag_id"#)
		.fetch_all(&data.db)
		.await?;

    let mut tag_map: BTreeMap<String, i64> = BTreeMap::<String, i64>::new();
    tag_query.iter().for_each(|t| {
        tag_map.insert(t.tag.clone(), t.count);
    });

    let category_query = sqlx::query_as!(TagCategory, r#"SELECT * FROM image_tag_categories"#)
        .fetch_all(&data.db)
        .await?;

    Ok(api_success(TagListResponse {
        categories: category_query,
        tags: tag_map,
        conditions: IMAGE_CONDITIONS.clone(),
    }))
}
