use std::fmt;

use actix_web::{dev::ServiceRequest, http::header::HeaderValue, HttpRequest};
use base64::{
    alphabet,
    engine::{self, general_purpose},
    Engine as _,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, TokenData, Validation};
use log::error;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sqlx::MySqlPool;

use crate::util::{api_error, ApiError, ApiErrorType};

use super::model::{AuthTokenResponse, UserModel};

static SECRET: Lazy<String> =
    Lazy::new(|| std::env::var("TOKEN_SECRET").expect("TOKEN_SECRET must be set"));
static ENCODING_KEY: Lazy<EncodingKey> = Lazy::new(|| EncodingKey::from_secret(SECRET.as_bytes()));
static DECODING_KEY: Lazy<DecodingKey> = Lazy::new(|| DecodingKey::from_secret(SECRET.as_bytes()));

pub fn standardize_php_hash(hash: String) -> String {
    hash.replace("$2y$", "$2a$")
}

#[derive(Debug, PartialEq)]
pub enum AuthTokenKind {
    Access,
    Refresh,
}

impl fmt::Display for AuthTokenKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthTokenClaims {
    #[serde(rename = "type")]
    kind: String,
    exp: i64,
    name: String,
    id: i32,
}

pub fn create_auth_token(
    user: &UserModel,
    kind: AuthTokenKind,
) -> Result<AuthTokenResponse, jsonwebtoken::errors::Error> {
    let expiration: chrono::DateTime<Utc> = Utc::now()
        + Duration::seconds(match kind {
            AuthTokenKind::Access => 60 * 60 * 24,
            AuthTokenKind::Refresh => 60 * 60 * 24 * 30,
        });

    let expiration_str = expiration.to_rfc3339();
    let user_id = user.id.to_string();

    let claims = AuthTokenClaims {
        kind: match kind {
            AuthTokenKind::Access => "access",
            AuthTokenKind::Refresh => "refresh",
        }
        .to_owned(),
        name: user.name.clone(),
        id: user.id.clone(),
        exp: expiration.timestamp(),
    };

    let token: String = jsonwebtoken::encode(&Header::default(), &claims, &*ENCODING_KEY)?;
    Ok(AuthTokenResponse {
        token: token,
        expires: expiration_str,
    })
}

pub fn validate_auth_header(
    req: &ServiceRequest,
    expected_kind: AuthTokenKind,
) -> Result<i32, &'static str> {
    let authorization_header: &HeaderValue = req
        .headers()
        .get("Authorization")
        .ok_or("Missing Authorization header")?;

    let token_pair: Vec<&str> = authorization_header
        .to_str()
        .map_err(|e| "Invalid Authorization header")?
        .split_whitespace()
        .collect();

    if token_pair.len() < 2 {
        return Err("Invalid Bearer token format");
    }

    if token_pair[0] != "Bearer" {
        return Err("Only Bearer tokens are supported");
    }

    let token = token_pair[1];

    validate_auth_token(token, expected_kind)
}

pub fn validate_auth_token(token: &str, expected_kind: AuthTokenKind) -> Result<i32, &'static str> {
    let token: TokenData<AuthTokenClaims> =
        jsonwebtoken::decode::<AuthTokenClaims>(token, &*DECODING_KEY, &Validation::default())
            .map_err(|e| {
                error!("JWT error: {}", e.to_string());
                "Failed to verify JWT token"
            })?;

    let kind = match token.claims.kind.as_str() {
        "access" => Ok(AuthTokenKind::Access),
        "refresh" => Ok(AuthTokenKind::Refresh),
        _ => Err("Invalid auth token"),
    }?;

    if kind != expected_kind {
        return Err("Token type mismatch");
    }

    return Ok(token.claims.id);
}

pub async fn check_user(
    db: &MySqlPool,
    username: &String,
    password: &String,
) -> Result<UserModel, ApiError> {
    match sqlx::query_as!(UserModel, r#"SELECT * FROM users WHERE name = ?"#, username)
        .fetch_one(db)
        .await
    {
        Ok(user) => match check_password(&user, &password) {
            Ok(true) => Ok(user),
            Ok(false) => Err(api_error(
                ApiErrorType::AuthorizationFailed,
                "Invalid credentials",
            )),
            Err(e) => Err(e),
        },
        Err(sqlx::Error::RowNotFound) => Err(api_error(
            ApiErrorType::AuthorizationFailed,
            "Invalid credentials",
        )),
        Err(e) => {
            error!("Database error: {:?}", e);
            Err(api_error(
                ApiErrorType::ServerError,
                "Unknown database error",
            ))
        }
    }
}

pub fn check_password(user: &UserModel, plaintext: &str) -> Result<bool, ApiError> {
    let pass_hash = standardize_php_hash(user.pass.clone().unwrap_or("".to_owned()));

    bcrypt::verify(plaintext, &pass_hash).map_err(|e| {
        error!("Bcrypt error: {:?}", e);
        api_error(
            ApiErrorType::ServerError,
            "Password hashing went wrong somehow",
        )
    })
}

pub fn get_basic_auth_header(req: &HttpRequest) -> Option<(String, String)> {
    let authorization_header = req.headers().get("Authorization")?;

    let token_pair: Vec<&str> = authorization_header
        .to_str()
        .ok()?
        .split_whitespace()
        .collect();

    if token_pair.len() != 2 || token_pair[0] != "Basic" {
        return None;
    }

    let decoded = general_purpose::STANDARD.decode(token_pair[1]).ok()?;
    let decoded_str = std::str::from_utf8(decoded.as_slice()).ok()?;

    let decoded_pair: Vec<&str> = decoded_str.split(":").collect();
    if decoded_pair.len() != 2 {
        return None;
    }

    return Some((decoded_pair[0].to_owned(), decoded_pair[1].to_owned()));
}
