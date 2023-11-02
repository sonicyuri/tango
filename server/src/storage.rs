use s3::creds::Credentials;
use s3::error::S3Error;
use s3::{Bucket, Region};

#[derive(Clone)]
pub struct AppStorage {
    bucket: Bucket,
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
        image_path(hash)
    }

    pub fn thumb_path(&self, hash: String) -> String {
        thumb_path(hash)
    }

    pub fn image_url(&self, hash: String) -> String {
        format!("{}/{}/images/{}", self.endpoint_url, self.bucket.name, hash)
    }

    pub fn thumb_url(&self, hash: String) -> String {
        format!("{}/{}/thumbs/{}", self.endpoint_url, self.bucket.name, hash)
    }

    pub async fn new(config: &config::Config) -> AppStorage {
        let endpoint_url =
            std::env::var("AWS_ENDPOINT").expect("Missing S3 endpoint url in environment");

        let region = std::env::var("AWS_REGION").expect("Missing S3 region name in environment");

        let bucket = config
            .get_string("s3_bucket")
            .expect("Missing S3 bucket name in config");

        let credentials = Credentials::from_env().expect("Failed to create credentials");

        let bucket = Bucket::new(
            bucket.as_str(),
            Region::from_default_env().expect("Can't create region"),
            credentials,
        )
        .expect("Failed to create S3 bucket");

        AppStorage {
            bucket,
            endpoint_url,
        }
    }

    pub async fn get_image(&self, hash: String) -> Result<Vec<u8>, S3Error> {
        let response_data = self.bucket.get_object(image_path(hash)).await?;
        Ok(response_data.bytes().to_vec())
    }

    pub async fn put_image(&self, hash: String, data: &[u8]) -> Result<(), S3Error> {
        self.put_file(image_path(hash), data).await
    }

    pub async fn put_thumb(&self, hash: String, data: &[u8]) -> Result<(), S3Error> {
        self.put_file(thumb_path(hash), data).await
    }

    pub async fn delete_file(&self, path: String) -> Result<(), S3Error> {
        self.bucket.delete_object(path).await?;
        Ok(())
    }

    async fn put_file(&self, path: String, data: &[u8]) -> Result<(), S3Error> {
        self.bucket.put_object(path, data).await?;
        Ok(())
    }
}
