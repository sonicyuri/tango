use actix_web::{web, Scope};

mod api;
mod model;
mod query;
mod schema;
mod util;

pub fn scope() -> Scope {
    web::scope("/post").service(api::post_edit_handler)
}
