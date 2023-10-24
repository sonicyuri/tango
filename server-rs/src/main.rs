use actix_web::web::JsonConfig;
use actix_web::HttpResponse;
use config::Config;
use sqlx::ConnectOptions;
use std::io::{Error, ErrorKind};
use std::rc::Rc;
use std::str::FromStr;
use std::sync::Arc;
use storage::AppStorage;

use actix_web::middleware::Logger;
use actix_web::{http::header, web, App, HttpServer};
use dotenv::dotenv;
use log::{error, info, trace, warn};
use sqlx::mysql::{MySqlConnectOptions, MySqlPool, MySqlPoolOptions};
use util::{api_error, error_response, ApiErrorType};

use crate::util::api_error_owned;

mod modules;
mod storage;
mod util;

pub struct AppState {
    db: MySqlPool,
    config: Config,
    storage: Arc<AppStorage>,
}

async fn not_found() -> Result<HttpResponse, Error> {
    Ok(HttpResponse::NotFound().json(error_response("Route not found".to_owned())))
}

fn configure(conf: &mut web::ServiceConfig) {
    let scope = web::scope("/api")
        .service(modules::users::scope())
        .service(modules::favorites::scope())
        .service(modules::tags::scope())
        .service(modules::import::scope())
        .service(modules::posts::scope());

    conf.service(scope)
        .default_service(web::route().to(not_found));
}

#[actix_web::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();
    log4rs::init_file("log4rs.yml", Default::default()).unwrap();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let mut connection_options = MySqlConnectOptions::from_str(database_url.as_str())
        .map_err(|e| Error::new(ErrorKind::InvalidData, "Failed to parse DATABASE_URL"))?;
    connection_options = connection_options.log_statements(log::LevelFilter::Info);

    let pool = match MySqlPoolOptions::new()
        .max_connections(10)
        .connect_with(connection_options)
        .await
    {
        Ok(pool) => {
            info!("Connected to database");
            pool
        }
        Err(err) => {
            error!("Failed to connect to the database {:?}", err);
            std::process::exit(1);
        }
    };

    let config: Config = Config::builder()
        .add_source(config::File::with_name("Config"))
        .add_source(config::Environment::with_prefix("APP"))
        .build()
        .unwrap();

    let port: i64 = config.get_int("port").unwrap_or(8121);

    let storage = AppStorage::new(&config).await;

    info!("Starting server on port {}", port);

    HttpServer::new(move || {
        let state: AppState = AppState {
            db: pool.clone(),
            config: config.clone(),
            storage: Arc::new(storage.clone()),
        };

        let json_config = JsonConfig::default().error_handler(|err, req| {
            let err_str = err.to_string();
            api_error_owned(ApiErrorType::InvalidRequest, err_str).into()
        });

        App::new()
            .app_data(web::Data::new(state))
            .app_data(json_config)
            .configure(configure)
            .wrap(Logger::default())
    })
    .bind(("127.0.0.1", port as u16))?
    .run()
    .await
}
