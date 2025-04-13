use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::modules::posts::query::model::PostQueryResult;

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow, Clone)]
pub struct PoolModel {
    pub id: i32,
    pub user_id: i32,
    pub public: i8,
    pub title: String,
    pub description: Option<String>,
    pub date: DateTime<Utc>,
    pub posts: i32,
    pub cover: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolResponse {
    pub id: i32,
    pub owner_id: i32,
    pub public: bool,
    pub title: String,
    pub description: Option<String>,
    pub date: DateTime<Utc>,
    pub cover: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub posts: Option<Vec<PostQueryResult>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolListResponse {
    pub pools: Vec<PoolModel>,
    pub count: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolPostIdsResponse {
    pub post_ids: Vec<i32>,
}
