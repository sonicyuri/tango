use async_trait::async_trait;
use log::{error, info};
use once_cell::sync::Lazy;
use regex::Regex;

use super::super::super::util::create_client;
use crate::util::{api_error, ApiError, ApiErrorType};

use super::super::service::{self, ImportService, ImportServicePrepareResult};
use super::types::E926PostResponse;

static POST_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(e926|e621)\.net\/posts\/(\d+)").unwrap());

pub struct E926ImportService {}

fn decode_url(url: String) -> Option<(String, String)> {
    match POST_REGEX.captures(url.as_str()) {
        Some(captures) => {
            let (_, [service, id]) = captures.extract();
            return Some(((*id).to_owned(), (*service).to_owned()));
        }
        None => None,
    }
}

#[async_trait]
impl ImportService for E926ImportService {
    fn test(url: String) -> bool {
        return POST_REGEX.is_match(url.as_str());
    }

    async fn prepare(&self, url: String) -> Result<ImportServicePrepareResult, ApiError> {
        let (post_id, service) =
            decode_url(url).ok_or(api_error(ApiErrorType::InvalidRequest, "Invalid post URL"))?;
        let url = format!("https://{}.net/posts/{}.json", service, post_id);

        let client = create_client()?;
        let result = client.get(url).send().await.map_err(|e| {
            error!("Request error: {:?}", e);
            api_error(
                ApiErrorType::ServerError,
                "Couldn't request post info from e926/e621",
            )
        })?;

        let result_str = result.text().await.map_err(|e| {
            error!("Can't create string from result: {:?}", e);
            api_error(
                ApiErrorType::ServerError,
                "Invalid post info from e926/e621",
            )
        })?;

        info!("{}", result_str);

        let response: E926PostResponse =
            serde_json::from_str(result_str.as_str()).map_err(|e| {
                error!("JSON deserialization error: {:?}", e);
                api_error(
                    ApiErrorType::ServerError,
                    "Can't deserialize e926/e621 post",
                )
            })?;

        let mut tags: Vec<String> = Vec::new();

        response.post.tags.iter().for_each(|(prefix, cat_tags)| {
            cat_tags.iter().for_each(|t| {
                let tag_str = match prefix.as_str() {
                    "general" => t.to_owned(),
                    p => format!("{}:{}", prefix, t),
                };

                tags.push(tag_str);
            });
        });

        return Ok(ImportServicePrepareResult {
            image_url: response.post.file.url,
            tags,
            service: "e926".to_owned(),
        });
    }
}
