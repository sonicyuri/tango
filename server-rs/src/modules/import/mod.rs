use actix_web::{web, Scope};

mod api;
mod resolvers;
mod schema;
mod services;
mod util;

pub fn scope() -> Scope {
    web::scope("/import")
        .service(api::import_prepare_handler)
        .service(api::import_resolve_handler)
        .service(api::import_list_resolvers_handler)
}
