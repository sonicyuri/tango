use actix_web::{get, web, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::{
    error::{api_success, ApiError},
    version::get_version_string,
    AppState,
};

#[derive(Serialize, Deserialize, Debug)]
struct SystemInfoResponse {
    pub signup_requires_invite: bool,
    pub upload_count: i32,
    pub upload_size: usize,

    // stats
    pub post_count: i32,
    pub image_count: i32,
    pub video_count: i32,
    pub user_count: i32,

    pub server_version: String,
}

#[get("/info")]
pub async fn system_info_handler(data: web::Data<AppState>) -> Result<HttpResponse, ApiError> {
    let (post_count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM images")
        .fetch_one(&data.db)
        .await?;
    let (image_count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM images WHERE image = 1")
        .fetch_one(&data.db)
        .await?;
    let (video_count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM images WHERE video = 1")
        .fetch_one(&data.db)
        .await?;
    let (user_count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM users")
        .fetch_one(&data.db)
        .await?;

    let response = SystemInfoResponse {
        signup_requires_invite: data.booru_config.signup_requires_invite,
        upload_count: data.booru_config.upload_count,
        upload_size: data.booru_config.upload_size,
        post_count,
        image_count,
        video_count,
        user_count,
        server_version: get_version_string(),
    };

    Ok(api_success(response))
}
