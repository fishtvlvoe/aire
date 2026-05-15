use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "land_registry";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LandRegistryData {
    pub land_area: f64,
    pub land_purpose: String,
    pub owner_name: String,
}

pub struct LandRegistryEndpointImpl;

impl LandRegistryEndpoint<LandRegistryData> for LandRegistryEndpointImpl {
    fn endpoint_path() -> &'static str {
        "/land/parcel/land-registry"
    }

    fn parse_response(json: Value) -> Result<LandRegistryData, LandRegistryError> {
        let root = json.get("data").unwrap_or(&json);
        Ok(LandRegistryData {
            land_area: root.get("land_area").and_then(Value::as_f64).ok_or(
                LandRegistryError::Internal {
                    message: "missing land_area".to_string(),
                },
            )?,
            land_purpose: root
                .get("land_purpose")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            owner_name: root
                .get("owner_name")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
        })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "land_area".to_string(),
                json_path: "$.data.land_area".to_string(),
            },
            FieldMapping {
                target_field: "land_purpose".to_string(),
                json_path: "$.data.land_purpose".to_string(),
            },
            FieldMapping {
                target_field: "owner_name".to_string(),
                json_path: "$.data.owner_name".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct LandRegistryApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> LandRegistryApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<LandRegistryData, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;
        let payload = serde_json::json!({ "parcel_id": parcel_id });
        let response = post_json_with_key(
            &self.http_client,
            &self.base_url,
            LandRegistryEndpointImpl::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = LandRegistryEndpointImpl::parse_response(json);
                match parsed {
                    Ok(data) => {
                        let _ =
                            record_success(&self.billing_log, parcel_id, API_ID, self.unit_cost);
                        Ok(data)
                    }
                    Err(error) => {
                        let _ = record_failure(
                            &self.billing_log,
                            parcel_id,
                            API_ID,
                            LandRegistryError::Internal {
                                message: format!("parse error: {error}"),
                            },
                        );
                        Err(error)
                    }
                }
            }
            Err(error) => {
                let _ = record_failure(
                    &self.billing_log,
                    parcel_id,
                    API_ID,
                    LandRegistryError::Internal {
                        message: format!("request error: {error}"),
                    },
                );
                Err(error)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::LandRegistryApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_land_registry_and_records_billing() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/parcel/land-registry"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "data": {
                    "land_area": 120.0,
                    "land_purpose": "住宅區",
                    "owner_name": "王小明"
                }
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandRegistryApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("0301-0001").await.unwrap();
        assert!((result.land_area - 120.0).abs() < f64::EPSILON);
        assert_eq!(result.land_purpose, "住宅區");
        assert_eq!(result.owner_name, "王小明");

        let entries = billing_log.get_entries_for("0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "land_registry");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
