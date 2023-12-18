use std::collections::{HashMap, HashSet};

use actix_web::web::Query;
use itertools::Itertools;
use num::clamp;
use num::traits::clamp_min;
use sqlx::query::QueryAs;
use sqlx::{pool, MySql, MySqlPool};

use super::model::{PostQueryResult, QueryResult};
use crate::error::{api_error, ApiError, ApiErrorType};
use crate::modules::pools::model::{PoolModel, PoolResponse};
use crate::modules::posts::model::PostResponse;

use super::super::model::PostModel;

use super::parser::ImageQuery;
use super::query_object::QueryObject;

pub struct QueryEngine {}

impl QueryEngine {
    pub async fn run(
        db: &MySqlPool,
        query: ImageQuery,
        user_id: i32,
    ) -> Result<QueryResult, ApiError> {
        let query_object = QueryEngine::build_query(
            db,
            &query.tag_conditions,
            &query.img_conditions,
            query.order.clone(),
            Some(query.limit),
            Some(query.offset),
        )
        .await?;

        let query_str = query_object.to_string();
        let mut sql = sqlx::query_as::<_, PostModel>(query_str.as_str());
        for p in query_object.parameters {
            sql = sql.bind(p);
        }

        let results = sql.fetch_all(db).await?;
        let count = QueryEngine::count_images(db, &query).await?;

        let mut safe_results: Vec<PostQueryResult> = Vec::new();
        let mut pool_ids: HashSet<i32> = HashSet::new();

        if results.len() > 0 {
            // find pools and tags for the results in bulk instead of doing two queries per
            let mut post_tags_map: HashMap<i32, Vec<String>> = HashMap::new();
            let mut post_pools_map: HashMap<i32, Vec<i32>> = HashMap::new();
            // initialize maps
            for p in &results {
                post_tags_map.insert(p.id, Vec::new());
                post_pools_map.insert(p.id, Vec::new());
            }

            let post_ids_str = results.iter().map(|p| p.id.to_string()).join(",");

            let tag_query = format!("SELECT it.image_id, t.tag FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE it.image_id IN ({})", post_ids_str);
            let tag_results = sqlx::query_as::<_, (i32, String)>(tag_query.as_str())
                .fetch_all(db)
                .await?;

            for (post_id, tag) in tag_results {
                let v = post_tags_map.get_mut(&post_id);
                if let Some(v) = v {
                    v.push(tag);
                }
            }

            let pool_query = format!(
                "SELECT pi.image_id, pi.pool_id FROM pool_images AS pi LEFT JOIN pools AS p ON p.id = pi.pool_id WHERE pi.image_id IN ({}) AND (p.public = 1 OR p.user_id = ?)",
                post_ids_str
            );
            let pool_results = sqlx::query_as::<_, (i32, i32)>(pool_query.as_str())
                .bind(user_id)
                .fetch_all(db)
                .await?;

            for (post_id, pool_id) in pool_results {
                let v = post_pools_map.get_mut(&post_id);
                if let Some(v) = v {
                    v.push(pool_id);
                    pool_ids.insert(pool_id);
                }
            }

            for post in results {
                let tags = post_tags_map.remove(&post.id).unwrap_or(Vec::new());
                let pools = post_pools_map.remove(&post.id).unwrap_or(Vec::new());
                safe_results.push(PostQueryResult::from_model(post, tags, pools)?);
            }
        }

        let mut pools: Vec<PoolResponse> = Vec::new();

        // fetch information for all the pools we referenced to include them in the results
        if pool_ids.len() > 0 {
            // we look up pools in bulk so we need to store the different parts separately
            let mut pools_map: HashMap<i32, PoolModel> = HashMap::new();

            let pool_ids_str = pool_ids.iter().map(|id| id.to_string()).join(",");
            let pool_info_query = format!("SELECT * FROM pools WHERE id IN ({})", pool_ids_str);

            let pool_info_results = sqlx::query_as::<_, PoolModel>(pool_info_query.as_str())
                .fetch_all(db)
                .await?;

            for pool_info in pool_info_results {
                pools.push(PoolResponse {
                    id: pool_info.id,
                    owner_id: pool_info.user_id,
                    public: pool_info.public == 1,
                    title: pool_info.title,
                    description: pool_info.description,
                    date: pool_info.date,
                    posts: None,
                });
            }
        }

        Ok(QueryResult {
            posts: safe_results,
            pools,
            offset: query.offset,
            total_results: count,
        })
    }

    async fn count_images(db: &MySqlPool, image_query: &ImageQuery) -> Result<i32, ApiError> {
        let query_object = QueryEngine::build_query(
            db,
            &image_query.tag_conditions,
            &image_query.img_conditions,
            image_query.order.clone(),
            None,
            None,
        )
        .await?;

        let query_str = format!(
            "SELECT COUNT(*) AS c FROM ({}) AS tbl",
            query_object.to_string()
        );

        let mut query = sqlx::query_as::<_, (i32,)>(query_str.as_str());
        for p in &query_object.parameters {
            query = query.bind(p);
        }

        let (count,) = query.fetch_one(db).await?;
        Ok(count)
    }

    async fn resolve_tag_to_ids(db: &MySqlPool, tag: String) -> Result<Vec<i32>, ApiError> {
        let result = sqlx::query_as::<_, (i32, String)>(
            r"SELECT id, tag FROM tags WHERE LOWER(tag) LIKE LOWER(?)",
        )
        .bind(tag)
        .fetch_all(db)
        .await?;

        let vec = result.iter().map(|(id, _)| *id).collect_vec();

        Ok(vec)
    }

    async fn build_query(
        db: &MySqlPool,
        tag_conditions: &Vec<(String, bool)>,
        img_conditions: &Vec<(QueryObject, bool)>,
        order: String,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Result<QueryObject, ApiError> {
        // adapted from https://github.com/shish/shimmie2/blob/main/core/imageboard/search.php#L222

        let mut limit = limit;
        let mut offset = offset;
        let mut query: Option<QueryObject> = None;

        if tag_conditions.len() == 0 && img_conditions.len() == 0 {
            // nothing to do
            query = Some(QueryObject::new_with_query(
                "SELECT images.* FROM images WHERE 1=1",
            ));
        } else if tag_conditions.len() == 1
            && tag_conditions[0].1
            && img_conditions.len() == 0
            && order == "images.id DESC"
            && limit.is_some()
            && offset.is_some()
        {
            // optimization for single-tag queries

            let (tag, positive) = &tag_conditions[0];
            let tag_ids = QueryEngine::resolve_tag_to_ids(db, (*tag).clone()).await?;

            if tag_ids.len() == 0 {
                // nothing found
                return Ok(QueryObject::new_with_query(
                    "SELECT images.* FROM images WHERE 1=0",
                ));
            }

            let tag_ids_str: String = tag_ids.iter().map(|id| id.to_string()).join(",");

            let query_str = format!(
                "SELECT images.*
				FROM images INNER JOIN (
					SELECT DISTINCT it.image_id
					FROM image_tags it
					WHERE it.tag_id IN ({})
					ORDER BY it.image_id DESC
					LIMIT {} OFFSET {}
				) a on a.image_id = images.id
				WHERE 1=1",
                tag_ids_str,
                limit.unwrap(),
                offset.unwrap()
            );

            query = Some(QueryObject::new_with_query(query_str.as_str()));
            // we no longer need limit and offset since we've already done that in the above query
            limit = None;
            offset = None;
        } else {
            // no faster optimization, do the full search

            let mut positive_tag_ids: Vec<i32> = Vec::new();
            let mut positive_wildcard_tag_ids: Vec<Vec<i32>> = Vec::new();
            let mut negative_tag_ids: Vec<i32> = Vec::new();
            // is this query all negatives of tags that don't exist?
            let mut all_nonexistant_negatives = true;

            for (tag, positive) in tag_conditions {
                let mut tag_ids = QueryEngine::resolve_tag_to_ids(db, (*tag).clone()).await?;

                if *positive {
                    all_nonexistant_negatives = false;

                    if tag_ids.len() == 0 {
                        // nothing found for this positive tag, so no results
                        return Ok(QueryObject::new_with_query(
                            "SELECT images.* FROM images WHERE 1=0",
                        ));
                    } else if tag_ids.len() == 1 {
                        positive_tag_ids.push(tag_ids[0]);
                    } else {
                        positive_wildcard_tag_ids.push(tag_ids);
                    }
                } else {
                    if tag_ids.len() > 0 {
                        all_nonexistant_negatives = false;
                        negative_tag_ids.append(&mut tag_ids);
                    }
                }
            }

            if all_nonexistant_negatives {
                // we're only excluding non-existant tags, so we can just return everything
                query = Some(QueryObject::new_with_query(
                    "SELECT images.* FROM images WHERE 1=1",
                ));
            } else if positive_tag_ids.len() > 0 || positive_wildcard_tag_ids.len() > 0 {
                let mut inner_joins: Vec<String> = Vec::new();

                for tag_id in positive_tag_ids {
                    inner_joins.push(format!("= {}", tag_id));
                }

                for tag_ids in positive_wildcard_tag_ids {
                    let tag_ids_str = tag_ids.iter().map(|id| id.to_string()).join(",");

                    inner_joins.push(format!("IN({})", tag_ids_str));
                }

                let first = (*inner_joins.first().unwrap()).clone();

                let mut sq =
                    QueryObject::new_with_query("SELECT DISTINCT it.image_id FROM image_tags it");

                let mut i = 0;
                for inner_join in inner_joins {
                    i += 1;
                    let part = format!("INNER JOIN image_tags it{i} ON it{i}.image_id = it.image_id AND it{i}.tag_id {inner_join}", i=i, inner_join=inner_join);
                    sq.push_query(part.as_str());
                }

                if negative_tag_ids.len() > 0 {
                    let negative_tag_str =
                        negative_tag_ids.iter().map(|id| id.to_string()).join(",");
                    let part = format!("LEFT JOIN image_tags negative ON negative.image_id = it.image_id AND negative.tag_id IN ({})", negative_tag_str);
                    sq.push_query(part.as_str());
                }

                sq.push_query(format!("WHERE it.tag_id {}", first).as_str());
                if negative_tag_ids.len() > 0 {
                    sq.push_query("AND negative.image_id IS NULL");
                }
                sq.push_query("GROUP BY it.image_id");

                let query_str = format!(
                    "SELECT images.*
					FROM images
					INNER JOIN ({}) a on a.image_id = images.id",
                    sq.to_string()
                );

                query = Some(QueryObject::new_with_query(query_str.as_str()));
            } else if negative_tag_ids.len() > 0 {
                let negative_tag_str = negative_tag_ids.iter().map(|id| id.to_string()).join(",");
                let query_str = format!(
                    "SELECT images.*
					FROM images
					LEFT JOIN image_tags negative ON negative.image_id = images.id AND negative.tag_id in ({})
					WHERE negative.image_id IS NULL",
                    negative_tag_str
                );
                query = Some(QueryObject::new_with_query(query_str.as_str()));
            } else {
                return Err(api_error(
                    ApiErrorType::ServerError,
                    "Can't create tag query - no valid strategies",
                ));
            }
        }

        if query.is_none() {
            return Err(api_error(
                ApiErrorType::ServerError,
                "Missing query object?",
            ));
        }

        let mut query = query.unwrap();

        if img_conditions.len() > 0 {
            let mut conditions_query = QueryObject::new();
            let mut n = 0;
            for (condition, positive) in img_conditions {
                if n > 0 {
                    conditions_query.push_query("AND");
                }
                n += 1;
                if !positive {
                    conditions_query.push_query("NOT");
                }
                conditions_query.push_query("(");
                conditions_query.append(condition);
                conditions_query.push_query(")");
            }

            query.push_query("AND");
            query.append(&conditions_query);
        }

        query.push_query(format!("ORDER BY {}", order).as_str());

        if let Some(limit_val) = limit {
            let offset_val = offset.unwrap_or(0);
            query.push_query(format!("LIMIT {}", limit_val).as_str());
            query.push_query(format!("OFFSET {}", offset_val).as_str());
        }

        return Ok(query);
    }
}
