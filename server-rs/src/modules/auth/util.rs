use std::fmt;

use actix_web::{dev::ServiceRequest, http::header::HeaderValue, HttpRequest};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, TokenData, Validation};
use log::error;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

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
