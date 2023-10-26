use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UserConfigSetSchema {
    pub values: HashMap<String, serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct UserConfigSetQuery {
    pub replace: Option<bool>,
}
