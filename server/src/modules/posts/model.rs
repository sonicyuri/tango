use chrono::{DateTime, Utc};

use serde::{Deserialize, Serialize};
use sqlx::{self};

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq, Hash, sqlx::FromRow, Clone)]
#[allow(non_snake_case)]
pub struct PostModel {
    pub id: i32,
    pub owner_id: i32,
    pub owner_ip: String,
    pub filename: String,
    pub filesize: i32,
    pub hash: String,
    pub ext: String,
    pub source: Option<String>,
    pub width: i32,
    pub height: i32,
    pub posted: DateTime<Utc>,
    pub locked: i8,
    pub lossless: Option<i8>,
    pub video: Option<i8>,
    pub audio: Option<i8>,
    pub length: Option<i32>,
    pub mime: Option<String>,
    pub image: Option<i8>,
    pub video_codec: Option<String>,
    pub favorites: i32,
    pub numeric_score: i32,
    pub parent_id: Option<i32>,
    pub has_children: i8,
    pub views: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostResponse {
    pub id: i32,
    pub width: i32,
    pub height: i32,
    pub hash: String,
    pub filesize: i32,
    pub ext: String,
    pub mime: String,
    pub posted: i32,
    pub source: Option<String>,
    pub owner_id: i32,
    pub numeric_score: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub views: i32,
}

impl PostResponse {
    pub fn from_model(model: PostModel, tags: Option<Vec<String>>) -> PostResponse {
        PostResponse {
            id: model.id,
            width: model.width,
            height: model.height,
            hash: model.hash,
            filesize: model.filesize,
            ext: model.ext,
            mime: model.mime.unwrap_or("".to_string()),
            posted: model.posted.timestamp() as i32,
            source: model.source,
            owner_id: model.owner_id,
            numeric_score: model.numeric_score,
            tags: tags,
            views: model.views,
        }
    }
}

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow, Clone)]
#[allow(non_snake_case)]
pub struct PostViewModel {
    pub id: i32,
    pub image_id: i32,
    pub user_id: i32,
    pub timestamp: i32,
    pub ipaddress: String,
}

/// A post that's yet to be inserted into the database.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PendingPost {
    pub resolution: (u32, u32),
    pub hash: String,
    pub filesize: i32,
    pub mime: String,
    pub source: Option<String>,
}
