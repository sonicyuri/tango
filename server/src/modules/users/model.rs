use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow, Clone)]
#[allow(non_snake_case)]
pub struct UserModel {
    pub id: i32,
    pub name: String,
    pub pass: Option<String>,
    pub joindate: DateTime<Utc>,
    pub class: String,
    pub email: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct UserModelResponse {
    pub id: i32,
    pub name: String,
    pub joindate: DateTime<Utc>,
    pub class: String,
    pub email: Option<String>,
}

pub fn filter_db_record(user: &UserModel) -> UserModelResponse {
    UserModelResponse {
        id: user.id.to_owned(),
        name: user.name.to_owned(),
        joindate: user.joindate.to_owned(),
        class: user.class.to_owned(),
        email: user.email.to_owned(),
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AuthTokenResponse {
    pub token: String,
    pub expires: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserLoginResponse {
    pub access: AuthTokenResponse,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh: Option<AuthTokenResponse>,
    pub user: UserModelResponse,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserRefreshResponse {
    pub access: AuthTokenResponse,
    pub user: UserModelResponse,
}
