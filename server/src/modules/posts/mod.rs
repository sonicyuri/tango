use actix_web::{web, Scope};

mod api;
mod edit;
pub mod model;
mod new;
mod query;
mod schema;
mod util;

pub fn scope() -> Scope {
    web::scope("/post")
        .service(api::post_info_handler)
        .service(edit::post_edit_handler)
        .service(api::post_vote_handler)
        .service(api::post_list_votes_handler)
        .service(new::api::post_new_handler)
        .service(query::api::post_list_handler)
        .service(api::post_delete_handler)
}
