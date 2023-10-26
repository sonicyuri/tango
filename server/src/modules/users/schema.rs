use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct UserLoginSchema {
    pub username: String,
    pub password: String,
    pub remember_me: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserRefreshSchema {
    pub refresh_token: String,
}
