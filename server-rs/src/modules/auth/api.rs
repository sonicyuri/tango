use super::model::{
    filter_db_record, AuthTokenResponse, UserLoginResponse, UserModel, UserModelResponse,
    UserRefreshResponse,
};
use super::schema::{UserLoginSchema, UserRefreshSchema};

use super::middleware::AuthFactory;
use super::util::{validate_auth_token, AuthTokenKind};
use crate::util::{
    api_error, api_success, error_response, success_response, ApiError, ApiErrorType,
};
use crate::AppState;
use actix_web::{delete, get, patch, post, web, HttpRequest, HttpResponse, Responder};
use log::error;
use serde::Serialize;

use super::util;

#[get("/info", wrap = "AuthFactory { reject_unauthed: true }")]
async fn user_info_handler(req: HttpRequest) -> Result<HttpResponse, ApiError> {
    let user = super::middleware::get_user(&req)
        .ok_or_else(|| api_error(ApiErrorType::InvalidRequest, "Failed to get user"))?;

    Ok(api_success(filter_db_record(&user)))
}

#[post("/login")]
async fn user_login_handler(
    body: web::Json<UserLoginSchema>,
    data: web::Data<AppState>,
) -> impl Responder {
    let query_result = sqlx::query_as!(
        UserModel,
        r#"SELECT * FROM users WHERE name = ?"#,
        body.username
    )
    .fetch_one(&data.db)
    .await;

    match query_result {
        Ok(user) => {
            let pass_hash = util::standardize_php_hash(user.pass.clone().unwrap_or("".to_owned()));

            match bcrypt::verify(body.password.to_owned(), &pass_hash) {
                Ok(true) => {
                    let access_token: Option<AuthTokenResponse> =
                        util::create_auth_token(&user, util::AuthTokenKind::Access).ok();
                    let refresh_token: Option<AuthTokenResponse> =
                        util::create_auth_token(&user, util::AuthTokenKind::Refresh).ok();

                    match access_token {
                        Some(access_token) => {
                            HttpResponse::Ok().json(success_response(UserLoginResponse {
                                access: access_token,
                                refresh: refresh_token,
                                user: filter_db_record(&user),
                            }))
                        }
                        None => {
                            return HttpResponse::InternalServerError()
                                .json(error_response("failed to create access token"));
                        }
                    }
                }
                Ok(false) => {
                    return HttpResponse::Forbidden().json(error_response("invalid credentials"));
                }
                Err(err) => {
                    return HttpResponse::InternalServerError()
                        .json(error_response(format!("{:?}", err).as_str()));
                }
            }
        }
        Err(sqlx::Error::RowNotFound) => {
            return HttpResponse::Forbidden().json(error_response("invalid credentials"));
        }
        Err(err) => {
            return HttpResponse::InternalServerError()
                .json(error_response(format!("{:?}", err).as_str()));
        }
    }
}

#[post("/refresh")]
async fn user_refresh_handler(
    body: web::Json<UserRefreshSchema>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user_id =
        validate_auth_token(body.refreshToken.as_str(), AuthTokenKind::Refresh).map_err(|e| {
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
