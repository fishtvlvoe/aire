use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "zoning";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ZoningData {
    pub zoning_type: String,
    pub usage_category: String,
}

pub struct ZoningEndpoint;

impl LandRegistryEndpoint<ZoningData> for ZoningEndpoint {
    fn endpoint_path() -> &'static str {
        "/land/parcel/zoning"
    }

    fn parse_response(json: Value) -> Result<ZoningData, LandRegistryError> {
        let root = json.get("data").unwrap_or(&json);
        Ok(ZoningData {
            zoning_type: root
                .get("zoning_type")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            usage_category: root
                .get("usage_category")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
        })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "zoning_type".to_string(),
                json_path: "$.data.zoning_type".to_string(),
            },
            FieldMapping {
                target_field: "usage_category".to_string(),
                json_path: "$.data.usage_category".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct ZoningApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> ZoningApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<ZoningData, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;
        let payload = serde_json::json!({ "parcel_id": parcel_id });
        let response = post_json_with_key(
            &self.http_client,
            &self.base_url,
            ZoningEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = ZoningEndpoint::parse_response(json);
                match parsed {
                    Ok(data) => {
                        let _ = record_success(&self.billing_log, parcel_id, API_ID, self.unit_cost);
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
    use super::ZoningApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_zoning_and_records_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/parcel/zoning"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "data": {
                    "zoning_type": "第三種住宅區",
                    "usage_category": "住三"
                }
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = ZoningApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("0301-0001").await.unwrap();
        assert_eq!(result.zoning_type, "第三種住宅區");
        assert_eq!(result.usage_category, "住三");

        let entries = billing_log.get_entries_for("0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "zoning");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
