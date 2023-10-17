use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct PostEditSchema {
    pub post_id: String,
    pub tags: Vec<String>,
}
