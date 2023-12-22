use chrono::{DateTime, NaiveDateTime};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct UserInviteResponse {
    pub invite_code: String,
}

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow)]
pub struct UserInviteModel {
    pub id: i32,
    pub creator_id: i32,
    pub invite_code: String,
    pub redeemed: bool,
    pub redeemed_time: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserListInvitesResponse {
    pub invites: Vec<UserInviteModel>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserDeleteInviteSchema {
    pub invite_id: i32,
}
