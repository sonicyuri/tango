use actix_web::{web, Scope};

mod api;
mod schema;
mod services;

pub fn scope() -> Scope {
    web::scope("/import").service(api::import_prepare_handler)
}
