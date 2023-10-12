use actix_web::{web, Scope};

mod api;

pub fn scope() -> Scope {
    web::scope("/favorites").service(api::favorites_list_handler)
}
