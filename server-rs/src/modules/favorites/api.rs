use actix_web::{get, web, HttpRequest, HttpResponse};
use log::error;

use crate::modules::auth::middleware::{get_user, AuthFactory};
use crate::util::{api_error, api_success};
use crate::{util::ApiError, AppState};

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn favorites_list_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req).ok_or(api_error(
        crate::util::ApiErrorType::AuthorizationFailed,
        "Missing user",
    ))?;

    let query_result = sqlx::query!(
        r#"SELECT image_id FROM user_favorites WHERE user_id = ?"#,
        user.id
    )
    .fetch_all(&data.db)
    .await
    .map_err(|e| {
        error!("Database error: {:?}", e);
        api_error(
            crate::util::ApiErrorType::ServerError,
            "Unknown database error",
        )
    })?;

    let ids: Vec<String> = query_result
        .iter()
        .map(|v| v.image_id.to_string())
        .collect();

    Ok(api_success(ids))
}
