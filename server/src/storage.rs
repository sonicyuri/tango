use std::fs;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use once_cell::unsync::Lazy;
use s3::creds::Credentials;
use s3::error::S3Error;
use s3::{Bucket, Region};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

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

        let _region = std::env::var("AWS_REGION").expect("Missing S3 region name in environment");

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

type DataManagerPtr = Arc<Mutex<DataManagerInner>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TempFile(u64, PathBuf);

impl TempFile {
    /// Deletes this temporary file.
    pub fn close(&self, data_manager: DataManagerPtr) {}
}

impl Deref for TempFile {
    type Target = Path;

    fn deref(&self) -> &Self::Target {
        self.1.as_path()
    }
}

/// Manages temp files and other things in the data/ directory.
pub struct DataManagerInner {
    db: sled::Db,
    dir: PathBuf,
    temp_dir: PathBuf,
}

#[derive(Clone)]
pub struct DataManager(DataManagerPtr);

impl DataManager {
    pub fn new() -> Self {
        let dir: PathBuf = PathBuf::from("data");
        fs::create_dir(&dir).unwrap();
        let sled = sled::open(dir.clone().join("cache")).unwrap();
        let temp_dir = dir.clone().join("temp");

        let unknown_files = fs::read_dir(&temp_dir).unwrap().filter(|d| {
            sled.get(d.as_ref().unwrap().file_name().as_encoded_bytes())
                .unwrap()
                .is_none()
        });

        for f in unknown_files {
            fs::remove_file(temp_dir.clone().join(f.unwrap().file_name())).unwrap();
        }

        DataManager(Arc::new(Mutex::new(DataManagerInner {
            dir,
            db: sled,
            temp_dir,
        })))
    }

    /// Creates and records a new temp file.
    /// The file will not be deleted until you call [TempFile::close()].
    pub async fn temp_file(&self) -> anyhow::Result<TempFile> {
        let dm = self.0.lock().await;
        let dir = dm.temp_dir.clone();

        let mut gen = srfng::Generator::new();
        let filename: String;
        loop {
            let new_file = gen.generate();
            if !dir.clone().join(&new_file).is_file() {
                filename = new_file;
                break;
            }
        }

        let mut s = DefaultHasher::default();
        filename.hash(&mut s);
        let id = s.finish();
        let path = dir.join(&filename);
        let temp = TempFile(id, path);

        // record temp file in the database
        dm.db
            .insert(id.to_le_bytes(), serde_json::to_string(&temp)?.as_bytes())?;

        Ok(temp)
    }
}
