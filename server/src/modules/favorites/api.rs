use actix_web::{get, post, web, HttpRequest, HttpResponse};
use log::error;
use sqlx::MySqlPool;

use crate::error::{api_error, api_success, ApiError, ApiErrorType};
use crate::modules::users::middleware::{get_user, AuthFactory};
use crate::AppState;

use super::schema::{FavoriteAction, FavoriteSetSchema};

async fn get_favorites(user_id: i32, db: &MySqlPool) -> Result<Vec<String>, ApiError> {
    let query_result = sqlx::query!(
        r#"SELECT image_id FROM user_favorites WHERE user_id = ?"#,
        user_id
    )
    .fetch_all(db)
    .await?;

    Ok(query_result
        .iter()
        .map(|v| v.image_id.to_string())
        .collect())
}

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn favorites_list_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    Ok(api_success(get_favorites(user.id, &data.db).await?))
}

#[post("/set", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn favorites_set_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<FavoriteSetSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let query_result =
        sqlx::query_scalar!("SELECT COUNT(id) FROM images WHERE id = ?", body.post_id)
            .fetch_one(&data.db)
            .await?;

    if query_result < 1 {
        return Err(api_error(ApiErrorType::InvalidRequest, "Post not found"));
    }

    match body.action {
        FavoriteAction::Set => {
            sqlx::query!(
                "INSERT IGNORE INTO user_favorites SET user_id = ?, image_id = ?",
                user.id,
                body.post_id
            )
            .execute(&data.db)
            .await?;
        }
        FavoriteAction::Unset => {
            sqlx::query!(
                "DELETE FROM user_favorites WHERE user_id = ? AND image_id = ?",
                user.id,
                body.post_id
            )
            .execute(&data.db)
            .await?;
        }
    };

    Ok(api_success(get_favorites(user.id, &data.db).await?))
}
