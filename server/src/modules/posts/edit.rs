use std::collections::HashMap;

use actix_web::{post, web, HttpRequest, HttpResponse};
use itertools::Itertools;
use sqlx::MySqlPool;

use super::query::alias_resolver::TagAliasResolver;
use super::schema::PostEditSchema;

use crate::modules::users::middleware::get_user;

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

pub async fn set_post_tags(
    db: &MySqlPool,
    user_id: i32,
    post_id: String,
    tags: Vec<String>,
) -> Result<PostResponse, ApiError> {
    let previous_post = sqlx::query_as!(
        PostModel,
        r#"SELECT * FROM images WHERE id = ?"#,
        post_id.clone()
    )
    .fetch_one(db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => api_error(ApiErrorType::InvalidRequest, "Post not found"),
        _ => e.into(),
    })?;

    let previous_tags: Vec<(String, i32)> = sqlx::query!(
        r#"SELECT t.tag, t.count FROM image_tags AS it 
		JOIN tags AS t ON t.id = it.tag_id WHERE it.image_id = ?"#,
        post_id
    )
    .fetch_all(db)
    .await?
    .iter()
    .map(|e| (e.tag.to_owned(), e.count))
    .collect();

    // accumulate tag counts
    let mut tag_counts: HashMap<String, i32> = HashMap::new();
    previous_tags.iter().for_each(|(tag, count)| {
        tag_counts.insert(tag.clone(), *count);
    });

    let new_tags: Vec<String> = tags
        .iter()
        .map(|t| t.trim())
        .filter(|t| t.len() > 0)
        .map(|t| t.to_owned())
        .collect();

    let resolver = TagAliasResolver::new(db).await?;
    let final_tags = resolver.resolve(&new_tags);
    let mut final_tag_objs = fetch_tags(db, &final_tags).await?;
    final_tag_objs.iter().for_each(|t| {
        tag_counts.insert(t.tag.clone(), t.count);
    });

    let missing_tags: Vec<&String> = final_tags
        .iter()
        .filter(|t| !tag_counts.contains_key(*t))
        .collect();

    // we have tags we need to insert
    if missing_tags.len() > 0 {
        let insert_query_str: String = format!(
            "INSERT INTO tags (`tag`, `count`) VALUES {}",
            itertools::Itertools::intersperse(
                missing_tags.iter().map(|_t| { "(?, 0)".to_owned() }),
                ", ".to_owned()
            )
            .collect::<String>()
        );

        let mut insert_query = sqlx::query(&insert_query_str);
        for (_, t) in missing_tags.iter().enumerate() {
            insert_query = insert_query.bind(t);
        }

        insert_query.execute(db).await?;

        // obtain the tag objects for the new tags we've inserted
        let mut missing_tag_objs =
            fetch_tags(db, &missing_tags.iter().map(|t| (*t).clone()).collect()).await?;

        missing_tag_objs.iter().for_each(|t| {
            tag_counts.insert(t.tag.clone(), t.count);
        });

        final_tag_objs.append(&mut missing_tag_objs);
    }

    // delete previous tags
    sqlx::query!("DELETE FROM image_tags WHERE image_id = ?", post_id.clone())
        .execute(db)
        .await?;

    if final_tags.len() > 0 {
        // perform the actual tag edit
        let query = format!(
            "INSERT INTO image_tags (`image_id`, `tag_id`) VALUES {};",
            itertools::Itertools::intersperse(
                final_tag_objs
                    .iter()
                    .map(|t| format!("({}, {})", post_id, t.id)),
                ",".to_owned()
            )
            .collect::<String>()
        );

        sqlx::query(query.as_str()).execute(db).await?;
    }

    // edit tag counts

    // use INSERT ON DUPLICATE to update multiple at once
    if tag_counts.len() > 0 {
        // subtract old tags
        previous_tags
            .iter()
            .for_each(|(tag, _count)| match tag_counts.get_mut(tag) {
                Some(count) => {
                    *count = *count - 1;
                }
                None => {}
            });

        // add new tags
        final_tags
            .iter()
            .for_each(|tag| match tag_counts.get_mut(tag) {
                Some(count) => {
                    *count = *count + 1;
                }
                None => {}
            });

        let tag_update_query_str = format!(
            "INSERT INTO tags (`tag`, `count`) VALUES {} 
			ON DUPLICATE KEY UPDATE count = VALUES(count)",
            tag_counts.iter().map(|(_, _)| { "(?, ?)" }).join(",")
        );

        // update tags
        let mut tag_update_query = sqlx::query(tag_update_query_str.as_str());

        for (_, (tag, count)) in tag_counts.iter().enumerate() {
            tag_update_query = tag_update_query.bind(tag);
            tag_update_query = tag_update_query.bind(count);
        }

        tag_update_query.execute(db).await?;

        let tag_user_freq_query_str = format!(
			"INSERT INTO tag_user_frequencies(`user_id`, `tag`, `num`) VALUES {} ON DUPLICATE KEY UPDATE num = num + 1", 
			tag_counts.iter().map(|(_, _)| { "(?, ?, 1)"}).join(","));

        let mut tag_freq_query = sqlx::query(tag_user_freq_query_str.as_str());

        for (_, (tag, _count)) in tag_counts.iter().enumerate() {
            tag_freq_query = tag_freq_query.bind(user_id);
            tag_freq_query = tag_freq_query.bind(tag);
        }

        tag_freq_query.execute(db).await?;
    }

    let response = PostResponse::from_model(previous_post, Some(final_tags));

    Ok(response)
}

#[post("/edit", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_edit_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<PostEditSchema>,
) -> Result<HttpResponse, ApiError> {
    let user = get_user(&req).ok_or(api_error(ApiErrorType::InvalidRequest, "missing user"))?;
    let transaction = data.db.begin().await?;
    let response =
        set_post_tags(&data.db, user.id, body.post_id.clone(), body.tags.clone()).await?;
    transaction.commit().await?;

    Ok(api_success(response))
}
