use anyhow::Result;

use super::{MatchCertainty, ScraperInterface, ScraperQueryResult};
use crate::{
    booru_config::BooruConfig,
    modules::upload_jobs::import::{is_mime_type_supported, ScraperQueryResponse},
    util::{self, http},
};

pub struct UrlScraper {
    config: BooruConfig,
}

impl ScraperInterface for UrlScraper {
    fn check(&self, url: &str) -> Result<MatchCertainty> {
        Ok(MatchCertainty::Maybe)
    }

    async fn try_query(&self, url: &str) -> ScraperQueryResult {
        let client = http::create_client()?;
        let head = client.execute(client.head(url).build()?).await?;
        let headers = head.headers();

        let num_bytes = head.content_length();
        if num_bytes.is_none() {
            return Ok(ScraperQueryResponse::UserError(
                "Couldn't get file size of remote resource".into(),
            ));
        }

        let num_bytes = num_bytes.unwrap();

        let content_type = head.headers().get("content-type");
        if content_type.is_none() {
            return Ok(ScraperQueryResponse::UserError(
                "Couldn't get content type of remote resource".into(),
            ));
        }

        let content_type = content_type.unwrap();
        let t = content_type.to_str()?.split(";").next();
        if t.is_none() {
            return Ok(ScraperQueryResponse::UserError(
                "Couldn't get content type of remote resource".into(),
            ));
        }

        let content_type = t.unwrap();
        if !is_mime_type_supported(content_type) {
            // todo: some remote resources won't have a content-type but we can get it by checking the first few bytes, if supported - right?
            return Ok(ScraperQueryResponse::UserError(format!(
                "Can't import file of type {}",
                content_type
            )));
        }

        todo!()
    }

    fn new(config: BooruConfig) -> Self {
        UrlScraper { config }
    }
}
