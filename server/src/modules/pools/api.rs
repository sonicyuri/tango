use crate::modules::pools::model::{PoolListResponse, PoolPostIdsResponse, PoolResponse};
use crate::modules::pools::schema::{PoolEditSchema, PoolListSchema};
use crate::modules::posts::model::PostModel;
use crate::modules::posts::query::model::PostQueryResult;
use crate::modules::users::middleware::get_user;
use crate::{
    error::{api_error, ApiErrorType},
    modules::{pools::model::PoolModel, users::middleware::AuthFactory},
};
use actix_web::{get, post, web, HttpRequest, HttpResponse};

use crate::{
    error::{api_success, ApiError},
    AppState,
};

use super::schema::{PoolInfoSchema, PoolPostSchema};

#[get("/info", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn pool_info_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Query<PoolInfoSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let result = sqlx::query_as!(PoolModel, "SELECT pools.*, (SELECT images.hash FROM images INNER JOIN pool_images ON pool_images.image_id = images.id 
			WHERE pool_images.pool_id = pools.id ORDER BY pool_images.image_order ASC LIMIT 1) 
			AS cover FROM pools WHERE id = ? AND (public = 1 OR user_id = ?)", body.id, user.id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                api_error(ApiErrorType::InvalidRequest, "Couldn't find pool")
            }
            e => e.into(),
        })?;

    let pool_posts_result = sqlx::query_as::<_, (i32,)>(
        "SELECT image_id FROM pool_images WHERE pool_id = ? ORDER BY image_order ASC",
    )
    .bind(result.id)
    .fetch_all(&data.db)
    .await?;

    let mut posts = Vec::with_capacity(pool_posts_result.len());

    for (image_id,) in pool_posts_result {
        let post_result = sqlx::query_as!(PostModel, "SELECT * FROM images WHERE id = ?", image_id)
            .fetch_one(&data.db)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => {
                    api_error(ApiErrorType::InvalidRequest, "Couldn't find post")
                }
                e => e.into(),
            })?;

        let post = PostQueryResult::from_model_query(post_result, &data.db).await?;
        posts.push(post);
    }

    let pool_info = PoolResponse {
        id: result.id,
        owner_id: result.user_id,
        public: result.public == 1,
        title: result.title,
        description: result.description,
        date: result.date,
        posts: Some(posts),
        cover: result.cover,
    };

    Ok(api_success(pool_info))
}

#[get("/list", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn pool_list_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Query<PoolListSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let limit = body.limit.clamp(1, 100);
    let result = sqlx::query_as!(
        PoolModel,
        r#"
			SELECT pools.*, 
			(SELECT images.hash FROM images INNER JOIN pool_images ON pool_images.image_id = images.id 
			WHERE pool_images.pool_id = pools.id ORDER BY pool_images.image_order ASC LIMIT 1) 
			AS cover FROM pools WHERE public = 1 OR user_id = ? LIMIT ? OFFSET ?"#,
        user.id,
        limit,
        body.offset
    )
    .fetch_all(&data.db)
    .await?;

    let (count,) = sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM pools")
        .fetch_one(&data.db)
        .await?;

    Ok(api_success(PoolListResponse {
        pools: result,
        count,
    }))
}

#[post("/post", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn pool_post_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PoolPostSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let pool_id = match body.0 {
        PoolPostSchema::Add { pool_id, .. } => pool_id,
        PoolPostSchema::Remove { pool_id, .. } => pool_id,
        PoolPostSchema::Reorder { pool_id, .. } => pool_id,
    };

    let post_id = match body.0 {
        PoolPostSchema::Add { post_id, .. } => post_id,
        PoolPostSchema::Remove { post_id, .. } => post_id,
        PoolPostSchema::Reorder { post_id, .. } => post_id,
    };

    // make sure pool and image exist before doing anything to it
    let (owner_id,) = sqlx::query_as::<_, (i32,)>("SELECT user_id FROM pools WHERE id = ?")
        .bind(pool_id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                api_error(ApiErrorType::InvalidRequest, "Couldn't find pool")
            }
            e => e.into(),
        })?;

    if user.class != "admin" && user.id != owner_id {
        return Err(api_error(
            ApiErrorType::Forbidden,
            "Can't perform operations on other people's pools",
        ));
    }

    if sqlx::query_as::<_, (i32,)>("SELECT COUNT(*) FROM images WHERE id = ?")
        .bind(post_id)
        .fetch_one(&data.db)
        .await?
        < (1,)
    {
        return Err(api_error(
            ApiErrorType::InvalidRequest,
            "Couldn't find post",
        ));
    }

    let mut pool_posts_result = sqlx::query_as::<_, (i32, i32)>(
        "SELECT image_id, image_order FROM pool_images WHERE pool_id = ? ORDER BY image_order ASC",
    )
    .bind(pool_id)
    .fetch_all(&data.db)
    .await?;

    match body.0 {
        PoolPostSchema::Add { new_order, .. } | PoolPostSchema::Reorder { new_order, .. } => {
            for (image_id, image_order) in pool_posts_result.iter_mut() {
                if *image_order >= new_order {
                    *image_order += 1;
                    sqlx::query!(
                        r#"UPDATE pool_images SET image_order = ? WHERE image_id = ?"#,
                        *image_order,
                        *image_id
                    )
                    .execute(&data.db)
                    .await?;
                }
            }
        }
        _ => {}
    }

    for (i, (id, _order)) in pool_posts_result.iter().enumerate() {
        if *id == post_id {
            pool_posts_result.remove(i);
            break;
        }
    }

    match body.0 {
        PoolPostSchema::Add { new_order, .. } => {
            sqlx::query!(
                r#"INSERT INTO pool_images VALUES(?, ?, ?)"#,
                pool_id,
                post_id,
                new_order
            )
            .execute(&data.db)
            .await?;
            pool_posts_result.push((post_id, new_order));
            sqlx::query!(
                "UPDATE pools SET posts = ? WHERE id = ?",
                pool_posts_result.len() as i32,
                pool_id
            )
            .execute(&data.db)
            .await?;
            sqlx::query!(
                r#"INSERT INTO pool_history (`pool_id`, `user_id`, `action`, `images`, `count`)
				VALUES (?, ?, 1, ?, ?)"#,
                pool_id,
                user.id,
                post_id.to_string(),
                pool_posts_result.len() as i32
            )
            .execute(&data.db)
            .await?;
        }
        PoolPostSchema::Remove { .. } => {
            sqlx::query!("DELETE FROM pool_images WHERE image_id = ?", post_id)
                .execute(&data.db)
                .await?;
            sqlx::query!(
                "UPDATE pools SET posts = ? WHERE id = ?",
                pool_posts_result.len() as i32,
                pool_id
            )
            .execute(&data.db)
            .await?;
            sqlx::query!(
                r#"INSERT INTO pool_history (`pool_id`, `user_id`, `action`, `images`, `count`)
			VALUES (?, ?, 2, ?, ?)"#,
                pool_id,
                user.id,
                post_id.to_string(),
                pool_posts_result.len() as i32
            )
            .execute(&data.db)
            .await?;
        }
        PoolPostSchema::Reorder { new_order, .. } => {
            sqlx::query!(
                "UPDATE pool_images SET image_order = ? WHERE image_id = ?",
                new_order,
                post_id
            )
            .execute(&data.db)
            .await?;
            pool_posts_result.push((post_id, new_order));
            sqlx::query!(
                r#"INSERT INTO pool_history (`pool_id`, `user_id`, `action`, `images`, `count`)
				VALUES (?, ?, 3, ?, ?)"#,
                pool_id,
                user.id,
                post_id.to_string(),
                pool_posts_result.len() as i32
            )
            .execute(&data.db)
            .await?;
        }
    }

    pool_posts_result.sort_by(|a, b| a.1.cmp(&b.1));

    Ok(api_success(PoolPostIdsResponse {
        post_ids: pool_posts_result.iter().map(|(id, _order)| *id).collect(),
    }))
}

#[post("/edit", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn pool_edit_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PoolEditSchema>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let mut pool = sqlx::query_as!(PoolModel, "SELECT pools.*, (SELECT images.hash FROM images INNER JOIN pool_images ON pool_images.image_id = images.id 
			WHERE pool_images.pool_id = pools.id ORDER BY pool_images.image_order ASC LIMIT 1) 
			AS cover FROM pools WHERE id = ?", body.id)
        .fetch_one(&data.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                api_error(ApiErrorType::InvalidRequest, "Couldn't find pool")
            }
            e => e.into(),
        })?;

    if user.class != "admin" && user.id != pool.user_id {
        return Err(api_error(
            ApiErrorType::Forbidden,
            "Can't edit other people's pools",
        ));
    }

    let mut update_clauses = Vec::new();
    let mut update_clause_parameters = Vec::new();

    if let Some(title) = &body.title {
        update_clauses.push("title = ?".to_string());
        update_clause_parameters.push(title.to_string());
        pool.title = title.to_string();
    }

    if let Some(description) = &body.description {
        if description.is_empty() {
            update_clauses.push("description = NULL".to_string());
            pool.description = None;
        } else {
            update_clauses.push("description = ?".to_string());
            update_clause_parameters.push(description.to_string());
            pool.description = Some(description.to_string());
        }
    }

    if let Some(public) = body.public {
        update_clauses.push("public = ?".to_string());
        update_clause_parameters.push(match public {
            true => "1".to_string(),
            false => "0".to_string(),
        });
        pool.public = match public {
            true => 1,
            false => 0,
        };
    }

    if !update_clauses.is_empty() {
        let query_str = format!(
            "UPDATE pools SET {} WHERE id = ?",
            update_clauses.join(", ")
        );

        let mut query_obj = sqlx::query(&query_str);
        for param in update_clause_parameters {
            query_obj = query_obj.bind(param);
        }

        query_obj.bind(pool.id).execute(&data.db).await?;
    }

    Ok(api_success(pool))
}
