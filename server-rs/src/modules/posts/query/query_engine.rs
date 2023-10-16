use sqlx::MySqlPool;

use super::super::model::PostModel;

use super::parser::ImageQuery;
use super::query_object::QueryObject;

pub struct QueryEngine {}

pub struct QueryResult {}

impl QueryEngine {
    pub fn run(db: MySqlPool, query: ImageQuery) -> QueryResult {}

    fn create_query<'a, A, B, C>(query: ImageQuery) {
        let query_object = QueryEngine::tags_into_query(&query.tag_conditions);
    }

    fn tags_into_query(tag_conditions: &Vec<(String, bool)>) -> QueryObject {
        let mut positive_tags: Vec<&String> = Vec::new();
        let mut negative_tags: Vec<&String> = Vec::new();

        tag_conditions.iter().for_each(|(t, p)| {
            if p {
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
