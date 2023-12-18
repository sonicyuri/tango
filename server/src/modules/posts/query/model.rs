use itertools::Itertools;
use serde::{Deserialize, Serialize};
use sqlx::MySqlPool;

use crate::{
    error::ApiError,
    modules::{pools::model::PoolResponse, posts::model::PostModel},
};

use super::parser::ContentFilter;

#[derive(Serialize, Deserialize, Debug)]
pub struct PostQueryResult {
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
    pub tags: Vec<String>,
    pub pools: Vec<i32>,
}

impl PostQueryResult {
    pub fn from_model(
        model: PostModel,
        tags: Vec<String>,
        pools: Vec<i32>,
    ) -> Result<PostQueryResult, ApiError> {
        Ok(PostQueryResult {
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
            tags,
            pools,
        })
    }

	pub async fn from_model_query(model: PostModel, db: &MySqlPool) -> Result<PostQueryResult, ApiError> {
		let tag_result = 
			sqlx::query_as::<_, (String,)>("SELECT t.tag FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE it.image_id = ?")
			.bind(model.id)
			.fetch_all(db)
			.await?;

		let tags = tag_result.iter().map(|(t,)| t.to_owned()).collect_vec();

		let pool_result = sqlx::query_as::<_, (i32,)>("SELECT pool_id FROM pool_images WHERE image_id = ?").bind(model.id).fetch_all(db).await?;
		let pools = pool_result.iter().map(|(p,)| p.to_owned()).collect_vec();

		PostQueryResult::from_model(model, tags, pools)
	}
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VoteResponse {
    pub post_id: i32,
    pub vote: i8,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct QueryResult {
    pub posts: Vec<PostQueryResult>,
    pub pools: Vec<PoolResponse>,
    pub offset: i32,
    pub total_results: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PostListSchema {
    pub query: Option<String>,
    pub offset: Option<i32>,
    pub limit: Option<i32>,
    pub filter: Option<String>,
}
