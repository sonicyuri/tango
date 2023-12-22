use actix_web::{get, post, web, HttpRequest, HttpResponse};
use log::error;
use rand::RngCore;
use sqlx::MySqlPool;
use substring::Substring;

use crate::{
    error::{api_error, api_success, ApiError, ApiErrorType},
    modules::users::{
        invites::model::UserDeleteInviteSchema,
        middleware::{get_user, AuthFactory},
    },
    AppState,
};

use super::model::{UserInviteModel, UserInviteResponse, UserListInvitesResponse};

async fn get_user_invites(db: &MySqlPool, user_id: i32) -> Result<Vec<UserInviteModel>, ApiError> {
    let models = sqlx::query_as!(
        UserInviteModel,
        "SELECT id, creator_id, invite_code, redeemed as `redeemed: _`, redeemed_time FROM user_invites WHERE creator_id = ?",
        user_id
    )
    .fetch_all(db)
    .await?;

    Ok(models)
}

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn user_list_invites_handler(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    Ok(api_success(UserListInvitesResponse {
        invites: get_user_invites(&data.db, user.id).await?,
    }))
}

#[post("/new", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn user_create_invite_handler(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    // generate invite code
    let mut code = String::new();
    let mut rng = rand::thread_rng();
    let mut bytes = [0x00; 8];
    loop {
        rng.try_fill_bytes(&mut bytes).map_err(|e| {
            error!("Can't fill bytes from RNG: {:?}", e);
            api_error(ApiErrorType::ServerError, "Failed to generate invite code")
        })?;

        let encoded_str = bs58::encode(bytes).into_string();
        code = encoded_str.substring(0, 4).to_owned();
        code.push('-');
        code.push_str(encoded_str.substring(4, 8));

        // make sure we're not generating a code we've already generated - just in case
        let (count,) =
            sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM user_invites WHERE invite_code = ?")
                .bind(code.clone())
                .fetch_one(&data.db)
                .await?;

        if count < 1 {
            break;
        }
    }

    sqlx::query("INSERT INTO user_invites (`creator_id`, `invite_code`) VALUES(?, ?)")
        .bind(user.id)
        .bind(code)
        .execute(&data.db)
        .await?;

    Ok(api_success(UserListInvitesResponse {
        invites: get_user_invites(&data.db, user.id).await?,
    }))
}

#[post("/delete", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn user_delete_invite_handler(
    body: web::Json<UserDeleteInviteSchema>,
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    sqlx::query("DELETE FROM user_invites WHERE creator_id = ? AND id = ?")
        .bind(user.id)
        .bind(body.invite_id)
        .execute(&data.db)
        .await?;

    Ok(api_success(UserListInvitesResponse {
        invites: get_user_invites(&data.db, user.id).await?,
    }))
}
