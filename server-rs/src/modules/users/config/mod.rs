use actix_web::{web, Scope};

mod api;
mod schema;

pub fn scope() -> Scope {
    web::scope("/config")
        .service(api::user_config_get_handler)
        .service(api::user_config_set_handler)
}
