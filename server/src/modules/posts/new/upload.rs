use std::io::Read;
use std::sync::Arc;

use log::error;
use sqlx::MySqlPool;
use tempfile::NamedTempFile;

use super::media::{create_thumbnail, UploadInfo};
use crate::booru_config::BooruConfig;
use crate::error::ApiError;
use crate::modules::posts::edit::set_post_tags;
use crate::modules::posts::model::PostResponse;
use crate::storage::AppStorage;

pub struct OwnerContext {
    pub owner_id: i32,
    pub owner_ip: String,
}

struct PostRemoteContentHandler {
    hash: String,
    storage: Arc<AppStorage>,
    thumb_uploaded: bool,
    image_uploaded: bool,
}

fn file_to_bytes(file: &NamedTempFile) -> Result<Vec<u8>, String> {
    let mut handle = file.reopen().map_err(|e| {
        error!("Error reopening temp file: {:?}", e);
        "Temp file error".to_owned()
    })?;

    let mut buf: Vec<u8> = Vec::new();
    handle.read_to_end(&mut buf).map_err(|e| {
        error!("Error reading temp file: {:?}", e);
        "Temp file error".to_owned()
    })?;
    Ok(buf)
}

impl PostRemoteContentHandler {
    pub fn new(hash: String, storage: &Arc<AppStorage>) -> PostRemoteContentHandler {
        PostRemoteContentHandler {
            hash,
            thumb_uploaded: false,
            image_uploaded: false,
            storage: storage.clone(),
        }
    }

    pub async fn upload_image(&mut self, file: &NamedTempFile) -> Result<(), String> {
        self.storage
            .put_image(self.hash.clone(), &file_to_bytes(file)?)
            .await
            .map_err(|e| {
                error!("S3 error: {:?}", e);
                "Unable to upload image".to_owned()
            })?;

        self.image_uploaded = true;
        Ok(())
    }

    pub async fn upload_thumb(&mut self, file: &NamedTempFile) -> Result<(), String> {
        self.storage
            .put_thumb(self.hash.clone(), &file_to_bytes(file)?)
            .await
            .map_err(|e| {
                error!("S3 error: {:?}", e);
                "Unable to upload thumbnail".to_owned()
            })?;

        self.thumb_uploaded = true;
        Ok(())
    }

    pub async fn undo(&self) -> Result<(), String> {
        if self.image_uploaded {
            self.storage
                .delete_file(self.storage.image_path(self.hash.clone()))
                .await
                .map_err(|e| {
                    error!("S3 error while deleting: {:?}", e);
                    "Error reversing changes".to_owned()
                })?;
        }

        if self.thumb_uploaded {
            self.storage
                .delete_file(self.storage.thumb_path(self.hash.clone()))
                .await
                .map_err(|e| {
                    error!("S3 error while deleting: {:?}", e);
                    "Error reversing changes".to_owned()
                })?;
        }

        Ok(())
    }
}

type PostCreateResult = Result<(String, PostResponse), (String, String)>;

async fn upload_and_create_with_thumb(
    db: &MySqlPool,
    tags: Vec<String>,
    owner: OwnerContext,
    handler: &mut PostRemoteContentHandler,
    content_file: &NamedTempFile,
    thumb_file: &NamedTempFile,
    filename: String,
    info: &UploadInfo,
) -> Result<PostResponse, String> {
    handler.upload_image(&content_file).await?;
    handler.upload_thumb(&thumb_file).await?;

    let is_video = match info.is_video() {
        true => 1,
        false => 0,
    };
    let is_image = match info.is_image() {
        true => 1,
        false => 0,
    };

    let response = sqlx::query!(
        r#"
		INSERT INTO images 
		(`owner_id`, `owner_ip`, `filename`, `filesize`, `hash`, `ext`, `width`, `height`, `video`, `image`, `length`, `mime`)
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        owner.owner_id,
        owner.owner_ip,
        filename,
        info.filesize,
        info.hash,
        info.get_ext(),
        info.width,
        info.height,
        is_video,
        is_image,
        info.length,
        info.mime
    )
	.execute(db)
	.await
	.map_err(|e| {
		error!("DB error when creating post: {:?}", e);
		"Unknown DB error".to_owned()
	})?;

    let post_id = response.last_insert_id().to_string();
    let post_result = set_post_tags(db, post_id.clone(), tags).await;

    match post_result {
        Err(e) => {
            sqlx::query!("DELETE FROM images WHERE id = ?", post_id)
                .execute(db)
                .await
                .map_err(|e| {
                    error!("DB error when deleting created post: {:?}", e);
                    "Unknown DB error".to_owned()
                })?;

            Err(e.message)
        }
        Ok(post) => Ok(post),
    }
}

pub async fn upload_and_create_post(
    db: &MySqlPool,
    tags: Vec<String>,
    owner: OwnerContext,
    storage: &Arc<AppStorage>,
    config: BooruConfig,
    filename: String,
    temp_file: &NamedTempFile,
    info: &UploadInfo,
) -> PostCreateResult {
    let thumb = create_thumbnail(&config, &temp_file, &info)
        .await
        .map_err(|e| (filename.clone(), e))?;

    let mut handler = PostRemoteContentHandler::new(info.hash.clone(), storage);
    let res = upload_and_create_with_thumb(
        db,
        tags,
        owner,
        &mut handler,
        temp_file,
        &thumb,
        filename.clone(),
        info,
    )
    .await
    .map(|v| (filename.clone(), v))
    .map_err(|e| (filename.clone(), e));

    // if upload or creation failed, delete uploaded posts
    if res.is_err() {
        handler.undo().await.map_err(|e| (filename.clone(), e))?;
    }

    res
}
