use std::collections::HashMap;

use actix_web::{get, post, web, HttpRequest, HttpResponse};
use chrono::Utc;
use futures::TryStreamExt;

use super::schema::{PostDeleteSchema, PostInfoSchema, PostVoteSchema};
use crate::error::api_error_owned;
use crate::modules::posts::query::model::PostQueryResult;
use crate::modules::posts::schema::PostViewSchema;
use crate::modules::users::middleware::get_user;
use crate::{
    error::{api_error, api_success, ApiError, ApiErrorType},
    modules::{
        posts::model::{PostModel, PostResponse},
        users::middleware::AuthFactory,
    },
    AppState,
};

#[get("/info", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_info_handler(
    data: web::Data<AppState>,
    body: web::Query<PostInfoSchema>,
) -> Result<HttpResponse, ApiError> {
    let result = sqlx::query_as!(PostModel, "SELECT * FROM images WHERE id = ?", body.id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                api_error(ApiErrorType::InvalidRequest, "Couldn't find post")
            }
            e => e.into(),
        })?;

    let response = PostQueryResult::from_model_query(result, &data.db).await?;

    Ok(api_success(response))
}

#[get("/vote", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_list_votes_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let mut result: HashMap<i32, Vec<String>> = HashMap::new();

    let results = sqlx::query_as::<_, (i32, i32)>(
        "SELECT image_id, score FROM numeric_score_votes WHERE user_id = ?",
    )
    .bind(user.id)
    .fetch_all(&data.db)
    .await?;

    for (image_id, score) in results {
        let vec = match result.contains_key(&score) {
            true => result
                .get_mut(&score)
                .ok_or(api_error(ApiErrorType::ServerError, "Failed to map score"))?,
            false => {
                result.insert(score, Vec::new());
                result
                    .get_mut(&score)
                    .ok_or(api_error(ApiErrorType::ServerError, "Failed to map score"))?
            }
        };

        vec.push(image_id.to_string());
    }

    Ok(api_success(result))
}

#[post("/vote", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_vote_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PostVoteSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let mut post: PostModel = sqlx::query_as!(
        PostModel,
        r#"SELECT * FROM images WHERE id = ?"#,
        body.post_id
    )
    .fetch_one(&data.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => api_error(ApiErrorType::InvalidRequest, "Post not found"),
        _ => e.into(),
    })?;

    let previous_vote = sqlx::query_as::<_, (i32,)>(
        r"SELECT score FROM numeric_score_votes WHERE image_id = ? AND user_id = ?",
    )
    .bind(post.id)
    .bind(user.id)
    .fetch_one(&data.db)
    .await
    .ok();

    let new_score = match body.action.as_str() {
        "up" => Ok(1),
        "down" => Ok(-1),
        "clear" => Ok(0),
        _ => Err(api_error_owned(
            ApiErrorType::InvalidRequest,
            format!("Invalid action value {}", body.action),
        )),
    }?;

    let score_change = match previous_vote {
        Some((vote,)) => new_score - vote,
        None => new_score,
    };

    let transaction = data.db.begin().await?;

    if new_score == 0 && previous_vote.is_some() {
        sqlx::query!(
            r#"DELETE FROM numeric_score_votes WHERE image_id = ? AND user_id = ?"#,
            post.id,
            user.id
        )
        .execute(&data.db)
        .await?;
    } else if new_score != 0 && previous_vote.is_some() {
        sqlx::query!(
            r#"UPDATE numeric_score_votes SET score = ? WHERE image_id = ? AND user_id = ?"#,
            new_score,
            post.id,
            user.id
        )
        .execute(&data.db)
        .await?;
    } else if new_score != 0 {
        sqlx::query!(
            r#"INSERT INTO numeric_score_votes (`image_id`, `user_id`, `score`) VALUES (?,?,?)"#,
            post.id,
            user.id,
            new_score
        )
        .execute(&data.db)
        .await?;
    }

    let final_score = match score_change {
        0 => post.numeric_score,
        _ => {
            sqlx::query!(
                r"UPDATE images SET numeric_score = numeric_score + ? WHERE id = ?",
                score_change,
                post.id
            )
            .execute(&data.db)
            .await?;

            let (score,) =
                sqlx::query_as::<_, (i32,)>(r#"SELECT numeric_score FROM images WHERE id = ?"#)
                    .bind(post.id)
                    .fetch_one(&data.db)
                    .await?;
            score
        }
    };

    transaction.commit().await?;

    post.numeric_score = final_score;

    return Ok(api_success(PostResponse::from_model(post, None)));
}

#[post("/delete", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_delete_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PostDeleteSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    // TODO: implement real permissions checking
    if user.class != "admin" {
        return Err(api_error(
            ApiErrorType::Forbidden,
            "Only admin can delete posts",
        ));
    }

    let post = sqlx::query_as!(PostModel, "SELECT * FROM images WHERE id = ?", body.post_id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => api_error(ApiErrorType::InvalidRequest, "Post not found"),
            _ => e.into(),
        })?;

    data.storage
        .delete_file(data.storage.image_path(post.hash.clone()))
        .await?;

    data.storage
        .delete_file(data.storage.thumb_path(post.hash))
        .await?;

    sqlx::query!("DELETE FROM images WHERE id = ?", body.post_id)
        .execute(&data.db)
        .await?;

    Ok(api_success("success"))
}

#[post("/view", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_view_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PostViewSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let conn_info = req.connection_info();
    let ip = conn_info
        .realip_remote_addr()
        .ok_or(api_error(ApiErrorType::ServerError, "Can't get client IP?"))?;

    let timestamp = Utc::now().timestamp() as i32;

    let _result = sqlx::query!(
		"INSERT INTO image_views(`image_id`, `user_id`, `timestamp`, `ipaddress`) VALUES(?, ?, ?, ?)", body.id, user.id, timestamp, ip).execute(&data.db).await?;

    // update view count cached on post column
    sqlx::query!(
        "UPDATE images AS i 
		INNER JOIN (
			SELECT COUNT(id) AS view_count, image_id
			FROM image_views
			GROUP BY image_id
		) iv ON iv.image_id = i.id 
		SET i.views = iv.view_count WHERE i.id = ?",
        body.id
    )
    .execute(&data.db)
    .await?;

    Ok(api_success("success"))
}
