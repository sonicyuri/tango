use actix_web::{get, post, web, HttpRequest, HttpResponse};
use log::error;
use sqlx::MySqlPool;

use crate::modules::auth::middleware::{get_user, AuthFactory};
use crate::util::{api_error, api_success, format_db_error};
use crate::{util::ApiError, AppState};

use super::schema::{FavoriteAction, FavoriteSetSchema};

pub async fn get_favorites(user_id: i32, db: &MySqlPool) -> Result<Vec<String>, ApiError> {
    let query_result = sqlx::query!(
        r#"SELECT image_id FROM user_favorites WHERE user_id = ?"#,
        user_id
    )
    .fetch_all(db)
    .await
    .map_err(format_db_error)?;

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
    let user = get_user(&req).ok_or(api_error(
        crate::util::ApiErrorType::AuthorizationFailed,
        "Missing user",
    ))?;

    Ok(api_success(get_favorites(user.id, &data.db).await?))
}

#[post("/set", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn favorites_set_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<FavoriteSetSchema>,
) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req).ok_or(api_error(
        crate::util::ApiErrorType::AuthorizationFailed,
        "Missing user",
    ))?;

    let query_result =
        sqlx::query_scalar!("SELECT COUNT(id) FROM images WHERE id = ?", body.postId)
            .fetch_one(&data.db)
            .await
            .map_err(format_db_error)?;

    if query_result < 1 {
        return Err(api_error(
            crate::util::ApiErrorType::InvalidRequest,
            "Post not found",
        ));
    }

    match body.action {
        FavoriteAction::Set => {
            sqlx::query!(
                "INSERT IGNORE INTO user_favorites SET user_id = ?, image_id = ?",
                user.id,
                body.postId
            )
            .execute(&data.db)
            .await
            .map_err(format_db_error)?;
        }
        FavoriteAction::Unset => {
            sqlx::query!(
                "DELETE FROM user_favorites WHERE user_id = ? AND image_id = ?",
                user.id,
                body.postId
            )
            .execute(&data.db)
            .await
            .map_err(format_db_error)?;
        }
    };

    Ok(api_success(get_favorites(user.id, &data.db).await?))
}
