use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::modules::posts::model::PostResponse;

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolModel {
    pub id: i32,
    pub user_id: i32,
    pub public: i8,
    pub title: String,
    pub description: Option<String>,
    pub date: DateTime<Utc>,
    pub posts: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolResponse {
    pub id: i32,
    pub public: bool,
    pub title: String,
    pub description: Option<String>,
    pub date: DateTime<Utc>,
    pub post_count: i32,
}

impl From<PoolModel> for PoolResponse {
    fn from(value: PoolModel) -> Self {
        PoolResponse {
            id: value.id,
            public: value.public == 1,
            title: value.title,
            description: value.description,
            date: value.date,
            post_count: value.posts,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostNewResponse {
    pub posts: HashMap<String, PostResponse>,
    pub pool: Option<PoolResponse>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PostNewSchema {
    pub tags: Vec<String>,
    pub file: String,
    // if "url", file specifies a URL to download. if "file", file specifies the key of the multipart for the file upload
    pub upload_type: String,
    pub filename: String,
    pub pool_index: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostsNewPoolSchema {
    pub title: String,
    pub description: Option<String>,
    pub private: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostsNewSchema {
    pub posts: Vec<PostNewSchema>,
    pub pool: Option<PostsNewPoolSchema>,
}
