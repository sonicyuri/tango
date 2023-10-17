use actix_web::{post, web, HttpRequest, HttpResponse};

use super::schema::ImportPrepareSchema;
use super::services::get_service;
use super::services::service::ImportService;
use crate::{
    modules::users::middleware::AuthFactory,
    util::{api_error, api_success, ApiError},
    AppState,
};

#[post("/prepare", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn import_prepare_handler(
    body: web::Json<ImportPrepareSchema>,
) -> Result<HttpResponse, ApiError> {
    let service = get_service(body.url.clone()).ok_or(api_error(
        crate::util::ApiErrorType::InvalidRequest,
        "Unknown or unsupported service",
    ))?;

    let result = service.prepare(body.url.clone()).await?;
    Ok(api_success(result))
}
