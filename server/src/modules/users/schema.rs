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

#[derive(Serialize, Deserialize, Debug)]
pub struct UserSignupSchema {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub invite_code: Option<String>,
}
