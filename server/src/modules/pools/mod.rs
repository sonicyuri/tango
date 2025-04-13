use actix_web::{web, Scope};

mod api;
pub mod model;
mod schema;

pub fn scope() -> Scope {
    web::scope("/pool")
        .service(api::pool_info_handler)
        .service(api::pool_list_handler)
		.service(api::pool_post_handler)
		.service(api::pool_edit_handler)
}
