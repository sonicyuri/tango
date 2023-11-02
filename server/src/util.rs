use std::collections::HashMap;

use actix_web::{http::StatusCode, HttpResponse};
use derive_more::{Display, Error};
use log::error;
use serde::Serialize;
use serde_json::json;

use crate::error::{api_error, ApiError, ApiErrorType};

pub fn success_response(value: impl Serialize) -> impl Serialize {
    json!({ "type": "success", "result": value })
}

pub fn error_response(message: String) -> impl Serialize {
    json!({ "type": "error", "message": message })
}

static APP_USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"));

pub fn create_client() -> Result<reqwest::Client, ApiError> {
    reqwest::Client::builder()
        .user_agent(APP_USER_AGENT)
        .build()
        .map_err(|e| {
            error!("Failed to build reqwest client: {:?}", e);
            api_error(ApiErrorType::ServerError, "Failed to create request")
        })
}
