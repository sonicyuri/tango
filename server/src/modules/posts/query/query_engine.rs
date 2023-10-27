use num::clamp;
use num::traits::clamp_min;
use sqlx::query::QueryAs;
use sqlx::{MySql, MySqlPool};

use crate::util::{format_db_error, ApiError, api_error};

use super::super::model::PostModel;

use super::parser::ImageQuery;
use super::query_object::QueryObject;

pub struct QueryEngine {}

pub struct QueryResult {}

impl QueryEngine {
    pub async fn run<'a, A, B, C>(
        db: &MySqlPool,
        query: ImageQuery,
    ) -> Result<QueryResult, ApiError> {
		Err(api_error(crate::util::ApiErrorType::ServerError, "Not implemented"))
        /*let query_object = QueryEngine::tags_into_query(&query.tag_conditions);

        let limit = clamp(query.limit, 1, 100);
        let offset = clamp_min(query.offset, 0);

        let query_str = format!(
            "{} LIMIT {} OFFSET {}",
            query_object.query.join(" "),
            limit,
            offset
        );

        let mut sql_query: QueryAs<_, PostModel, _> =
            sqlx::query_as::<MySql, PostModel>(query_str.as_str());

        for (_, p) in query_object.parameters.iter().enumerate() {
            sql_query = sql_query.bind(p);
        }

        let posts = sql_query.fetch_all(db).await.map_err(format_db_error)?;*/
    }

    fn tags_into_query(tag_conditions: &Vec<(String, bool)>) -> QueryObject {
        let mut positive_tags: Vec<&String> = Vec::new();
        let mut negative_tags: Vec<&String> = Vec::new();

        tag_conditions.iter().for_each(|(t, p)| {
            if *p {
                positive_tags.push(t);
            } else {
                negative_tags.push(t);
            }
        });

        let mut query_object = QueryObject::new();

        if positive_tags.len() == 0 && negative_tags.len() == 0 {
            query_object.push_query("SELECT i.* FROM images AS i");
            return query_object;
        };

        query_object.push_query(
            "SELECT i.* FROM image_tags AS it
            RIGHT JOIN tags AS t ON it.tag_id = t.id
            LEFT JOIN images AS i ON it.image_id = t.id
            WHERE ",
        );

        let mut num_conditions = 0;
        if positive_tags.len() > 0 {
            query_object.push_query("t.tag IN (");
            query_object.insert_params(positive_tags.iter().map(|t| t.as_str()));
            query_object.push_query(")");
            num_conditions = num_conditions + 1;
        };

        if negative_tags.len() > 0 {
            if num_conditions > 0 {
                query_object.push_query("AND");
            }
            query_object.push_query(
                "i.id NOT IN (
                SELECT it.image_id FROM image_tags AS it
                RIGHT JOIN tags AS t ON it.tag_id = t.id
                WHERE t.tag IN (",
            );
            query_object.insert_params(negative_tags.iter().map(|t| t.as_str()));
            query_object.push_query("))");
            num_conditions = num_conditions + 1;
        };

        query_object.push_query("GROUP BY i.image_id");

        return query_object;
    }
}
