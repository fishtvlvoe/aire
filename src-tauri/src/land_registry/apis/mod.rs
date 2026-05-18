use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use base64::Engine as _;
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
    /// 空字串 = 維持 Basic auth（沙箱/測試用）；非空 = GET token_endpoint → Bearer token
    pub token_endpoint: String,
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
                token_endpoint: String::new(),
            })),
        }
    }

    pub fn with_token_endpoint(
        client_id: impl Into<String>,
        client_secret: impl Into<String>,
        token_endpoint: impl Into<String>,
    ) -> Self {
        Self {
            credentials: Arc::new(Some(ApiCredentials {
                client_id: client_id.into(),
                client_secret: client_secret.into(),
                token_endpoint: token_endpoint.into(),
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
    let auth_header = if !credentials.token_endpoint.is_empty() {
        let basic = format!(
            "Basic {}",
            base64::engine::general_purpose::STANDARD
                .encode(format!("{}:{}", credentials.client_id, credentials.client_secret))
        );

        let token_response = http_client
            .get(&credentials.token_endpoint)
            .header("Authorization", basic)
            .send()
            .await
            .map_err(|error| LandRegistryError::Network {
                message: "token endpoint request failed".to_string(),
                source: Box::new(error),
            })?;

        let token_status = token_response.status().as_u16();
        let token_body = token_response
            .text()
            .await
            .map_err(|error| LandRegistryError::Network {
                message: "read token endpoint response failed".to_string(),
                source: Box::new(error),
            })?;

        if !(200..300).contains(&token_status) {
            return Err(LandRegistryError::AuthFailed {
                message: format!("token endpoint returned {token_status}"),
                response_body: token_body,
            });
        }

        let token_json: Value = serde_json::from_str(&token_body).map_err(|error| {
            LandRegistryError::AuthFailed {
                message: format!("invalid JSON from token endpoint: {error}"),
                response_body: token_body.clone(),
            }
        })?;

        let access_token = token_json
            .get("access_token")
            .and_then(|value| value.as_str())
            .ok_or_else(|| LandRegistryError::AuthFailed {
                message: "token endpoint response missing access_token".to_string(),
                response_body: token_body.clone(),
            })?;

        format!("Bearer {access_token}")
    } else {
        crate::land_registry::client::build_auth_header(
            &credentials.client_id,
            &credentials.client_secret,
        )
    };
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
    let body = response
        .text()
        .await
        .map_err(|error| LandRegistryError::Network {
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

pub fn require_api_key<P: ApiKeyProvider>(
    provider: &P,
) -> Result<ApiCredentials, LandRegistryError> {
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

    normalized.split_whitespace().collect::<Vec<_>>().join(" ")
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

    // ── TDD 紅燈測試：Token 認證流程 ─────────────────────────────────────

    use super::{post_json_with_key, ApiKeyProvider, StaticApiKeyProvider};
    use base64::Engine as _;
    use crate::land_registry::errors::LandRegistryError;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    /// Task 1.1: token_endpoint 非空時，業務 API 請求應使用 Bearer token
    #[tokio::test]
    async fn token_endpoint_set_uses_bearer_auth() {
        let server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/cp/getToken"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "access_token": "test-tok",
                "expires_in": 300
            })))
            .mount(&server)
            .await;

        Mock::given(method("POST"))
            .and(path("/TestApi/1.0/Query"))
            .and(header("Authorization", "Bearer test-tok"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": []
            })))
            .mount(&server)
            .await;

        let token_url = format!("{}/cp/getToken", server.uri());
        let credentials = StaticApiKeyProvider::with_token_endpoint("cid", "secret", &token_url)
            .get_api_key()
            .unwrap()
            .unwrap();

        let client = reqwest::Client::new();
        let result = post_json_with_key(
            &client,
            &server.uri(),
            "/TestApi/1.0/Query",
            &credentials,
            &serde_json::json!([{}]),
        )
        .await;

        assert!(result.is_ok(), "expected ok, got {:?}", result);
    }

    /// Task 1.2: token endpoint 回 401 → 應回 AuthFailed
    #[tokio::test]
    async fn token_endpoint_401_returns_auth_failed() {
        let server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/cp/getToken"))
            .respond_with(ResponseTemplate::new(401).set_body_string("Unauthorized"))
            .mount(&server)
            .await;

        let token_url = format!("{}/cp/getToken", server.uri());
        let credentials = StaticApiKeyProvider::with_token_endpoint("cid", "secret", &token_url)
            .get_api_key()
            .unwrap()
            .unwrap();

        let client = reqwest::Client::new();
        let result = post_json_with_key(
            &client,
            &server.uri(),
            "/TestApi/1.0/Query",
            &credentials,
            &serde_json::json!([{}]),
        )
        .await;

        assert!(
            matches!(result, Err(LandRegistryError::AuthFailed { .. })),
            "expected AuthFailed, got {:?}",
            result
        );
    }

    /// Task 1.3: token_endpoint 為空 → 維持 Basic auth，不呼叫 token endpoint
    #[tokio::test]
    async fn empty_token_endpoint_uses_basic_auth() {
        let server = MockServer::start().await;

        // 正確的 Basic base64("cid:secret")
        let expected_basic = format!(
            "Basic {}",
            base64::engine::general_purpose::STANDARD
                .encode("cid:secret")
        );

        Mock::given(method("POST"))
            .and(path("/TestApi/1.0/Query"))
            .and(header("Authorization", expected_basic.as_str()))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": []
            })))
            .mount(&server)
            .await;

        let credentials = StaticApiKeyProvider::configured("cid", "secret")
            .get_api_key()
            .unwrap()
            .unwrap();

        let client = reqwest::Client::new();
        let result = post_json_with_key(
            &client,
            &server.uri(),
            "/TestApi/1.0/Query",
            &credentials,
            &serde_json::json!([{}]),
        )
        .await;

        assert!(result.is_ok(), "expected ok with Basic auth, got {:?}", result);
    }
}
