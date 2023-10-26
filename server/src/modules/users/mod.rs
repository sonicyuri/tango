use actix_web::{web, Scope};

mod api;
mod config;
pub mod middleware;
mod model;
mod schema;
pub mod util;

pub fn scope() -> Scope {
    web::scope("/user")
        .service(api::user_login_handler)
        .service(api::user_info_handler)
        .service(api::user_refresh_handler)
        .service(api::user_nginx_callback_handler)
        .service(config::scope())
}
