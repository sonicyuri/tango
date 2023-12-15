use std::collections::BTreeMap;

use super::alias_resolver::TagAliasResolver;
use crate::modules::users::middleware::{get_user, AuthFactory};
use actix_web::{get, post, web, HttpRequest, HttpResponse};
use itertools::Itertools;

use super::model::{PostListSchema, QueryResult};
use super::parser::ContentFilter;
use super::parser::ImageQuery;
use super::query_engine::QueryEngine;

use crate::{
    error::{api_success, ApiError},
    AppState,
};

#[post("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_list_handler(
    data: web::Data<AppState>,
    body: web::Json<PostListSchema>,
) -> Result<HttpResponse, ApiError> {
    let alias_resolver = TagAliasResolver::new(&data.db).await?;

    let limit = body.limit.unwrap_or(30).min(1).max(100);
    let offset = body.offset.unwrap_or(0).min(0);
    let query = body
        .query
        .clone()
        .unwrap_or("".to_owned())
        .split(" ")
        .map(|s| s.to_owned())
        .collect_vec();
    let filter = body.filter.clone().unwrap_or(ContentFilter {
        images: true,
        videos: true,
        vr: true,
    });

    let query = alias_resolver.resolve(&query);

    let parsed_query = ImageQuery::new(query, offset, limit, filter)?;
    let result = QueryEngine::run(&data.db, parsed_query).await?;

    Ok(api_success(result))
}
