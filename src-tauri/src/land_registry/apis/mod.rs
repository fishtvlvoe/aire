use crate::land_registry::errors::LandRegistryError;
use crate::land_registry::billing_log::BillingLog;
use serde_json::Value;
use std::sync::Arc;

pub mod address_to_parcel;
pub mod building_ownership;
pub mod building_registry;
pub mod co_owners;
pub mod land_registry;
pub mod land_value;
pub mod mortgages;
pub mod zoning;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FieldMapping {
    pub target_field: String,
    pub json_path: String,
}

pub trait LandRegistryEndpoint<T> {
    fn endpoint_path() -> &'static str;
    fn parse_response(json: Value) -> Result<T, LandRegistryError>;
    fn field_mappings() -> Vec<FieldMapping>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApiCredentials {
    pub client_id: String,
    pub client_secret: String,
}

pub trait ApiKeyProvider: Send + Sync {
    fn get_api_key(&self) -> Result<Option<ApiCredentials>, LandRegistryError>;
}

#[derive(Clone)]
pub struct StaticApiKeyProvider {
    credentials: Arc<Option<ApiCredentials>>,
}

impl StaticApiKeyProvider {
    pub fn configured(client_id: impl Into<String>, client_secret: impl Into<String>) -> Self {
        Self {
            credentials: Arc::new(Some(ApiCredentials {
                client_id: client_id.into(),
                client_secret: client_secret.into(),
            })),
        }
    }

    pub fn missing() -> Self {
        Self {
            credentials: Arc::new(None),
        }
    }
}

impl ApiKeyProvider for StaticApiKeyProvider {
    fn get_api_key(&self) -> Result<Option<ApiCredentials>, LandRegistryError> {
        Ok(self.credentials.as_ref().clone())
    }
}

pub async fn post_json_with_key(
    http_client: &reqwest::Client,
    base_url: &str,
    endpoint_path: &str,
    credentials: &ApiCredentials,
    payload: &Value,
) -> Result<(u16, Value), LandRegistryError> {
    let url = format!(
        "{}/{}",
        base_url.trim_end_matches('/'),
        endpoint_path.trim_start_matches('/')
    );
    let auth_header = crate::land_registry::client::build_auth_header(
        &credentials.client_id,
        &credentials.client_secret,
    );
    let response = http_client
        .post(&url)
        .header("Authorization", auth_header)
        .json(payload)
        .send()
        .await
        .map_err(|error| LandRegistryError::Network {
            message: format!("request failed for endpoint={endpoint_path}"),
            source: Box::new(error),
        })?;

    let status = response.status().as_u16();
    let body = response.text().await.map_err(|error| LandRegistryError::Network {
        message: format!("read response failed for endpoint={endpoint_path}"),
        source: Box::new(error),
    })?;
    if !(200..300).contains(&status) {
        return Err(LandRegistryError::from_http_response(status, &body));
    }

    let json = serde_json::from_str(&body).map_err(|error| LandRegistryError::Internal {
        message: format!("invalid json for endpoint={endpoint_path}: {error}"),
    })?;
    Ok((status, json))
}

pub fn require_api_key<P: ApiKeyProvider>(provider: &P) -> Result<ApiCredentials, LandRegistryError> {
    provider
        .get_api_key()?
        .ok_or(LandRegistryError::ApiKeyNotConfigured)
}

pub fn address_cache_parcel_id(normalized_address: &str) -> String {
    let mut encoded = String::from("ADDR");
    for b in normalized_address.as_bytes() {
        encoded.push_str(&format!("{:02X}", b));
    }
    encoded
}

pub fn record_success(
    billing_log: &BillingLog,
    parcel_id: &str,
    endpoint: &str,
    cost: f64,
) -> Result<(), LandRegistryError> {
    billing_log.record_call(parcel_id, endpoint, cost, "N/A")
}

pub fn record_failure(
    billing_log: &BillingLog,
    parcel_id: &str,
    endpoint: &str,
    error: LandRegistryError,
) -> Result<(), LandRegistryError> {
    billing_log.record_failed_call(parcel_id, endpoint, error, "N/A")
}

pub fn normalize_address(input: &str) -> String {
    let mut normalized = String::with_capacity(input.len());
    for ch in input.chars() {
        match ch {
            '\u{3000}' => normalized.push(' '),
            '\u{FF01}'..='\u{FF5E}' => {
                // Full-width ASCII range to half-width.
                let half = (ch as u32).saturating_sub(0xFEE0);
                if let Some(converted) = char::from_u32(half) {
                    normalized.push(converted);
                } else {
                    normalized.push(ch);
                }
            }
            _ => normalized.push(ch),
        }
    }

    normalized
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::normalize_address;

    #[test]
    fn normalizes_full_width_digits() {
        assert_eq!(normalize_address("１００號"), "100號");
    }

    #[test]
    fn trims_and_collapses_spaces() {
        assert_eq!(normalize_address(" 台北  市 "), "台北 市");
    }
}
