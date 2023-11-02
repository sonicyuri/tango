use actix_web::{get, post, web, HttpRequest, HttpResponse};

use super::resolvers::get_resolvers;
use super::services::get_service;
use super::services::service::ImportService;
use super::{
    resolvers::resolver::ImportResolver, resolvers::resolver::ImportResolverFile,
    schema::ImportPrepareSchema,
};
use crate::error::ApiErrorType;
use crate::modules::posts::model::PostModel;
use crate::{
    error::{api_error, api_success, ApiError},
    modules::{
        import::{resolvers::get_resolver, schema::ImportResolveSchema},
        users::middleware::AuthFactory,
    },
    AppState,
};

#[get("/resolve", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn import_list_resolvers_handler() -> Result<HttpResponse, ApiError> {
    let resolvers = get_resolvers();
    Ok(api_success(resolvers))
}

#[post("/resolve", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn import_resolve_handler(
    body: web::Json<ImportResolveSchema>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let resolver = get_resolver(body.resolver.clone()).ok_or(api_error(
        ApiErrorType::InvalidRequest,
        "Unknown or unsupported resolver",
    ))?;

    let post = sqlx::query_as!(PostModel, "SELECT * FROM images WHERE id = ?", body.post_id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                api_error(ApiErrorType::InvalidRequest, "Couldn't find post")
            }
            e => e.into(),
        })?;

    if post.image.is_some() && post.image.unwrap_or(0) == 0 {
        return Err(api_error(
            ApiErrorType::InvalidRequest,
            "Only image posts can be resolved.",
        ));
    }

    let result = resolver
        .search(ImportResolverFile::new(post, data.storage.clone()))
        .await?;
    Ok(api_success(result))
}

#[post("/prepare", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn import_prepare_handler(
    body: web::Json<ImportPrepareSchema>,
) -> Result<HttpResponse, ApiError> {
    let service = get_service(body.url.clone()).ok_or(api_error(
        ApiErrorType::InvalidRequest,
        "Unknown or unsupported service",
    ))?;

    let result = service.prepare(body.url.clone()).await?;
    Ok(api_success(result))
}
