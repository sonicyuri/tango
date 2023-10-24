use aws_sdk_s3::{
    self, config::Region, operation::get_object::GetObjectError, primitives::ByteStream, Client,
};
use futures::TryStreamExt;
use log::error;
use once_cell::sync::Lazy;

use crate::util::api_error;

#[derive(Clone)]
pub struct AppStorage {
    client: Client,
    bucket: String,
    endpoint_url: String,
}

fn image_path(hash: String) -> String {
    format!("images/{}", hash)
}

fn thumb_path(hash: String) -> String {
    format!("thumbs/{}", hash)
}

impl AppStorage {
    pub fn image_path(&self, hash: String) -> String {
        format!("{}/{}/images/{}", self.endpoint_url, self.bucket, hash)
    }

    pub fn thumb_path(&self, hash: String) -> String {
        format!("{}/{}/thumbs/{}", self.endpoint_url, self.bucket, hash)
    }

    pub async fn new(config: &config::Config) -> AppStorage {
        let endpoint_url = config
            .get_string("s3_endpoint")
            .expect("Missing S3 endpoint url in config");

        let bucket = config
            .get_string("s3_bucket")
            .expect("Missing S3 bucket name in config");

        let region = config
            .get_string("s3_region")
            .expect("Missing S3 region name in config");

        let config = aws_config::from_env()
            .endpoint_url(endpoint_url.clone())
            .region(Region::new(region))
            .load()
            .await;

        let client = aws_sdk_s3::Client::new(&config);

        AppStorage {
            client,
            bucket,
            endpoint_url,
        }
    }

    pub async fn get_file(&self, hash: String) -> Result<Vec<u8>, GetObjectError> {
        Ok(self
            .client
            .get_object()
            .set_bucket(Some(self.bucket.clone()))
            .set_key(Some(image_path(hash)))
            .send()
            .await
            .map_err(|e| e.into_service_error())?
            .body
            .try_next()
            .await
            .map_err(|e| {
                error!("Unknown S3 error: {:?}", e);
                GetObjectError::unhandled(e)
            })?
            .ok_or(GetObjectError::unhandled("Can't get bytes"))?
            .to_vec())
    }
}
