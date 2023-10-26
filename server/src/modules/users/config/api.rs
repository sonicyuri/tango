use std::collections::HashMap;

use actix_web::{get, post, web, HttpRequest, HttpResponse};
use log::error;
use serde_json::{Map, Value};
use sqlx::MySqlPool;

use super::super::middleware::{get_user, AuthFactory};
use super::schema::UserConfigSetQuery;
use crate::util::{api_error, api_success, format_db_error};
use crate::{util::ApiError, AppState};

static CONFIG_KEY: &'static str = "_tango_config";

async fn get_config(db: &MySqlPool, user_id: i32) -> Result<serde_json::Value, ApiError> {
    sqlx::query_as::<_, (String,)>("SELECT value FROM user_config WHERE user_id = ? AND name = ?")
        .bind(user_id)
        .bind(CONFIG_KEY)
        .fetch_one(db)
        .await
        .map_or_else(
            |e| match e {
                sqlx::Error::RowNotFound => Ok(serde_json::Value::Object(serde_json::Map::new())),
                e => Err(format_db_error(e)),
            },
            |(config,)| {
                Ok(serde_json::from_str(config.as_str())
                    .unwrap_or(serde_json::Value::Object(serde_json::Map::new())))
            },
        )
}

#[get("/config", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn user_config_get_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req).ok_or(api_error(
        crate::util::ApiErrorType::AuthorizationFailed,
        "Missing user",
    ))?;

    let config = get_config(&data.db, user.id).await?;

    Ok(api_success(config))
}

#[post("/config", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn user_config_set_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    params: web::Query<UserConfigSetQuery>,
    body: web::Json<HashMap<String, serde_json::Value>>,
) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req).ok_or(api_error(
        crate::util::ApiErrorType::AuthorizationFailed,
        "Missing user",
    ))?;

    let mut new_config: Map<String, Value> = match params.replace.unwrap_or(true) {
        true => Map::new(),
        false => {
            // grab existing config to merge it with the new config
            let existing_config = get_config(&data.db, user.id).await?;
            match existing_config {
                serde_json::Value::Object(map) => map,
                _ => Map::new(),
            }
        }
    };

    body.iter().for_each(|(k, v)| {
        new_config.insert(k.clone(), v.clone());
    });

    let value_str = serde_json::to_string(&new_config).map_err(|e| {
        error!("Serde serialization error: {:?}", e);
        api_error(
            crate::util::ApiErrorType::ServerError,
            "Failed to set config",
        )
    })?;

    sqlx::query!(
        "INSERT INTO user_config (`user_id`, `name`, `value`) VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE value = VALUES(value)",
        user.id,
        CONFIG_KEY,
        value_str
    )
    .execute(&data.db)
    .await
    .map_err(format_db_error)?;

    Ok(api_success(new_config))
}
