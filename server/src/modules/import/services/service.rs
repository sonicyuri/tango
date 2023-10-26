use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::util::ApiError;

#[derive(Serialize, Deserialize)]
pub struct ImportServicePrepareResult {
    pub image_url: String,
    pub tags: Vec<String>,
    pub service: String,
}

#[async_trait]
pub trait ImportService {
    fn test(url: String) -> bool;
    async fn prepare(&self, url: String) -> Result<ImportServicePrepareResult, ApiError>;
}
