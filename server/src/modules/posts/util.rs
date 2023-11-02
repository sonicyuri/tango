use serde::{Deserialize, Serialize};
use sqlx::MySqlPool;

use crate::error::ApiError;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct PostTag {
    pub id: i32,
    pub tag: String,
    pub count: i32,
}

pub async fn fetch_tags(db: &MySqlPool, tags: &Vec<String>) -> Result<Vec<PostTag>, ApiError> {
    if tags.len() == 0 {
        return Ok(Vec::new());
    }

    let tag_query_str = format!(
        "SELECT id, tag, count FROM tags WHERE tag IN ({})",
        itertools::Itertools::intersperse(tags.iter().map(|_| "?".to_owned()), ",".to_owned())
            .collect::<String>()
    );

    let mut tag_query = sqlx::query_as::<_, PostTag>(&tag_query_str.as_str());

    for (_, t) in tags.iter().enumerate() {
        tag_query = tag_query.bind(t);
    }

    // turn all tags into IDs
    let tag_objs: Vec<PostTag> = tag_query.fetch_all(db).await?;

    return Ok(tag_objs);
}
