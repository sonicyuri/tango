use std::collections::HashMap;
use std::io::{Read, Write};
use std::str;
use std::sync::Arc;

use actix_multipart::Field;
use actix_web::http::header::DispositionType;
use actix_web::{post, web, HttpRequest, HttpResponse};
use futures::{Future, StreamExt, TryStreamExt};
use itertools::Itertools;
use log::error;
use reqwest::StatusCode;
use sqlx::mysql::MySqlQueryResult;
use sqlx::MySqlPool;
use tempfile::NamedTempFile;

use super::media::{create_thumbnail, get_content_info, UploadInfo};
use super::schema::{PoolResponse, PostNewSchema, PostsNewPoolSchema, PostsNewSchema};
use crate::booru_config::BooruConfig;
use crate::error::{api_error_owned, ApiKeyedError};
use crate::modules::posts::new::schema::{PoolModel, PostNewResponse};
use crate::modules::posts::new::upload::{upload_and_create_post, OwnerContext};
use crate::modules::posts::query::alias_resolver::TagAliasResolver;
use crate::modules::users::middleware::get_user;
use crate::storage::AppStorage;
use crate::{
    error::{api_error, api_success, ApiError, ApiErrorType},
    modules::{
        posts::{
            model::{PostModel, PostResponse},
            util::fetch_tags,
        },
        users::middleware::AuthFactory,
    },
    AppState,
};

use super::process::{process_file_upload, process_upload, process_url_upload};

pub fn get_data_field(bytes: &Vec<u8>) -> Result<PostsNewSchema, ApiError> {
    let data_str = str::from_utf8(&bytes).map_err(|e| {
        error!("Failed to decode body data field: {:?}", e);
        api_error(ApiErrorType::InvalidRequest, "Can't decode data field")
    })?;

    Ok(
        serde_json::from_str::<PostsNewSchema>(data_str).map_err(|e| {
            error!("Failed to deserialize body data field: {:?}", e);
            api_error(
                ApiErrorType::InvalidRequest,
                "Failed to deserialize data field",
            )
        })?,
    )
}

#[post("/new", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_new_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    mut body: actix_multipart::Multipart,
) -> Result<HttpResponse, ApiKeyedError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    let ip = req
        .connection_info()
        .realip_remote_addr()
        .ok_or(api_error(
            ApiErrorType::ServerError,
            "Server error obtaining IP",
        ))?
        .to_owned();

    let mut fields: HashMap<String, Vec<u8>> = HashMap::new();

    while let Some(mut field) = body.try_next().await.unwrap_or(None) {
        let mut bytes: Vec<u8> = Vec::new();
        while let Ok(Some(chunk)) = field.try_next().await {
            bytes.append(&mut chunk.to_vec())
        }
        fields.insert(field.name().to_owned(), bytes);
    }

    // obtain json part of multipart upload
    let body_data_field = fields.get_mut("data").ok_or(api_error(
        ApiErrorType::InvalidRequest,
        "Missing 'data' field",
    ))?;

    let body_data = get_data_field(body_data_field)?;
    if body_data.posts.len() > data.booru_config.upload_count as usize {
        return Err(api_error_owned(
            ApiErrorType::InvalidRequest,
            format!(
                "Maximum simultaneous upload count is {}",
                data.booru_config.upload_count
            ),
        )
        .into());
    }

    // check for duplicate filenames
    let duplicate_keys = body_data
        .posts
        .iter()
        .map(|p| p.filename.clone())
        .duplicates()
        .peekable()
        .peek()
        .is_some();
    if duplicate_keys {
        return Err(api_error(ApiErrorType::InvalidRequest, "Duplicate `filename` values").into());
    }

    // validate pool options
    if let Some(pool_options) = &body_data.pool {
        if pool_options.title.len() < 1 {
            return Err(api_error(ApiErrorType::InvalidRequest, "Missing pool title").into());
        }
    }

    let mut next_index = 0;
    let mut post_tags_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut post_pool_index_map: HashMap<String, i32> = HashMap::new();
    for post in &body_data.posts {
        post_tags_map.insert(post.filename.clone(), post.tags.clone());
        if let Some(index) = post.pool_index {
            if index < 0 {
                return Err(
                    api_error(ApiErrorType::InvalidRequest, "pool_index must be >= 0").into(),
                );
            } else if post_pool_index_map.contains_key(&post.filename) {
                return Err(api_error(
                    ApiErrorType::InvalidRequest,
                    "overlapping pool_index values - make sure every entry has a unique pool_index",
                )
                .into());
            }
            post_pool_index_map.insert(post.filename.clone(), index);
        } else {
            post_pool_index_map.insert(post.filename.clone(), next_index);
        }

        next_index += 1;
    }

    let upload_params: Vec<(PostNewSchema, Option<Vec<u8>>)> = body_data
        .posts
        .iter()
        .map(|s| ((*s).clone(), fields.remove(&s.file)))
        .collect();

    let mut futures: Vec<_> = Vec::new();

    for (post, field) in upload_params {
        let future = process_upload(&data.db, data.booru_config.clone(), post, field);
        futures.push(future);
    }

    // get bytes and information on each upload
    let results = futures::future::join_all(futures).await;

    let errors: Vec<(String, String)> = results
        .iter()
        .filter(|f| f.is_err())
        .map(|e| e.as_ref().err().unwrap().clone())
        .collect();

    if errors.len() > 0 {
        return Err(ApiKeyedError {
            messages: HashMap::from_iter(errors),
            error_type: ApiErrorType::OperationFailed,
        });
    }

    let files = results.iter().filter(|f| f.is_ok()).map(
        |f: &Result<(String, UploadInfo, NamedTempFile), (String, String)>| {
            f.as_ref().ok().unwrap()
        },
    );

    let transaction = data.db.begin().await?;

    let mut posts: HashMap<String, PostResponse> = HashMap::new();

    // upload and create each post
    for (filename, info, file) in files {
        let tags = post_tags_map
            .remove(&filename.clone())
            .unwrap_or(Vec::new());
        let owner = OwnerContext {
            owner_id: user.id,
            owner_ip: ip.clone(),
        };

        let (new_filename, post) = upload_and_create_post(
            &data.db,
            tags,
            owner,
            &data.storage,
            data.booru_config.clone(),
            filename.clone(),
            file,
            info,
        )
        .await
        .map_err(|(f, err)| {
            let mut map: HashMap<String, String> = HashMap::new();
            map.insert(f, err);
            ApiKeyedError {
                messages: map,
                error_type: ApiErrorType::OperationFailed,
            }
        })?;

        posts.insert(new_filename, post);
    }

    let mut pool: Option<PoolResponse> = None;

    // create the pool
    if let Some(pool_options) = body_data.pool {
        // create pool itself
        let response: MySqlQueryResult = sqlx::query!(
            r#"INSERT INTO pools (`user_id`, `public`, `title`, `description`, `posts`) VALUES(?, ?, ?, ?, ?)"#,
            user.id,
            !pool_options.private.unwrap_or(false),
            pool_options.title,
            pool_options.description,
            posts.len() as i32
        )
		.execute(&data.db)
		.await?;

        let pool_id = response.last_insert_id();

        // add images
        for (filename, post) in &posts {
            let pool_index = post_pool_index_map.get(filename).unwrap_or(&0);

            sqlx::query!(
                r#"INSERT INTO pool_images (`pool_id`, `image_id`, `image_order`) VALUES(?, ?, ?)"#,
                pool_id,
                post.id,
                pool_index
            )
            .execute(&data.db)
            .await?;
        }

        // record operation in pool history
        sqlx::query!(
            r#"INSERT INTO pool_history (`pool_id`, `user_id`, `action`, `images`, `count`)
			VALUES (?, ?, 1, ?, ?)"#,
            pool_id,
            user.id,
            posts.values().map(|p| p.id).join(" "),
            posts.len() as i32
        )
        .execute(&data.db)
        .await?;

        let pool_model = sqlx::query_as!(PoolModel, "SELECT * FROM pools WHERE id = ?", pool_id)
            .fetch_one(&data.db)
            .await?;

        pool = Some(pool_model.into());
    }

    transaction.commit().await?;

    Ok(api_success(PostNewResponse { posts, pool }))
}
