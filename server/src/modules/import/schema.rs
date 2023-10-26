use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportResolveSchema {
    pub post_id: String,
    pub resolver: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportPrepareSchema {
    pub url: String,
}
