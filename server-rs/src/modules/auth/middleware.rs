use actix_web::dev::{forward_ready, Payload, Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::{web, FromRequest, HttpMessage, HttpRequest, HttpResponse};
use futures::future::LocalBoxFuture;
use log::error;
use std::future::{ready, Future, Ready};
use std::pin::Pin;
use std::rc::Rc;
use uuid::Uuid;

use crate::modules::auth::model::UserModel;
use crate::util::{api_error, error_response, unauthorized_error, ApiError, ApiErrorType};
use crate::AppState;

use super::model::UserModelResponse;
use super::util::validate_auth_header;

pub struct AuthFactory {
    pub reject_unauthed: bool,
}

impl<S, B> Transform<S, ServiceRequest> for AuthFactory
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type InitError = ();
    type Transform = AuthMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware {
            service: Rc::new(service),
            reject_unauthed: self.reject_unauthed,
        }))
    }
}

pub struct AuthMiddleware<S> {
    service: Rc<S>,
    reject_unauthed: bool,
}

impl<S> AuthMiddleware<S> {
    async fn handle_call(req: &mut ServiceRequest) -> Result<UserModel, ApiError> {
        let state = req
            .extract::<web::Data<AppState>>()
            .await
            .map_err(|e| api_error(ApiErrorType::ServerError, "Failed to fetch database"))?;

        let pool = &state.db;

        match validate_auth_header(req, super::util::AuthTokenKind::Access) {
            Ok(user_id) => {
                let query_result =
                    sqlx::query_as!(UserModel, r#"SELECT * FROM users WHERE id = ?"#, user_id)
                        .fetch_one(pool)
                        .await;

                match query_result {
                    Ok(user) => Ok(user),
                    Err(sqlx::Error::RowNotFound) => Err(api_error(
                        ApiErrorType::AuthorizationFailed,
                        "User not found",
                    )),
                    Err(e) => {
                        error!("Database error: {:?}", e);
                        Err(api_error(
                            ApiErrorType::ServerError,
                            "Database request failed",
                        ))
                    }
                }
            }
            Err(err) => Err(api_error(ApiErrorType::AuthorizationFailed, err)),
        }
    }
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let reject_unauthed = self.reject_unauthed;

        Box::pin(async move {
            let result = AuthMiddleware::<S>::handle_call(&mut req).await;
            if let Ok(user) = &result {
                req.extensions_mut()
                    .insert::<Rc<UserModel>>(Rc::new(user.clone()));
            }

            if reject_unauthed && result.is_err() {
                return Err(actix_web::Error::from(result.err().expect("No err?")));
            }

            return Ok(service.call(req).await?);
        })
    }
}

pub fn get_user(req: &HttpRequest) -> Option<Rc<UserModel>> {
    match req.extensions().get::<Rc<UserModel>>() {
        Some(rc) => Some(rc.clone()),
        None => None,
    }
}
