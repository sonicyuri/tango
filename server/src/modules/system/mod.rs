use actix_web::{web, Scope};

mod api;

pub fn scope() -> Scope {
    web::scope("/system").service(api::system_info_handler)
}
