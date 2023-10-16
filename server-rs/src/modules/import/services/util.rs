use log::error;

use crate::util::{api_error, ApiError, ApiErrorType};

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
