use actix_web::{get, HttpRequest};
use actix_web::{web, HttpResponse};

use crate::modules::users::middleware::get_user;
use crate::modules::users::middleware::AuthFactory;
use crate::{
    error::{api_error, ApiError, ApiErrorType},
    AppState,
};

#[get("/thumb/{filename:.*}", wrap = "AuthFactory { reject_unauthed: true }")]
pub async fn upload_job_data_handler(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let user =
        get_user(&req).ok_or(api_error(ApiErrorType::AuthorizationFailed, "Missing user"))?;

    // make sure it's the user with the job, show them the thumbnail for this file
    todo!();
}
