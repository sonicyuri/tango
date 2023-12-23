use super::model::{
    filter_db_record, AuthTokenResponse, UserLoginResponse, UserModel, UserRefreshResponse,
};
use super::schema::{UserLoginSchema, UserRefreshSchema, UserSignupSchema};

use super::middleware::{get_user, AuthFactory};
use super::util::{check_user, get_basic_auth_header, validate_auth_token, AuthTokenKind};
use crate::error::{api_error, api_success, ApiError, ApiErrorType};
use crate::modules::users::util::hash_password;
use crate::AppState;
use actix_web::{get, post, web, HttpRequest, HttpResponse};
use log::error;
use serde_json::json;

use super::util;

#[get("/info", wrap = "AuthFactory { reject_unauthed: true }")]
async fn user_info_handler(req: HttpRequest) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req)
        .ok_or_else(|| api_error(ApiErrorType::InvalidRequest, "Failed to get user"))?;

    Ok(api_success(filter_db_record(&user)))
}

#[get("/nginx_callback", wrap = "AuthFactory { reject_unauthed: false }")]
async fn user_nginx_callback_handler(req: HttpRequest, data: web::Data<AppState>) -> HttpResponse {
    if let Some(_) = get_user(&req) {
        return HttpResponse::Ok().json(json!({ "type": "success" }));
    }

    let credentials = get_basic_auth_header(&req);
    if credentials.is_none() {
        return HttpResponse::Unauthorized().json(json!({"type": "needs_auth"}));
    }

    let (username, password) = credentials.unwrap();
    let user = check_user(&data.db, &username, &password).await;

    match user {
        Ok(_) => HttpResponse::Ok().json(json!({ "type": "success" })),
        Err(_) => return HttpResponse::Unauthorized().json(json!({ "type": "needs_auth"})),
    }
}

#[post("/login")]
async fn user_login_handler(
    body: web::Json<UserLoginSchema>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user = check_user(&data.db, &body.username, &body.password).await?;

    let access_token: Option<AuthTokenResponse> =
        util::create_auth_token(&user, util::AuthTokenKind::Access).ok();
    let refresh_token: Option<AuthTokenResponse> = match body.remember_me.unwrap_or(false) {
        true => util::create_auth_token(&user, util::AuthTokenKind::Refresh).ok(),
        false => None,
    };

    match access_token {
        Some(access_token) => {
            return Ok(api_success(UserLoginResponse {
                access: access_token,
                refresh: refresh_token,
                user: filter_db_record(&user),
            }))
        }
        None => {
            return Err(api_error(
                ApiErrorType::ServerError,
                "Failed to create auth token",
            ));
        }
    }
}

#[post("/refresh")]
async fn user_refresh_handler(
    body: web::Json<UserRefreshSchema>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user_id = validate_auth_token(body.refresh_token.as_str(), AuthTokenKind::Refresh)
        .map_err(|e| {
            api_error(
                ApiErrorType::OperationFailed,
                "Failed to validate refresh token",
            )
        })?;

    let user = sqlx::query_as!(UserModel, r#"SELECT * FROM users WHERE id = ?"#, user_id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => api_error(ApiErrorType::OperationFailed, "User not found"),
            e => {
                error!("Error fetching user: {:?}", e);
                api_error(ApiErrorType::ServerError, "Error fetching user")
            }
        })?;

    let new_token = util::create_auth_token(&user, AuthTokenKind::Access).map_err(|e| {
        error!("JWT error: {:?}", e);
        api_error(ApiErrorType::ServerError, "Failed to create refresh token")
    })?;

    Ok(api_success(UserRefreshResponse {
        access: new_token,
        user: filter_db_record(&user),
    }))
}

#[post("/signup")]
pub async fn user_signup_handler(
    body: web::Json<UserSignupSchema>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let code = body
        .invite_code
        .as_ref()
        .and_then(|s| Some(s.clone()))
        .unwrap_or("".to_owned());

    let transaction = data.db.begin().await?;

    if data.booru_config.signup_requires_invite {
        let (count,) = sqlx::query_as::<_, (i32,)>(
            "SELECT COUNT(*) FROM user_invites WHERE invite_code = ? AND redeemed = 0",
        )
        .bind(code.clone())
        .fetch_one(&data.db)
        .await?;

        if count < 1 {
            return Err(api_error(
                ApiErrorType::InvalidRequest,
                "Invalid invite code",
            ));
        }
    }

    let (count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM users WHERE name = ?")
        .bind(body.username.as_str())
        .fetch_one(&data.db)
        .await?;

    if count > 0 {
        return Err(api_error(
            ApiErrorType::InvalidRequest,
            "Username already taken",
        ));
    }

    let hash = hash_password(body.password.as_str())?;

    sqlx::query("INSERT INTO users (`name`, `pass`, `email`) VALUES(?, ?, ?)")
        .bind(body.username.as_str())
        .bind(hash)
        .bind(body.email.as_ref().and_then(|s| Some(s.clone())))
        .execute(&data.db)
        .await?;

    if data.booru_config.signup_requires_invite {
        sqlx::query(
            "UPDATE user_invites SET redeemed = 1, redeemed_time = CURRENT_TIMESTAMP WHERE invite_code = ?",
        )
        .bind(code)
        .execute(&data.db)
        .await?;
    }

    let user = sqlx::query_as!(
        UserModel,
        r#"SELECT * FROM users WHERE name = ?"#,
        body.username
    )
    .fetch_one(&data.db)
    .await?;

    transaction.commit().await?;

    Ok(api_success(filter_db_record(&user)))
}
