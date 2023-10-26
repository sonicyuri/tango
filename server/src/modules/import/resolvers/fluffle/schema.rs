use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct FluffleSearchResponseImageThumbnail {
    pub width: i32,
    pub height: i32,
    pub location: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FluffleSearchResponseImage {
    pub id: i32,
    pub score: f32,
    pub platform: String,
    pub location: String,
    pub thumbnail: FluffleSearchResponseImageThumbnail,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FluffleSearchResponse {
    pub errors: Option<HashMap<String, Vec<String>>>,
    pub code: Option<String>,
    pub message: Option<String>,
    pub id: Option<String>,
    pub results: Option<Vec<FluffleSearchResponseImage>>,
}
