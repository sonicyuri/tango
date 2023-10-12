use actix_web::{http::StatusCode, HttpResponse};
use derive_more::{Display, Error};
use serde::Serialize;
use serde_json::json;

#[derive(Debug, Clone)]
pub enum ApiErrorType {
    Unauthorized,
    AuthorizationFailed,
    InvalidRequest,
    ServerError,
    OperationFailed,
    NotFound,
}

#[derive(Debug, Display, Error, Clone)]
#[display(fmt = "API error: {}", message)]
pub struct ApiError {
    message: &'static str,
    error_type: ApiErrorType,
}

impl actix_web::error::ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        HttpResponse::build(self.status_code()).json(error_response(self.message))
    }

    fn status_code(&self) -> StatusCode {
        match self.error_type {
            ApiErrorType::AuthorizationFailed => StatusCode::FORBIDDEN,
            ApiErrorType::InvalidRequest => StatusCode::BAD_REQUEST,
            ApiErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            ApiErrorType::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiErrorType::OperationFailed => StatusCode::OK,
            ApiErrorType::NotFound => StatusCode::NOT_FOUND,
        }
    }
}

pub fn unauthorized_error(message: &str) -> HttpResponse {
    HttpResponse::Unauthorized().json(error_response(message))
}

pub fn api_error(error_type: ApiErrorType, message: &'static str) -> ApiError {
    ApiError {
        error_type,
        message,
    }
}

pub fn api_success(value: impl Serialize) -> HttpResponse {
    HttpResponse::Ok().json(success_response(value))
}

pub fn success_response(value: impl Serialize) -> impl Serialize {
    json!({ "type": "success", "result": value })
}

pub fn error_response(message: &str) -> impl Serialize {
    json!({ "type": "error", "message": message })
}
