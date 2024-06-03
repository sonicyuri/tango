use std::collections::BTreeMap;

use crate::modules::posts::query::image_conditions::ImageCondition;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow, Clone)]
pub struct TagCategory {
    pub category: String,
    pub display_singular: Option<String>,
    pub display_multiple: Option<String>,
    pub color: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct TagListResponse {
    pub tags: BTreeMap<String, i64>,
    pub categories: Vec<TagCategory>,
    pub conditions: Vec<ImageCondition>,
}
