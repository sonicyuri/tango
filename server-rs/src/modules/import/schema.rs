use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportPrepareSchema {
    pub url: String,
}
