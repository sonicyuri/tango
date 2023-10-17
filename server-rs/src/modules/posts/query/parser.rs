use std::collections::BTreeMap;

pub struct ImageQuery {
    pub tag_conditions: Vec<(String, bool)>,
    pub offset: i32,
    pub limit: i32,
}

impl ImageQuery {
    // todo: handle aliases
    pub fn new(tags: Vec<String>) -> ImageQuery {
        let mut tags_map: BTreeMap<String, bool> = BTreeMap::new();
        tags.iter().for_each(|tag| {
            if tag.starts_with("-") {
                tags_map.insert(tag.chars().skip(1).collect(), false);
            } else {
                tags_map.insert(tag.clone(), true);
            }
        });

        let tag_conditions: Vec<(String, bool)> =
            tags_map.iter().map(|(k, v)| (k.clone(), *v)).collect();
        ImageQuery {
            tag_conditions,
            offset: 0,
            limit: 30,
        }
    }
}
