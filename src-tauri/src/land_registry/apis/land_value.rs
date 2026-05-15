use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "land_value";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LandValueData {
    pub announced_land_value: f64,
    pub assessed_land_value: f64,
}

pub struct LandValueEndpoint;

impl LandRegistryEndpoint<LandValueData> for LandValueEndpoint {
    fn endpoint_path() -> &'static str {
        "/land/parcel/land-value"
    }

    fn parse_response(json: Value) -> Result<LandValueData, LandRegistryError> {
        let root = json.get("data").unwrap_or(&json);
        Ok(LandValueData {
            announced_land_value: root
                .get("announced_land_value")
                .and_then(Value::as_f64)
                .ok_or(LandRegistryError::Internal {
                    message: "missing announced_land_value".to_string(),
                })?,
            assessed_land_value: root
                .get("assessed_land_value")
                .and_then(Value::as_f64)
                .ok_or(LandRegistryError::Internal {
                    message: "missing assessed_land_value".to_string(),
                })?,
        })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "announced_land_value".to_string(),
                json_path: "$.data.announced_land_value".to_string(),
            },
            FieldMapping {
                target_field: "assessed_land_value".to_string(),
                json_path: "$.data.assessed_land_value".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct LandValueApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> LandValueApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<LandValueData, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;
        let payload = serde_json::json!({ "parcel_id": parcel_id });
        let response = post_json_with_key(
            &self.http_client,
            &self.base_url,
            LandValueEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = LandValueEndpoint::parse_response(json);
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
    use super::LandValueApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use crate::land_registry::errors::LandRegistryError;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_land_value_and_records_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/parcel/land-value"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "data": {
                    "announced_land_value": 1000.0,
                    "assessed_land_value": 800.0
                }
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandValueApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("0301-0001").await.unwrap();
        assert!((result.announced_land_value - 1000.0).abs() < f64::EPSILON);
        assert!((result.assessed_land_value - 800.0).abs() < f64::EPSILON);
        let entries = billing_log.get_entries_for("0301-0001");
        assert_eq!(entries.len(), 1);
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }

    #[tokio::test]
    async fn failed_call_records_zero_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/parcel/land-value"))
            .respond_with(ResponseTemplate::new(503).set_body_string("upstream unavailable"))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandValueApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("0301-0001").await;
        assert!(matches!(result, Err(LandRegistryError::Internal { .. })));

        let entries = billing_log.get_entries_for("0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "land_value");
        assert!((entries[0].cost() - 0.0).abs() < f64::EPSILON);
    }
}
