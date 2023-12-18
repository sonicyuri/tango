use std::collections::BTreeMap;

use super::alias_resolver::TagAliasResolver;
use crate::error::{api_error, ApiErrorType};
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

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_list_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Query<PostListSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let alias_resolver = TagAliasResolver::new(&data.db).await?;

    let limit = body.limit.unwrap_or(30).min(100).max(1);
    let offset = body.offset.unwrap_or(0).max(0);
    let query = body
        .query
        .clone()
        .unwrap_or("".to_owned())
        .split(" ")
        .map(|s| s.to_owned())
        .collect_vec();

    let filter = body
        .filter
        .as_ref()
        .and_then(|s| {
            let mut filter = ContentFilter {
                images: false,
                videos: false,
                vr: false,
            };
            for p in s.split(",") {
                match p {
                    "images" => filter.images = true,
                    "videos" => filter.videos = true,
                    "vr" => filter.vr = true,
                    _ => {}
                };
            }

            Some(filter)
        })
        .unwrap_or(ContentFilter {
            images: true,
            videos: true,
            vr: true,
        });

    let query = alias_resolver.resolve(&query);

    let parsed_query = ImageQuery::new(query, offset, limit, filter)?;
    let result = QueryEngine::run(&data.db, parsed_query, user.id).await?;

    Ok(api_success(result))
}
