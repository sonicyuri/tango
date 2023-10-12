use actix_web::HttpResponse;
use config::Config;
use std::io::Error;

use actix_web::middleware::Logger;
use actix_web::{http::header, web, App, HttpServer};
use dotenv::dotenv;
use log::{error, info, trace, warn};
use sqlx::mysql::{MySqlPool, MySqlPoolOptions};
use util::{api_error, error_response};

mod modules;
mod util;

pub struct AppState {
    db: MySqlPool,
    config: Config,
}

async fn not_found() -> Result<HttpResponse, Error> {
    Ok(HttpResponse::NotFound().json(error_response("Route not found")))
}

fn configure(conf: &mut web::ServiceConfig) {
    let scope = web::scope("/api")
        .service(modules::auth::scope())
        .service(modules::favorites::scope());

    conf.service(scope)
        .default_service(web::route().to(not_found));
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    log4rs::init_file("log4rs.yml", Default::default()).unwrap();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = match MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
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

    info!("Starting server on port {}", port);

    HttpServer::new(move || {
        let state: AppState = AppState {
            db: pool.clone(),
            config: config.clone(),
        };

        App::new()
            .app_data(web::Data::new(state))
            .configure(configure)
            .wrap(Logger::default())
    })
    .bind(("127.0.0.1", port as u16))?
    .run()
    .await
}
