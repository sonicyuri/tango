use actix_multipart::Field;
use futures::{StreamExt, TryStreamExt};
use log::error;
use sqlx::MySqlPool;
use tempfile::NamedTempFile;

use crate::{
    booru_config::BooruConfig,
    error::{api_error, ApiError, ApiErrorType},
    modules::posts::schema::{PostNewSchema, PostsNewSchema},
    util::create_client,
};
use std::{
    io::{Read, Write},
    str,
};

use super::media::{get_content_info, UploadInfo};

type FileProcessResult = Result<(String, UploadInfo, NamedTempFile), (String, String)>;

// returns true if this upload is unique, false if the hash exists
async fn check_upload_unique(db: &MySqlPool, hash: String) -> Result<bool, String> {
    sqlx::query("SELECT 1 FROM images WHERE hash = ?")
        .bind(hash)
        .fetch_one(db)
        .await
        .map_or_else(
            |e| match e {
                sqlx::Error::RowNotFound => Ok(true),
                _ => {
                    error!("Database error: {:?}", e);
                    Err("Database error".to_owned())
                }
            },
            |v| Ok(false),
        )
}

pub async fn process_url_upload(
    db: &MySqlPool,
    config: BooruConfig,
    filename: String,
    url: String,
) -> FileProcessResult {
    let client = create_client().map_err(|e| {
        error!("Error creating client: {:?}", e);
        (filename.clone(), "Couldn't make URL request".to_owned())
    })?;

    let result = client.get(url).send().await.map_err(|e| match e.status() {
        Some(status) => (
            filename.clone(),
            format!("Remote service returned {} error code", status.as_u16()),
        ),
        None => {
            error!("Unknown request error: {:?}", e);
            (
                filename.clone(),
                "Failed to request URL information".to_owned(),
            )
        }
    })?;

    let len = result.content_length().unwrap_or(0);
    if len < 1 {
        return Err((
            filename.clone(),
            "No content found on remote URL".to_owned(),
        ));
    } else if len > config.upload_size as u64 {
        return Err((
            filename.clone(),
            format!("Max upload size is currently {} bytes", config.upload_size),
        ));
    }

    let mut temp = NamedTempFile::new().map_err(|e| {
        error!("Failed to create temp file: {:?}", e);
        (
            filename.clone(),
            "Server error allocating file contents".to_owned(),
        )
    })?;

    // write the byte stream to a temp file to avoid keeping everything in memory
    let mut stream = result.bytes_stream();
    while let Some(item) = stream.next().await {
        let bytes = item.map_err(|e| {
            error!("Failed to obtain byte stream: {:?}", e);
            (
                filename.clone(),
                "Failed to get remote file contents".to_owned(),
            )
        })?;

        temp.write_all(&bytes).map_err(|e| {
            error!("Error writing to temp file: {:?}", e);
            (filename.clone(), "Temp file error".to_owned())
        })?;
    }

    let info = get_content_info(&temp)
        .await
        .map_err(|e| (filename.clone(), e))?;

    if !check_upload_unique(db, info.hash.clone())
        .await
        .map_err(|e| (filename.clone(), e))?
    {
        return Err((
            filename.clone(),
            format!("Existing upload matches hash '{}'", info.hash.clone()),
        ));
    }

    Ok((filename, info, temp))
}

pub async fn process_file_upload(
    db: &MySqlPool,
    config: BooruConfig,
    filename: String,
    field: &Vec<u8>,
) -> FileProcessResult {
    if field.len() > config.upload_size {
        return Err((
            filename.clone(),
            format!("Max upload size is currently {} bytes", config.upload_size),
        ));
    } else if field.len() < 1 {
        return Err((
            filename.clone(),
            "No content found on remote URL".to_owned(),
        ));
    }

    let mut temp = NamedTempFile::new().map_err(|e| {
        error!("Failed to create temp file: {:?}", e);
        (
            filename.clone(),
            "Server error allocating file contents".to_owned(),
        )
    })?;

    temp.write_all(field).map_err(|e| {
        error!("Failed to write to temp file: {:?}", e);
        (filename.clone(), "Temp file error".to_owned())
    })?;

    let info = get_content_info(&temp)
        .await
        .map_err(|e| (filename.clone(), e))?;

    if !check_upload_unique(db, info.hash.clone())
        .await
        .map_err(|e| (filename.clone(), e))?
    {
        return Err((
            filename.clone(),
            format!("Existing upload matches hash '{}'", info.hash.clone()),
        ));
    }

    Ok((filename, info, temp))
}

pub async fn process_upload(
    db: &MySqlPool,
    config: BooruConfig,
    post: PostNewSchema,
    field: Option<Vec<u8>>,
) -> FileProcessResult {
    match post.upload_type.as_str() {
        "file" => {
            let mut field = field.ok_or((
                post.filename.clone(),
                format!("`file` points to invalid key '{}'", post.file),
            ))?;

            process_file_upload(db, config, post.filename.clone(), &mut field).await
        }
        "url" => process_url_upload(db, config, post.filename.clone(), post.file.clone()).await,
        _ => Err((
            post.filename.clone(),
            format!("Invalid upload_type {}", post.upload_type),
        )),
    }
}
