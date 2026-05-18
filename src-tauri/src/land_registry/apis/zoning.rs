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
        "/LandDescription/1.0/QueryByLandNo"
    }

    fn parse_response(json: Value) -> Result<ZoningData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        if status != Some(1) {
            return Err(LandRegistryError::Internal {
                message: "COP API returned non-success STATUS".to_string(),
            });
        }

        let first_entry = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .ok_or_else(|| LandRegistryError::Internal {
                message: "COP API RESPONSE array is empty".to_string(),
            })?;

        let landreg = first_entry
            .get("LANDREG")
            .ok_or_else(|| LandRegistryError::Internal {
                message: "COP API missing LANDREG".to_string(),
            })?;

        let zoning = landreg
            .get("ZONING")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        Ok(ZoningData {
            zoning_type: zoning.clone(),
            usage_category: zoning,
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

    pub async fn fetch(&self, parcel_id: &str) -> Result<Option<ZoningData>, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;

        let parts: Vec<&str> = parcel_id.splitn(3, '-').collect();
        let (unit, sec, no) = if parts.len() == 3 {
            (parts[0], parts[1], parts[2])
        } else {
            return Err(LandRegistryError::Internal {
                message: format!("invalid parcel_id format: {parcel_id}"),
            });
        };
        let payload = serde_json::json!([{ "UNIT": unit, "SEC": sec, "NO": no }]);

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
                let landreg = json
                    .get("RESPONSE")
                    .and_then(|r| r.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|e| e.get("LANDREG"));

                let zoning_str = landreg
                    .and_then(|l| l.get("ZONING"))
                    .and_then(Value::as_str);

                match zoning_str {
                    None => {
                        let _ = record_success(
                            &self.billing_log,
                            parcel_id,
                            API_ID,
                            self.unit_cost,
                        );
                        Ok(None)
                    }
                    Some(z) => {
                        let _ = record_success(
                            &self.billing_log,
                            parcel_id,
                            API_ID,
                            self.unit_cost,
                        );
                        Ok(Some(ZoningData {
                            zoning_type: z.to_string(),
                            usage_category: z.to_string(),
                        }))
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
            .and(path("/LandDescription/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{
                    "LANDREG": {
                        "AREA": "120",
                        "ZONING": "第三種住宅區",
                        "ALVALUE": "100",
                        "ALPRICE": "50"
                    }
                }]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = ZoningApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap().unwrap();
        assert_eq!(result.zoning_type, "第三種住宅區");
        assert_eq!(result.usage_category, "第三種住宅區");

        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "zoning");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }

    #[tokio::test]
    async fn returns_none_when_zoning_is_null() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/LandDescription/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{
                    "LANDREG": {
                        "AREA": "120",
                        "ALVALUE": "100",
                        "ALPRICE": "50"
                    }
                }]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = ZoningApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert!(result.is_none());
    }
}
