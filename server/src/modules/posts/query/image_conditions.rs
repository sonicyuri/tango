use std::collections::HashMap;

use bitmask::bitmask;
use chrono::{NaiveTime, Timelike};
use itertools::Itertools;
use once_cell::sync::Lazy;
use parse_size::parse_size;
use serde::{ser::SerializeSeq, Deserialize, Serialize, Serializer};

use crate::util::database::query_object::QueryObject;

bitmask! {
    #[derive(Serialize, Deserialize, Debug)]
    pub mask Operators: u8 where flags Operator {
        Equals        = 1 << 0,
        LessThan      = 1 << 1,
        GreaterThan   = 1 << 2,
        LessThanEq    = 1 << 3,
        GreaterThanEq = 1 << 4,
    }
}

impl Operators {
    pub fn to_str(&self) -> &'static str {
        if self.contains(Operator::LessThan) {
            return "<";
        } else if self.contains(Operator::LessThanEq) {
            return "<=";
        } else if self.contains(Operator::GreaterThan) {
            return ">";
        } else if self.contains(Operator::GreaterThanEq) {
            return ">=";
        }

        return "=";
    }

    pub fn serialize<S>(&self, s: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut seq = s.serialize_seq(None)?;
        if self.contains(Operator::LessThan) {
            seq.serialize_element("lt")?;
        }
        if self.contains(Operator::LessThanEq) {
            seq.serialize_element("lteq")?;
        }
        if self.contains(Operator::GreaterThan) {
            seq.serialize_element("gt")?;
        }
        if self.contains(Operator::GreaterThanEq) {
            seq.serialize_element("gteq")?;
        }
        if self.contains(Operator::Equals) {
            seq.serialize_element("eq")?;
        }
        seq.end()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConditionValue {
    /// Value is expected to equal the placeholder exactly
    Exact,
    /// The value is any integer number
    Integer,
    // The value is any number
    Number,
    /// The value is any sort of text
    Text,
    /// A byte count value, like 10MB, 0.2 GiB, or 200
    Filesize,
    /// A duration, either in hh:mm:ss, mm:ss, :ss, or a number of milliseconds
    Duration,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConditionUsagePart {
    pub placeholder: &'static str,
    pub example: Option<&'static str>,
    pub value_type: ConditionValue,
}

pub type QueryCallback = fn(&str, &str) -> Option<QueryObject>;

#[derive(Debug, Serialize, Clone)]
pub struct ImageCondition {
    pub name: &'static str,
    pub help: &'static str,
    #[serde(serialize_with = "Operators::serialize")]
    pub operators: Operators,
    pub usage: Vec<ConditionUsagePart>,
    #[serde(skip)]
    pub to_query: QueryCallback,
}

impl ImageCondition {
    pub fn new_all(
        name: &'static str,
        help: &'static str,
        usage: Vec<ConditionUsagePart>,
        to_query: QueryCallback,
    ) -> ImageCondition {
        ImageCondition {
            name,
            help,
            operators: Operators::all(),
            usage,
            to_query,
        }
    }

    pub fn new_all_single(
        name: &'static str,
        help: &'static str,
        part: ConditionUsagePart,
        to_query: QueryCallback,
    ) -> ImageCondition {
        ImageCondition {
            name,
            help,
            operators: Operators::all(),
            usage: vec![part],
            to_query,
        }
    }

    pub fn new_equals_single(
        name: &'static str,
        help: &'static str,
        part: ConditionUsagePart,
        to_query: QueryCallback,
    ) -> ImageCondition {
        ImageCondition {
            name,
            help,
            operators: Operator::Equals.into(),
            usage: vec![part],
            to_query,
        }
    }
}

pub static IMAGE_CONDITIONS: Lazy<Vec<ImageCondition>> = Lazy::new(|| {
    vec![
        ImageCondition::new_all_single(
            "id",
            "filter by post ID",
            ConditionUsagePart {
                placeholder: "{post id}",
                value_type: ConditionValue::Integer,
                example: Some("952"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.id {} ?", op).as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_all_single(
            "width",
            "filter by content width",
            ConditionUsagePart {
                placeholder: "{width}",
                value_type: ConditionValue::Integer,
                example: Some("640"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.width {} ?", op).as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_all_single(
            "height",
            "filter by content height",
            ConditionUsagePart {
                placeholder: "{height}",
                value_type: ConditionValue::Integer,
                example: Some("480"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.height {} ?", op).as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_all(
            "ratio",
            "filter by aspect ratio",
            vec![
                ConditionUsagePart {
                    placeholder: "{width}",
                    value_type: ConditionValue::Number,
                    example: Some("4"),
                },
                ConditionUsagePart {
                    placeholder: ":",
                    value_type: ConditionValue::Exact,
                    example: None,
                },
                ConditionUsagePart {
                    placeholder: "{height}",
                    value_type: ConditionValue::Number,
                    example: Some("3"),
                },
            ],
            |op, value| {
                let parts: Vec<i32> = value
                    .split(":")
                    .filter_map(|f| f.parse().ok())
                    .collect_vec();
                match parts.len() {
                    2 => {
                        let aspect_ratio = (parts[0] as f32) / (parts[1] as f32);
                        Some(QueryObject::new_with_param(
                            format!("ROUND(images.width / images.height, 2) {} ROUND(?, 2)", op)
                                .as_str(),
                            aspect_ratio,
                        ))
                    }
                    _ => None,
                }
            },
        ),
        ImageCondition::new_all(
            "size",
            "filter by content width and height",
            vec![
                ConditionUsagePart {
                    placeholder: "{width}",
                    value_type: ConditionValue::Number,
                    example: Some("640"),
                },
                ConditionUsagePart {
                    placeholder: "x",
                    value_type: ConditionValue::Exact,
                    example: None,
                },
                ConditionUsagePart {
                    placeholder: "{height}",
                    value_type: ConditionValue::Number,
                    example: Some("480"),
                },
            ],
            |op, value| {
                let parts: Vec<i32> = value
                    .split("x")
                    .filter_map(|f| f.parse().ok())
                    .collect_vec();
                match parts.len() {
                    2 => Some(QueryObject::new_with_query(
                        format!(
                            "images.width {} {} AND images.height {} {}",
                            op, parts[0], op, parts[1]
                        )
                        .as_str(),
                    )),
                    _ => None,
                }
            },
        ),
        ImageCondition::new_all_single(
            "filesize",
            "filter by file size",
            ConditionUsagePart {
                placeholder: "{file size}",
                value_type: ConditionValue::Filesize,
                example: Some("500KB"),
            },
            |op, value| match parse_size(value) {
                Ok(size) => Some(QueryObject::new_with_param(
                    format!("images.filesize {} ?", op).as_str(),
                    size,
                )),
                Err(_err) => None,
            },
        ),
        // TODO: this should accept a YYYY-MM-DD value instead
        ImageCondition::new_all_single(
            "posted",
            "filter by upload date",
            ConditionUsagePart {
                placeholder: "{unix timestamp}",
                value_type: ConditionValue::Integer,
                example: Some("1717395985"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.posted {} ?", op).as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_all_single(
            "length",
            "filter by content duration",
            ConditionUsagePart {
                placeholder: "{duration}",
                value_type: ConditionValue::Duration,
                example: Some("1:00"),
            },
            |op, value| {
                let time_ms: u32 = match value.parse().ok() {
                    Some(time) => time,
                    None => {
                        let time = NaiveTime::parse_from_str(value, "%hh:%mm:%ss")
                            .or(NaiveTime::parse_from_str(value, "%mm:%ss"))
                            .or(NaiveTime::parse_from_str(value, ":%ss"));
                        match time {
                            Ok(nt) => nt.num_seconds_from_midnight(),
                            Err(_) => 0,
                        }
                    }
                };

                Some(QueryObject::new_with_param(
                    format!("images.length {} ?", op).as_str(),
                    time_ms,
                ))
            },
        ),
        ImageCondition::new_all_single(
            "score",
            "filter by total likes and dislikes",
            ConditionUsagePart {
                placeholder: "{score}",
                value_type: ConditionValue::Integer,
                example: Some("10"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.numeric_score {} ?", op).as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_equals_single(
            "source",
            "filter by image source",
            ConditionUsagePart {
                placeholder: "{source, 'any', or 'none'}",
                value_type: ConditionValue::Text,
                example: Some("any"),
            },
            |_op, value| match value {
                "any" => Some(QueryObject::new_with_query("images.source IS NOT NULL")),
                "none" => Some(QueryObject::new_with_query("images.source IS NULL")),
                v => Some(QueryObject::new_with_param("images.source", v)),
            },
        ),
        ImageCondition::new_equals_single(
            "hash",
            "find post by hash",
            ConditionUsagePart {
                placeholder: "{SHA1 hash}",
                value_type: ConditionValue::Text,
                example: Some("53f64c3a5e090018df4417ce11e50fd59122e725"),
            },
            |_op, value| Some(QueryObject::new_with_param("images.hash = ?", value)),
        ),
        ImageCondition::new_equals_single(
            "filename",
            "filter by original file name",
            ConditionUsagePart {
                placeholder: "{filename}",
                value_type: ConditionValue::Text,
                example: Some("anime.jpg"),
            },
            |_op, value| Some(QueryObject::new_with_param("images.filename = ?", value)),
        ),
        ImageCondition::new_equals_single(
            "mime",
            "filter by content mime type",
            ConditionUsagePart {
                placeholder: "{mime}",
                value_type: ConditionValue::Text,
                example: Some("image/png"),
            },
            |_op, value| Some(QueryObject::new_with_param("images.mime = ?", value)),
        ),
        ImageCondition::new_equals_single(
            "ext",
            "filter by content file extension",
            ConditionUsagePart {
                placeholder: "{ext}",
                value_type: ConditionValue::Text,
                example: Some("png"),
            },
            |_op, value| Some(QueryObject::new_with_param("images.ext = ?", value)),
        ),
        ImageCondition::new_equals_single(
            "content",
            "filter by content type",
            ConditionUsagePart {
                placeholder: "{'audio', 'video', 'image', 'vr', or 'image_and_vr'}",
                value_type: ConditionValue::Text,
                example: Some("video"),
            },
            |_op, value| {
                match value {
                "audio" => Some(QueryObject::new_with_query(
                    "images.audio = 1 OR images.video = 1",
                )),
                "video" => Some(QueryObject::new_with_query("images.video = 1")),
                "image" => Some(QueryObject::new_with_query("images.image = 1")),
                "vr" => Some(QueryObject::new_with_query("images.id IN (SELECT image_id FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE t.tag = 'vr')")),
                // hack since there's no other way to get this combination using other queries
                "image_and_vr" => Some(QueryObject::new_with_query("(images.image = 1 OR images.id IN (SELECT image_id FROM image_tags AS it LEFT JOIN tags AS t ON it.tag_id = t.id WHERE t.tag = 'vr'))")),
                _ => None,
            }
            },
        ),
        ImageCondition::new_all_single(
            "tags",
            "filter by tag count",
            ConditionUsagePart {
                placeholder: "{tag count}",
                value_type: ConditionValue::Integer,
                example: Some("5"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!(
                        "(SELECT COUNT(*) AS c FROM image_tags WHERE image_id = images.id) {} ?",
                        op
                    )
                    .as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_all_single(
            "comments",
            "filter by comment count",
            ConditionUsagePart {
                placeholder: "{comment count}",
                value_type: ConditionValue::Integer,
                example: Some("5"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!(
                        "(SELECT COUNT(*) AS c FROM comments WHERE image_id = images.id) {} ?",
                        op
                    )
                    .as_str(),
                    value,
                ))
            },
        ),
        ImageCondition::new_equals_single(
            "commented_by",
            "filter for posts a specific user commented on",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM comments AS c LEFT JOIN users AS u ON c.owner_id = u.id WHERE c.image_id = images.id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "commented_by_userno",
            "filter for posts a specific user ID commented on",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM comments AS c WHERE c.image_id = images.id AND c.owner_id = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "poster",
            "filter for posts uploaded by a specific user",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM users AS u WHERE u.id = images.owner_id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "poster_id",
            "filter for posts uploaded by a specific user ID",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| Some(QueryObject::new_with_param("images.owner_id = ?", value)),
        ),
        ImageCondition::new_equals_single(
            "upvoted_by",
            "filter for posts liked by a specific user",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv LEFT JOIN users AS u ON nsv.user_id = u.id WHERE nsv.score = 1 AND nsv.image_id = images.id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "upvoted_by_id",
            "filter for posts liked by a specific user ID",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv WHERE nsv.score = 1 AND nsv.image_id = images.id AND nsv.owner_id = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "downvoted_by",
            "filter for posts disliked by a specific user",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv LEFT JOIN users AS u ON nsv.user_id = u.id WHERE nsv.score = -1 AND nsv.image_id = images.id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "downvoted_by_id",
            "filter for posts disliked by a specific user ID",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM numeric_score_votes AS nsv WHERE nsv.score = -1 AND nsv.image_id = images.id AND nsv.owner_id = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "favorited_by",
            "filter for posts favorited by a specific user",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM user_favorites AS uf LEFT JOIN users AS u ON uf.user_id = u.id WHERE uf.image_id = images.id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "favorited_by_id",
            "filter for posts favorited by a specific user ID",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM user_favorites AS uf WHERE uf.image_id = images.id AND uf.user_id = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "viewed_by",
            "filter for posts viewed by a specific user",
            ConditionUsagePart {
                placeholder: "{username}",
                value_type: ConditionValue::Text,
                example: Some("admin"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM image_views AS iv LEFT JOIN users AS u ON iv.user_id = u.id WHERE iv.image_id = images.id AND u.name = ?) > 0", value))
            },
        ),
        ImageCondition::new_equals_single(
            "viewed_by_id",
            "filter for posts viewed by a specific user ID",
            ConditionUsagePart {
                placeholder: "{user ID}",
                value_type: ConditionValue::Integer,
                example: Some("1"),
            },
            |_op, value| {
                Some(QueryObject::new_with_param("(SELECT COUNT(*) FROM image_views WHERE image_id = images.id AND user_id = ?) > 0", value))
            },
        ),
        ImageCondition::new_all_single(
            "views",
            "filter for posts based on view count",
            ConditionUsagePart {
                placeholder: "{view count}",
                value_type: ConditionValue::Integer,
                example: Some("10"),
            },
            |op, value| {
                Some(QueryObject::new_with_param(
                    format!("images.views {} ?", op).as_str(),
                    value,
                ))
            },
        ),
    ]
});

pub static IMAGE_CONDITIONS_MAP: Lazy<HashMap<&'static str, &ImageCondition>> = Lazy::new(|| {
    IMAGE_CONDITIONS
        .iter()
        .map(|c: &ImageCondition| (c.name, c))
        .collect()
});
