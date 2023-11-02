use std::collections::HashMap;

use async_trait::async_trait;
use itertools::Itertools;
use log::{error, info, warn};

use crate::error::{api_error, api_error_owned, ApiError, ApiErrorType};
use crate::util::create_client;

use super::super::resolver::{
    ImportResolver, ImportResolverFile, ImportResolverImageResult, ImportResolverInfo,
};
use super::schema::FluffleSearchResponse;

pub struct FluffleImportResolver {}

pub fn map_service_name(name: &str) -> &'static str {
    match name {
        "e621" => "e926",
        _ => "unknown",
    }
}

#[async_trait]
impl ImportResolver for FluffleImportResolver {
    fn get_info() -> ImportResolverInfo {
        ImportResolverInfo {
            id: "fluffle".to_owned(),
            name: "Fluffle".to_owned(),
            services: ["e926".to_owned()].to_vec(),
        }
    }

    async fn search(
        &self,
        file: ImportResolverFile,
    ) -> Result<Vec<ImportResolverImageResult>, ApiError> {
        let client = create_client()?;

        let bytes = file.get_file().await?;
        let form = reqwest::multipart::Form::new()
            .text("platforms", "e621")
            .text("includeNsfw", "true")
            .part(
                "file",
                reqwest::multipart::Part::bytes(bytes)
                    .file_name("file.png")
                    .mime_str("image/png")
                    .map_err(|e| {
                        error!("reqwest error: {:?}", e);
                        api_error(ApiErrorType::ServerError, "Unknown error sending file")
                    })?,
            );

        let result = client
            .post("https://api.fluffle.xyz/v1/search")
            .multipart(form)
            .send()
            .await
            .map_err(|e| {
                error!("Request error: {:?}", e);
                api_error(ApiErrorType::ServerError, "Couldn't search fluffle")
            })?;

        let result_str = result.text().await.map_err(|e| {
            error!("Can't create string from result: {:?}", e);
            api_error(
                ApiErrorType::ServerError,
                "Invalid search response from Fluffle",
            )
        })?;

        info!("{}", result_str);

        let response: FluffleSearchResponse =
            serde_json::from_str(result_str.as_str()).map_err(|e| {
                error!("JSON deserialization error: {:?}, {:?}", e, result_str);
                api_error(
                    ApiErrorType::ServerError,
                    "Can't deserialize Fluffle response",
                )
            })?;

        match &response.code {
            Some(code) => {
                warn!("Fluffle API response: {:?}", response);
                let errors = response.errors.unwrap_or(HashMap::new());
                Err(api_error_owned(
                    ApiErrorType::InvalidRequest,
                    format!(
                        "Fluffle API error: {}",
                        serde_json::to_string_pretty(&errors).unwrap_or("<invalid>".to_owned())
                    ),
                ))
            }
            None => {
                let results = response.results.ok_or(api_error(
                    ApiErrorType::ServerError,
                    "Can't get Fluffle results",
                ))?;
                Ok(results
                    .iter()
                    .map(|result| ImportResolverImageResult {
                        service: map_service_name(result.platform.as_str()).to_owned(),
                        url: result.location.clone(),
                        thumbnail_url: result.thumbnail.location.clone(),
                        score: result.score,
                    })
                    .collect_vec())
            }
        }
    }
}
