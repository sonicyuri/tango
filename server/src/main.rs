use actix_cors::Cors;
use actix_web::web::JsonConfig;
use actix_web::HttpResponse;
use app_state::AppState;
use futures::FutureExt;
use std::io::Error;

use actix_web::middleware::Logger;
use actix_web::{web, App, HttpServer};
use error::{api_error_owned, ApiErrorType};
use log::info;
use util::error_response;

mod app_state;
mod booru_config;
mod error;
mod modules;
mod storage;
mod util;
mod version;

async fn not_found() -> Result<HttpResponse, Error> {
    Ok(HttpResponse::NotFound().json(error_response("Route not found".to_owned())))
}

fn configure(conf: &mut web::ServiceConfig) {
    let scope = web::scope("/api")
        .service(modules::users::scope())
        .service(modules::favorites::scope())
        .service(modules::tags::scope())
        .service(modules::import::scope())
        .service(modules::posts::scope())
        .service(modules::system::scope())
        .service(modules::pools::scope());

    conf.service(scope)
        .default_service(web::route().to(not_found));
}

#[actix_web::main]
async fn main() -> Result<(), anyhow::Error> {
    let state = AppState::initialize().await?;

    let port: i64 = state.config.get_int("port").unwrap_or(8121);
    let _development_mode: bool = state.config.get_bool("development_mode").unwrap_or(true);

    let server = HttpServer::new(move || {
        let state = state.clone();

        let json_config = JsonConfig::default().error_handler(|err, _req| {
            let err_str = err.to_string();
            api_error_owned(ApiErrorType::InvalidRequest, err_str).into()
        });

        let cors = Cors::default()
            .allow_any_header()
            .allow_any_method()
            .allow_any_origin();

        App::new()
            .app_data(web::Data::new(state))
            .app_data(json_config)
            .wrap(cors)
            .configure(configure)
            .wrap(Logger::default())
    });

    info!("Starting server on port {}", port);
    let server_task = server.bind(("127.0.0.1", port as u16))?.run().fuse();

    Ok(server_task.await?)
}
