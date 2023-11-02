use std::collections::HashMap;

use super::util::{error_response, success_response};
use actix_web::{http::StatusCode, HttpResponse};
use derive_more::{Display, Error};
use log::error;
use s3::error::S3Error;
use serde::Serialize;
use serde_json::json;

#[derive(Debug, Clone)]
pub enum ApiErrorType {
    Unauthorized,
    Forbidden,
    AuthorizationFailed,
    InvalidRequest,
    ServerError,
    OperationFailed,
    NotFound,
}

#[derive(Debug, Display, Error, Clone)]
#[display(fmt = "API error: {}", message)]
pub struct ApiError {
    pub message: String,
    pub error_type: ApiErrorType,
}

impl From<S3Error> for ApiError {
    fn from(value: S3Error) -> Self {
        error!("S3 error: {:?}", value);
        api_error(ApiErrorType::ServerError, "Unknown S3 error")
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(value: sqlx::Error) -> Self {
        error!("Database error: {:?}", value);
        api_error(ApiErrorType::ServerError, "Unknown database error")
    }
}

#[derive(Debug, Display, Error, Clone)]
#[display(fmt = "API error: {:?}", messages)]
pub struct ApiKeyedError {
    pub messages: HashMap<String, String>,
    pub error_type: ApiErrorType,
}

impl From<ApiError> for ApiKeyedError {
    fn from(value: ApiError) -> Self {
        let mut messages: HashMap<String, String> = HashMap::new();
        messages.insert("_error".to_owned(), value.message);
        ApiKeyedError {
            error_type: value.error_type,
            messages,
        }
    }
}

impl From<sqlx::Error> for ApiKeyedError {
    fn from(value: sqlx::Error) -> Self {
        let api_err: ApiError = value.into();
        api_err.into()
    }
}

impl actix_web::error::ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        HttpResponse::build(self.status_code()).json(error_response(self.message.clone()))
    }

    fn status_code(&self) -> StatusCode {
        match self.error_type {
            ApiErrorType::AuthorizationFailed => StatusCode::FORBIDDEN,
            ApiErrorType::InvalidRequest => StatusCode::BAD_REQUEST,
            ApiErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            ApiErrorType::Forbidden => StatusCode::FORBIDDEN,
            ApiErrorType::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiErrorType::OperationFailed => StatusCode::OK,
            ApiErrorType::NotFound => StatusCode::NOT_FOUND,
        }
    }
}

impl actix_web::error::ResponseError for ApiKeyedError {
    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        HttpResponse::build(self.status_code()).json(json!({
            "type": "error",
            "messages": self.messages.clone()
        }))
    }
}

pub fn api_error(error_type: ApiErrorType, message: &'static str) -> ApiError {
    ApiError {
        error_type,
        message: message.to_owned(),
    }
}

pub fn api_error_owned(error_type: ApiErrorType, message: String) -> ApiError {
    ApiError {
        message,
        error_type,
    }
}

pub fn api_success(value: impl Serialize) -> HttpResponse {
    HttpResponse::Ok().json(success_response(value))
}
