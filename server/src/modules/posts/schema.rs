use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct PostEditSchema {
    pub post_id: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostNewSchema {
    pub tags: Vec<String>,
    pub file: String,
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
