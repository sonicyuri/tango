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

#[derive(Serialize, Deserialize, Debug)]
pub struct PostDeleteSchema {
    pub post_id: String,
}
