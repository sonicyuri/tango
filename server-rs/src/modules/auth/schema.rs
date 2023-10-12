use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct UserLoginSchema {
    pub username: String,
    pub password: String,
    pub rememberMe: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct UserRefreshSchema {
    pub refreshToken: String,
}
