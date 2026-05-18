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
        "/LandDescription/1.0/QueryByLandNo"
    }

    fn parse_response(json: Value) -> Result<LandValueData, LandRegistryError> {
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

        let announced_land_value = landreg
            .get("ALVALUE")
            .and_then(Value::as_str)
            .unwrap_or("0")
            .parse::<f64>()
            .unwrap_or(0.0);

        let assessed_land_value = landreg
            .get("ALPRICE")
            .and_then(Value::as_str)
            .unwrap_or("0")
            .parse::<f64>()
            .unwrap_or(0.0);

        Ok(LandValueData {
            announced_land_value,
            assessed_land_value,
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
            .and(path("/LandDescription/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{
                    "LANDREG": {
                        "AREA": "120",
                        "ZONING": "住宅區",
                        "ALVALUE": "1000",
                        "ALPRICE": "800"
                    }
                }]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandValueApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert!((result.announced_land_value - 1000.0).abs() < f64::EPSILON);
        assert!((result.assessed_land_value - 800.0).abs() < f64::EPSILON);
        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }

    #[tokio::test]
    async fn failed_call_records_zero_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/LandDescription/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(503).set_body_string("upstream unavailable"))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandValueApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await;
        assert!(matches!(result, Err(LandRegistryError::Internal { .. })));

        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "land_value");
        assert!((entries[0].cost() - 0.0).abs() < f64::EPSILON);
    }
}
