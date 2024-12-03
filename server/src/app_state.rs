use anyhow::Error;
use config::Config;
use dotenv::dotenv;
use sqlx::{
    mysql::{MySqlConnectOptions, MySqlPoolOptions},
    ConnectOptions, MySqlPool,
};
use std::{str::FromStr, sync::Arc};

use crate::{booru_config::BooruConfig, error::AppError, storage::AppStorage};

#[derive(Clone)]
pub struct AppState {
    pub db: MySqlPool,
    pub config: Config,
    pub storage: Arc<AppStorage>,
    pub booru_config: BooruConfig,
}

impl AppState {
    pub async fn create_db() -> Result<MySqlPool, anyhow::Error> {
        let database_url = std::env::var("DATABASE_URL")
            .map_err(|_| AppError::Message("DATABASE_URL must be set".to_owned()))?;
        let mut connection_options = MySqlConnectOptions::from_str(database_url.as_str())
            .map_err(|_| AppError::Message("Failed to parse DATABASE_URL".to_owned()))?;
        connection_options = connection_options.log_statements(log::LevelFilter::Info);

        let pool = MySqlPoolOptions::new()
            .max_connections(10)
            .connect_with(connection_options)
            .await
            .map_err(|e| AppError::Message("failed to create MySQL pool".to_owned()))?;

        sqlx::migrate!()
            .run(&pool)
            .await
            .map_err(|e| AppError::Message(format!("Failed to run migrations: {}", e)))?;

        Ok(pool)
    }

    pub async fn initialize() -> Result<AppState, anyhow::Error> {
        dotenv().ok();
        log4rs::init_file("log4rs.yml", Default::default()).unwrap();

        let pool = Self::create_db().await?;

        let config: Config = Config::builder()
            .add_source(config::File::with_name("Config"))
            .add_source(config::Environment::with_prefix("APP"))
            .build()
            .map_err(|e| AppError::Message("failed to create config".to_owned()))?;

        let storage = AppStorage::new(&config).await;
        let booru_config = BooruConfig::new(&pool.clone()).await;

        return Ok(AppState {
            db: pool,
            config,
            storage: Arc::new(storage),
            booru_config,
        });
    }
}
