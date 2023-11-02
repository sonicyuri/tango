use std::collections::{HashMap, HashSet};

use log::error;
use sqlx::MySqlPool;

use crate::error::{api_error, ApiError, ApiErrorType};

pub struct TagAliasResolver {
    aliases: HashMap<String, String>,
}

async fn fetch_alias_map(db: &MySqlPool) -> Result<HashMap<String, String>, ApiError> {
    let result = sqlx::query!("SELECT oldtag, newtag FROM aliases")
        .fetch_all(db)
        .await?;

    Ok(HashMap::from_iter(
        result.iter().map(|r| (r.oldtag.clone(), r.newtag.clone())),
    ))
}

impl TagAliasResolver {
    pub async fn new(db: &MySqlPool) -> Result<TagAliasResolver, ApiError> {
        let aliases = fetch_alias_map(db).await?;

        Ok(TagAliasResolver { aliases })
    }

    pub fn resolve(&self, tags: &Vec<String>) -> Vec<String> {
        let mut final_tags: HashSet<String> = HashSet::new();
        let mut resolved_tags: HashSet<String> = HashSet::new();

        let mut tags_to_resolve: Vec<String> = Vec::from_iter(tags.iter().map(|t| t.clone()));
        while let Some(tag) = tags_to_resolve.pop() {
            // we already resolved this tag, let's not do it again
            if resolved_tags.contains(&tag) {
                final_tags.insert(tag);
                continue;
            }

            resolved_tags.insert(tag.clone());

            if let Some(alias) = self.aliases.get(&tag) {
                let alias_tags = alias.split(' ').map(|t| t.to_owned());

                tags_to_resolve.extend(alias_tags);
            } else {
                final_tags.insert(tag);
            }
        }

        final_tags.into_iter().collect()
    }
}
