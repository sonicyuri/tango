use actix_web::{web, Scope};

pub mod api;
mod model;

pub fn scope() -> Scope {
    web::scope("/invite")
        .service(api::user_list_invites_handler)
        .service(api::user_create_invite_handler)
        .service(api::user_delete_invite_handler)
}
