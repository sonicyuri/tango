use actix_web::{web, Scope};

mod api;
mod schema;

pub fn scope() -> Scope {
    web::scope("/favorites")
        .service(api::favorites_list_handler)
        .service(api::favorites_set_handler)
}
