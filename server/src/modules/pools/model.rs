use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::modules::posts::model::PostResponse;

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow, Clone)]
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
    pub owner_id: i32,
    pub public: bool,
    pub title: String,
    pub description: Option<String>,
    pub date: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub posts: Option<Vec<PostResponse>>,
}
