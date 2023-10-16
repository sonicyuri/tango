use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx;

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow, Clone)]
#[allow(non_snake_case)]
pub struct PostModel {
    pub id: i64,
    pub owner_id: i64,
    pub owner_ip: String,
    pub filename: String,
    pub filesize: i64,
    pub hash: String,
    pub ext: String,
    pub source: String,
    pub width: i64,
    pub height: i64,
    pub posted: DateTime<Utc>,
    pub locked: bool,
    pub lossless: bool,
    pub video: bool,
    pub audio: bool,
    pub length: i64,
    pub mime: String,
    pub image: bool,
    pub video_codec: String,
    pub favorites: i64,
    pub numeric_score: i64,
    pub parent_id: i64,
    pub has_children: bool,
}
