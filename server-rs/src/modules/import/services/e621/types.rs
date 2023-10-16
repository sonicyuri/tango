use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct E621PostFile {
    pub width: i32,
    pub height: i32,
    pub ext: String,
    pub size: i32,
    pub md5: String,
    pub url: String,
}

#[derive(Serialize, Deserialize)]
pub struct E621Post {
    pub id: i32,
    pub created_at: String,
    pub updated_at: String,
    pub file: E621PostFile,
    pub tags: HashMap<String, Vec<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct E621PostResponse {
    pub post: E621Post,
}
