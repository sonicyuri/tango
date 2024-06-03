use actix_web::{web, Scope};
use sqlx::MySqlPool;

use crate::error::ApiError;

mod api;
mod model;

pub fn scope() -> Scope {
    web::scope("/tag").service(api::tags_list_handler)
}
