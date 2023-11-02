use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct PostVoteSchema {
    pub post_id: String,
    pub action: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PostEditSchema {
    pub post_id: String,
    pub tags: Vec<String>,
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

#[derive(Serialize, Deserialize, Debug)]
pub struct PostDeleteSchema {
    pub post_id: String,
}
