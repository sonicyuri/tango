use std::collections::HashMap;

use sqlx::MySqlPool;

#[derive(Clone)]
pub enum ThumbnailFit {
    Fit,
    FitBlur,
    FitBlurPortrait,
    Fill,
    Stretch,
}

impl From<String> for ThumbnailFit {
    fn from(value: String) -> Self {
        match value.as_str() {
            // default to fit
            _ => ThumbnailFit::Fit,
            "Fit Blur" => ThumbnailFit::FitBlur,
            "Fit Blur Tall, Fill Wide" => ThumbnailFit::FitBlurPortrait,
            "Fill" => ThumbnailFit::Fill,
            "Stretch" => ThumbnailFit::Stretch,
        }
    }
}

#[derive(Clone)]
pub struct BooruConfig {
    pub upload_count: i32,
    pub upload_size: usize,
    pub thumb_width: u32,
    pub thumb_height: u32,
    pub thumb_fit: ThumbnailFit,
}

impl BooruConfig {
    // Creates a new BooruConfig using the config table in the database
    pub async fn new(db: &MySqlPool) -> BooruConfig {
        let results: Vec<(String, String)> =
            sqlx::query_as::<_, (String, Option<String>)>(r"SELECT name, value FROM config")
                .fetch_all(db)
                .await
                .expect("Failed to obtain config from database")
                .iter()
                .filter(|(name, value)| value.is_some())
                .map(|(name, value)| (name.clone(), value.as_ref().unwrap().clone()))
                .collect();
        let config: HashMap<String, String> = HashMap::from_iter(results);

        BooruConfig {
            upload_count: config
                .get("upload_count")
                .and_then(|s| s.parse::<i32>().ok())
                .unwrap_or(3),
            upload_size: config
                .get("upload_size")
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(5 * 1000 * 1000),
            thumb_width: config
                .get("thumb_width")
                .and_then(|s| s.parse::<u32>().ok())
                .unwrap_or(192),
            thumb_height: config
                .get("thumb_width")
                .and_then(|s| s.parse::<u32>().ok())
                .unwrap_or(192),
            thumb_fit: config
                .get("thumb_fit")
                .unwrap_or(&"".to_owned())
                .clone()
                .into(),
        }
    }
}
