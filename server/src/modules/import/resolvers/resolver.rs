use std::{rc::Rc, sync::Arc};

use async_trait::async_trait;
use log::error;
use serde::{Deserialize, Serialize};

use crate::{
    error::{api_error, ApiError, ApiErrorType},
    modules::posts::{self, model::PostModel},
    storage::{self, AppStorage},
};

#[derive(Serialize, Deserialize)]
pub struct ImportResolverImageResult {
    pub service: String,
    pub url: String,
    pub thumbnail_url: String,
    pub score: f32,
}

#[derive(Serialize, Deserialize)]
pub struct ImportResolverInfo {
    pub id: String,
    pub name: String,
    pub services: Vec<String>,
}

pub struct ImportResolverFile {
    hash: String,
    storage: Arc<AppStorage>,
}

impl ImportResolverFile {
    pub fn new(post: PostModel, storage: Arc<AppStorage>) -> ImportResolverFile {
        ImportResolverFile {
            hash: post.hash,
            storage,
        }
    }

    pub fn get_url(&self) -> String {
        self.storage.image_url(self.hash.clone())
    }

    pub async fn get_file(&self) -> Result<Vec<u8>, ApiError> {
        self.storage
            .get_image(self.hash.clone())
            .await
            .map_err(|e| {
                error!("Get object error: {:?}", e);
                api_error(
                    ApiErrorType::ServerError,
                    "Couldn't obtain image from storage",
                )
            })
    }
}

#[async_trait]
pub trait ImportResolver {
    async fn search(
        &self,
        file: ImportResolverFile,
    ) -> Result<Vec<ImportResolverImageResult>, ApiError>;
    fn get_info() -> ImportResolverInfo;
}
