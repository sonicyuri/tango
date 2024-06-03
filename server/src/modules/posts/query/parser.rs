use std::collections::BTreeMap;

use chrono::{NaiveTime, Timelike};
use itertools::Itertools;
use once_cell::sync::Lazy;
use parse_size::parse_size;
use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;

use super::{
    image_conditions::{Operator, Operators, IMAGE_CONDITIONS_MAP},
    query_object::QueryObject,
};

static IMAGE_CONDITION_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^([a-z_]+?)(\=|\>|\<|\<\=|\>\=|\:)([a-z0-9_]+?)(_([a-z0-9_]+?))?$").unwrap()
});

fn default_as_true() -> bool {
    return true;
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContentFilter {
    #[serde(default = "default_as_true")]
    pub images: bool,
    #[serde(default = "default_as_true")]
    pub videos: bool,
    #[serde(default = "default_as_true")]
    pub vr: bool,
}

pub struct ImageQuery {
    pub tag_conditions: Vec<(String, bool)>,
    pub img_conditions: Vec<(QueryObject, bool)>,
    pub offset: i32,
    pub limit: i32,
    pub order: String,
}

impl ImageQuery {
    fn parse_image_condition(
        name: &str,
        op: &str,
        value: &str,
        _param: Option<&str>,
    ) -> Option<QueryObject> {
        let op = match op {
            ">" => Operator::GreaterThan,
            ">=" => Operator::GreaterThanEq,
            "<" => Operator::LessThan,
            "<=" => Operator::LessThanEq,
            _ => Operator::Equals,
        };

        let condition = IMAGE_CONDITIONS_MAP.get(name)?;
        // operators don't match
        if !condition.operators.contains(op) {
            return None;
        }

        let operators: Operators = op.into();

        return (condition.to_query)(&operators.to_str(), value);
    }

    fn parse_order(column: &str, param: &str) -> String {
        // the regex should insure that param and column are both alphanumeric so can't be used for injection, but i don't trust it...
        let param = match param.chars().all(|c| c.is_alphanumeric()) {
            true => param,
            false => "",
        };

        if column == "random" {
            let param = param.parse::<i32>().unwrap_or(0);
            return format!("RAND({})", param);
        }

        let dir = match param {
            "asc" => "ASC",
            _ => "DESC",
        };

        if !column.chars().all(|c| c.is_alphanumeric()) {
            return "images.id DESC".to_owned();
        }

        return format!("images.{} {}", column, dir);
    }

    pub fn new(
        tags: Vec<String>,
        offset: i32,
        limit: i32,
        filter: ContentFilter,
    ) -> Result<ImageQuery, ApiError> {
        let mut tags = tags;
        let mut filter_tags: Vec<String> = Vec::new();

        if !filter.videos {
            filter_tags.push(match filter.vr && !filter.images {
                true => "vr".to_owned(),
                false => "content:image_and_vr".to_owned(),
            });
        }

        if !filter.images {
            filter_tags.push("-content:image".to_owned())
        }

        if !filter.vr {
            filter_tags.push("-vr".to_owned());
        }

        tags.append(&mut filter_tags);

        let mut tags_map: BTreeMap<String, bool> = BTreeMap::new();
        tags.iter().filter(|t| t.len() > 0).for_each(|tag| {
            if tag.starts_with("-") {
                tags_map.insert(tag.chars().skip(1).collect(), false);
            } else {
                tags_map.insert(tag.clone(), true);
            }
        });

        let mut tags_to_remove: Vec<String> = Vec::new();
        let mut order: String = "images.id DESC".to_owned();
        let mut img_conditions: Vec<(QueryObject, bool)> = Vec::new();

        for (tag, positive) in &tags_map {
            let lower = tag.to_lowercase();
            match IMAGE_CONDITION_REGEX.captures(lower.as_str()) {
                Some(captures) => {
                    if captures.len() >= 5 {
                        if &captures[1] == "order" {
                            order = ImageQuery::parse_order(&captures[3], &captures[5]);
                            tags_to_remove.push(tag.clone());
                        } else {
                            let query = ImageQuery::parse_image_condition(
                                &captures[1],
                                &captures[2],
                                &captures[3],
                                captures.get(5).and_then(|o| Some(o.as_str())),
                            );
                            if let Some(query) = query {
                                img_conditions.push((query, *positive));
                                tags_to_remove.push(tag.clone());
                            }
                        }
                    } else if captures.len() >= 3 {
                        let query = ImageQuery::parse_image_condition(
                            &captures[1],
                            &captures[2],
                            &captures[3],
                            None,
                        );

                        if let Some(query) = query {
                            img_conditions.push((query, *positive));
                            tags_to_remove.push(tag.clone());
                        }
                    }
                }
                None => {}
            }
        }

        // remove found image conditions from the map
        for tag in tags_to_remove {
            tags_map.remove_entry(&tag);
        }

        let tag_conditions: Vec<(String, bool)> =
            tags_map.iter().map(|(k, v)| (k.clone(), *v)).collect();

        Ok(ImageQuery {
            tag_conditions,
            img_conditions,
            offset,
            limit,
            order,
        })
    }
}
