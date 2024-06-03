use actix_web::{web, Scope};

mod api;
mod model;

pub fn scope() -> Scope {
    web::scope("/tag").service(api::tags_list_handler)
}
