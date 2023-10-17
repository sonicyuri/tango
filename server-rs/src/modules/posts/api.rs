use std::collections::HashMap;

use actix_web::{post, web, HttpResponse};
use itertools::Itertools;

use super::query::alias_resolver::TagAliasResolver;
use super::schema::PostEditSchema;
use crate::{
    modules::{
        posts::{
            model::{PostModel, PostResponse},
            util::fetch_tags,
        },
        users::middleware::AuthFactory,
    },
    util::{api_error, api_success, format_db_error, ApiError, ApiErrorType},
    AppState,
};

#[post("/edit", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn post_edit_handler(
    data: web::Data<AppState>,
    body: web::Json<PostEditSchema>,
) -> Result<HttpResponse, ApiError> {
    let previous_post = sqlx::query_as!(
        PostModel,
        r#"SELECT * FROM images WHERE id = ?"#,
        body.post_id
    )
    .fetch_one(&data.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => api_error(ApiErrorType::InvalidRequest, "Post not found"),
        _ => format_db_error(e),
    })?;

    let previous_tags: Vec<(String, i32)> = sqlx::query!(
        r#"SELECT t.tag, t.count FROM image_tags AS it 
		JOIN tags AS t ON t.id = it.tag_id WHERE it.image_id = ?"#,
        body.post_id
    )
    .fetch_all(&data.db)
    .await
    .map_err(format_db_error)?
    .iter()
    .map(|e| (e.tag.to_owned(), e.count))
    .collect();

    let transaction = data.db.begin().await.map_err(format_db_error)?;

    // accumulate tag counts
    let mut tag_counts: HashMap<String, i32> = HashMap::new();
    previous_tags.iter().for_each(|(tag, count)| {
        tag_counts.insert(tag.clone(), *count);
    });

    let new_tags: Vec<String> = body
        .tags
        .iter()
        .map(|t| t.trim())
        .filter(|t| t.len() > 0)
        .map(|t| t.to_owned())
        .collect();

    let final_tags = TagAliasResolver::resolve(&data.db, &new_tags).await?;
    let mut final_tag_objs = fetch_tags(&data.db, &final_tags).await?;
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
                missing_tags.iter().map(|t| { "(?, 0)".to_owned() }),
                ", ".to_owned()
            )
            .collect::<String>()
        );

        let mut insert_query = sqlx::query(&insert_query_str);
        for (_, t) in missing_tags.iter().enumerate() {
            insert_query = insert_query.bind(t);
        }

        insert_query
            .execute(&data.db)
            .await
            .map_err(format_db_error)?;

        // obtain the tag objects for the new tags we've inserted
        let mut missing_tag_objs = fetch_tags(
            &data.db,
            &missing_tags.iter().map(|t| (*t).clone()).collect(),
        )
        .await?;

        missing_tag_objs.iter().for_each(|t| {
            tag_counts.insert(t.tag.clone(), t.count);
        });

        final_tag_objs.append(&mut missing_tag_objs);
    }

    // delete previous tags
    sqlx::query!("DELETE FROM image_tags WHERE image_id = ?", body.post_id)
        .execute(&data.db)
        .await
        .map_err(format_db_error)?;

    if final_tags.len() > 0 {
        // perform the actual tag edit
        let query = format!(
            "INSERT INTO image_tags (`image_id`, `tag_id`) VALUES {};",
            itertools::Itertools::intersperse(
                final_tag_objs
                    .iter()
                    .map(|t| format!("({}, {})", body.post_id, t.id)),
                ",".to_owned()
            )
            .collect::<String>()
        );

        sqlx::query(query.as_str())
            .execute(&data.db)
            .await
            .map_err(format_db_error)?;
    }

    // edit tag counts

    // use INSERT ON DUPLICATE to update multiple at once
    if tag_counts.len() > 0 {
        // subtract old tags
        previous_tags
            .iter()
            .for_each(|(tag, count)| match tag_counts.get_mut(tag) {
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

        tag_update_query
            .execute(&data.db)
            .await
            .map_err(format_db_error)?;
    }

    let response = PostResponse::from_model(previous_post, final_tags);

    transaction.commit().await.map_err(format_db_error)?;

    Ok(api_success(response))
}
