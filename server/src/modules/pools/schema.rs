use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolInfoSchema {
    pub id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolListSchema {
    pub limit: i32,
    pub offset: i32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum PoolPostSchema {
    Add {
        post_id: i32,
        pool_id: i32,
        new_order: i32,
    },
    Remove {
        post_id: i32,
        pool_id: i32,
    },
    Reorder {
        post_id: i32,
        pool_id: i32,
        new_order: i32,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolEditSchema {
    pub id: i32,
    pub title: Option<String>,
    pub public: Option<bool>,
    pub description: Option<String>,
}
