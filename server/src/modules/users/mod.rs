use actix_web::{web, Scope};

mod api;
mod config;
mod invites;
pub mod middleware;
pub mod model;
mod schema;
pub mod user;
pub mod util;

pub fn scope() -> Scope {
    web::scope("/user")
        .service(api::user_login_handler)
        .service(api::user_info_handler)
        .service(api::user_refresh_handler)
        .service(api::user_nginx_callback_handler)
        .service(api::user_signup_handler)
        .service(config::api::user_config_get_handler)
        .service(config::api::user_config_set_handler)
        .service(invites::scope())
}
