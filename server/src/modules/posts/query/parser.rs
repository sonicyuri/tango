use std::collections::BTreeMap;

use chrono::{NaiveTime, Timelike};
use itertools::Itertools;
use once_cell::sync::Lazy;
use parse_size::parse_size;
use regex::Regex;
use serde::{Deserialize, Serialize	};

use crate::error::ApiError;

use super::query_object::QueryObject;

static IMAGE_CONDITION_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^([a-z_]+?)(\=|\>|\<|\<\=|\>\=|\:)([a-z0-9_]+?)(_([a-z0-9_]+?))?$").unwrap()
});

fn default_as_true() -> bool { return true; }

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContentFilter {
	#[serde(default = "default_as_true")]
	pub images: bool,
	#[serde(default = "default_as_true")]
	pub videos: bool,
	#[serde(default = "default_as_true")]
	pub vr: bool
}

pub struct ImageQuery {
    pub tag_conditions: Vec<(String, bool)>,
    pub img_conditions: Vec<(QueryObject, bool)>,
    pub offset: i32,
    pub limit: i32,
	pub order: String
}

impl ImageQuery {
    fn parse_image_condition(
        name: &str,
        op: &str,
        value: &str,
        param: Option<&str>,
    ) -> Option<QueryObject> {
        let op = match op {
            ":" => "=",
            v => v,
        };

        match name {
            "id" => Some(QueryObject::new_with_param(
                format!("images.id {} ?", op).as_str(),
                value,
            )),
            "width" => Some(QueryObject::new_with_param(
                format!("images.width {} ?", op).as_str(),
                value,
            )),
            "height" => Some(QueryObject::new_with_param(
                format!("images.height {} ?", op).as_str(),
                value,
            )),
			"ratio" => {
				let parts: Vec<i32> = value.split(":").filter_map(|f| f.parse().ok()).collect_vec();
				match parts.len() {
					2 => {
						let aspect_ratio = (parts[0] as f32) / (parts[1] as f32);
						Some(QueryObject::new_with_param(format!("ROUND(images.width / images.height, 2) {} ROUND(?, 2)", op).as_str(), aspect_ratio))
					},
					_ => None
				}
			},
			"size" => {
				let parts: Vec<i32> = value.split("x").filter_map(|f| f.parse().ok()).collect_vec();
				match parts.len() {
					2 => {
						Some(QueryObject::new_with_query(format!("images.width {} {} AND images.height {} {}", op, parts[0], op, parts[1]).as_str()))
					},
					_ => None
				}
			},
			"filesize" => {
				match parse_size(value) {
					Ok(size) => {
						Some(QueryObject::new_with_param(format!("images.filesize {} ?", op).as_str(), size))
					},
					Err(err) => None
				}
			},
			"posted" => Some(QueryObject::new_with_param(format!("images.posted {} ?", op).as_str(), value)),
			"length" => {
				let time_ms: u32 = match value.parse().ok() {
					Some(time) => time,
					None => {
						let time = 
							NaiveTime::parse_from_str(value, "%hh%mm%ss")
							.or(NaiveTime::parse_from_str(value, "%mm%ss"))
							.or(NaiveTime::parse_from_str(value, "%ss"));
						match time {
							Ok(nt) => {
								nt.num_seconds_from_midnight()
							},
							Err(_) => 0
						}
					}
				};

				Some(QueryObject::new_with_param(format!("images.length {} ?", op).as_str(), time_ms))
			},
            "score" => Some(QueryObject::new_with_param(
                format!("images.numeric_score {} ?", op).as_str(),
                value,
            )),
            "source" => match op == "=" {
                true => match value {
                    "any" => Some(QueryObject::new_with_query("images.source IS NOT NULL")),
                    "none" => Some(QueryObject::new_with_query("images.source IS NULL")),
                    v => Some(QueryObject::new_with_param("images.source", v)),
                },
                false => None,
            },
            "hash" => match op == "=" {
                true => Some(QueryObject::new_with_param("images.hash = ?", value)),
                false => None,
            },
            "filename" => match op == "=" {
                true => Some(QueryObject::new_with_param("images.filename = ?", value)),
                false => None,
            },
            "mime" => match op == "=" {
                true => Some(QueryObject::new_with_param("images.mime = ?", value)),
                false => None,
            },
            "ext" => match op == "=" {
                true => Some(QueryObject::new_with_param("images.ext = ?", value)),
                false => None,
            },
            "content" => match op == "=" {
                true => match value {
                    "audio" => Some(QueryObject::new_with_query(
                        "images.audio = 1 OR images.video = 1",
                    )),
                    "video" => Some(QueryObject::new_with_query("images.video = 1")),
                    "image" => Some(QueryObject::new_with_query("images.image = 1")),
					"vr" => Some(QueryObject::new_with_query("images.id IN (SELECT image_id FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE t.tag = 'vr')")),
					// hack since there's no other way to get this combination using other queries
					"image_and_vr" => Some(QueryObject::new_with_query("(images.image = 1 OR images.id IN (SELECT image_id FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE t.tag = 'vr'))")),
                    _ => None,
                },
                false => None,
            },
			"tags" => Some(QueryObject::new_with_param(format!("(SELECT COUNT(*) AS c FROM image_tags WHERE image_id = images.id) {} ?", op).as_str(), value)),
			"comments" => Some(QueryObject::new_with_param(format!("(SELECT COUNT(*) AS c FROM comments WHERE image_id = images.id) {} ?", op).as_str(), value)),
			"commented_by" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM comments AS c LEFT JOIN users AS u ON c.owner_id = u.id WHERE c.image_id = images.id AND u.name = ?) > 0", value)), false => None },
			"commented_by_userno" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM comments AS c WHERE c.image_id = images.id AND c.owner_id = ?) > 0", value)), false => None },
			"poster" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM users AS u WHERE u.id = images.owner_id AND u.name = ?) > 0", value)), false => None },
			"poster_id" => match op == "=" { true => Some(QueryObject::new_with_param("images.owner_id = ?", value)), false => None },
			"upvoted_by" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv LEFT JOIN users AS u ON nsv.user_id = u.id WHERE nsv.vote = 1 AND nsv.image_id = images.id AND u.name = ?) > 0", value)), false => None },
			"upvoted_by_id" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv WHERE nsv.vote = 1 AND nsv.image_id = images.id AND nsv.owner_id = ?) > 0", value)), false => None },
			"downvoted_by" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv LEFT JOIN users AS u ON nsv.user_id = u.id WHERE nsv.vote = -1 AND nsv.image_id = images.id AND u.name = ?) > 0", value)), false => None },
			"downvoted_by_id" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv WHERE nsv.vote = -1 AND nsv.image_id = images.id AND nsv.owner_id = ?) > 0", value)), false => None },
			"favorited_by" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM user_favorites AS uf LEFT JOIN users AS u ON uf.user_id = u.id WHERE uf.image_id = images.id AND u.name = ?) > 0", value)), false => None },
			"favorited_by_id" => match op == "=" { true => Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM user_favorites AS uf WHERE uf.image_id = images.id AND uf.user_id = ?) > 0", value)), false => None },

			_ => None,
        }
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

    pub fn new(tags: Vec<String>, offset: i32, limit: i32, filter: ContentFilter) -> Result<ImageQuery, ApiError> {
		let mut tags = tags;
		let mut filter_tags : Vec<String> = Vec::new();

        if !filter.videos
        {
           	filter_tags.push(match filter.vr && !filter.images { true => "vr".to_owned(), false => "content:image_and_vr".to_owned() });
        }

        if !filter.images
        {
            filter_tags.push("-content:image".to_owned())
        }

        if !filter.vr
        {
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
                            order = ImageQuery::parse_order(
                                &captures[3],
                               &captures[5],
                            );
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
                },
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
			order
        })
    }
}
