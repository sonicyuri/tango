use anyhow::Result;
use apalis::prelude::Data;
use serde::{Deserialize, Serialize};

use crate::{booru_config::BooruConfig, error::Error};

use super::{
    job::{UploadJob, UploadJobContents, UploadJobResult},
    JobContext,
};

mod url;
mod ytdl;

fn is_mime_type_supported(mime: &str) -> bool {
    match mime {
        "video/mp4"
        | "video/webm"
        | "image/png"
        | "image/webp"
        | "image/jpeg"
        | "image/gif"
        | "application/x-shockwave-flash" => true,
        _ => false,
    }
}

fn is_ext_supported(ext: &str) -> bool {
    match ext {
        "mp4" | "webm" | "png" | "webp" | "jpg" | "jpeg" | "gif" | "swf" => true,
        _ => false,
    }
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum ScrapedContentType {
    #[serde(rename = "image")]
    Image {
        resolution: (usize, usize),
        url: String,
    },
    #[serde(rename = "video")]
    Video {
        resolution: (usize, usize),
        duration: usize,
    },
    #[serde(rename = "audio")]
    Audio { duration: usize },
}

#[derive(Deserialize, Serialize)]
pub struct ScraperQueryResponseItem {
    url: String,
    title: Option<String>,
    author: Option<String>,
    thumbnail_url: Option<String>,
    filesize: Option<usize>,
    #[serde(flatten)]
    content_type: ScrapedContentType,
    mime: String,
    filename: String,
}

/// How certain a scraper is about the URL matching it.
pub enum MatchCertainty {
    /// The URL is a direct match - look no farther.
    Certain,
    /// The URL will require a query to find out more.
    Maybe,
    /// It's definitely not this scraper.
    No,
}

pub enum ScraperQueryResponse {
    Some {
        extractor: String,
        items: Vec<ScraperQueryResponseItem>,
    },
    UserError(String),
    None,
}

type ScraperQueryResult = Result<ScraperQueryResponse>;

pub trait ScraperInterface: 'static {
    fn new(config: BooruConfig) -> Self;
    /// Check solely based on the URL whether we might support this.
    fn check(&self, url: &str) -> Result<MatchCertainty>;
    /// Try querying the given URL, returning its information if any.
    async fn try_query(&self, url: &str) -> ScraperQueryResult;
}

async fn query_job(job: UploadJob, data: Data<JobContext>) -> Result<UploadJobResult> {
    let url = match job.contents {
        UploadJobContents::Query { url } => Ok(url),
        _ => Err(Error::InvalidOperation(format!(
            "import_job unexpectedly called with {:?}",
            job
        ))),
    }?;

    todo!()
}

async fn import_job(job: UploadJob, data: Data<JobContext>) -> Result<UploadJobResult> {
    let (result, options) = match job.contents {
        UploadJobContents::Import { result, options } => Ok((result, options)),
        _ => Err(Error::InvalidOperation(format!(
            "import_job unexpectedly called with {:?}",
            job
        ))),
    }?;

    todo!()
}
