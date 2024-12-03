pub mod database;

use log::error;
use once_cell::sync::Lazy;
use serde::Serialize;
use serde_json::json;

use crate::error::{api_error, ApiError, ApiErrorType};

use snowdon::{ClassicLayout, Epoch, Generator, MachineId, Snowflake};

pub fn success_response(value: impl Serialize) -> impl Serialize {
    json!({ "type": "success", "result": value })
}

pub fn error_response(message: String) -> impl Serialize {
    json!({ "type": "error", "message": message })
}

pub mod http {
    static APP_USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"));

    use super::*;

    pub fn create_client() -> Result<reqwest::Client, ApiError> {
        reqwest::Client::builder()
            .user_agent(APP_USER_AGENT)
            .build()
            .map_err(|e| {
                error!("Failed to build reqwest client: {:?}", e);
                api_error(ApiErrorType::ServerError, "Failed to create request")
            })
    }
}

struct SnowflakeParams;

impl Epoch for SnowflakeParams {
    fn millis_since_unix() -> u64 {
        1719889250057
    }
}

impl MachineId for SnowflakeParams {
    fn machine_id() -> u64 {
        0
    }
}

type ClassicSnowflake = Snowflake<ClassicLayout<SnowflakeParams>, SnowflakeParams>;
type ClassicSnowflakeGenerator = Generator<ClassicLayout<SnowflakeParams>, SnowflakeParams>;

static SNOWFLAKE_GENERATOR: Lazy<ClassicSnowflakeGenerator> =
    Lazy::new(|| ClassicSnowflakeGenerator::default());

pub fn snowflake_id() -> anyhow::Result<u64> {
    Ok(SNOWFLAKE_GENERATOR.generate()?.into_inner())
}
