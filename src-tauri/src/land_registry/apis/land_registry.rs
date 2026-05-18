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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub zoning: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub announced_value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assessed_value: Option<String>,
}

pub struct LandRegistryEndpointImpl;

impl LandRegistryEndpoint<LandRegistryData> for LandRegistryEndpointImpl {
    fn endpoint_path() -> &'static str {
        "/LandDescription/1.0/QueryByLandNo"
    }

    fn parse_response(json: Value) -> Result<LandRegistryData, LandRegistryError> {
        // COP API format: {"STATUS": 1, "RESPONSE": [{"LANDREG": {...}}]}
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

        let area_str = landreg.get("AREA").and_then(Value::as_str).unwrap_or("0");
        let land_area = area_str.parse::<f64>().unwrap_or(0.0);
        let zoning = landreg.get("ZONING").and_then(Value::as_str).map(|s| s.to_string());
        let announced_value = landreg
            .get("ALVALUE")
            .and_then(Value::as_str)
            .map(|s| s.to_string());
        let assessed_value = landreg
            .get("ALPRICE")
            .and_then(Value::as_str)
            .map(|s| s.to_string());

        Ok(LandRegistryData {
            land_area,
            land_purpose: zoning.clone().unwrap_or_default(),
            owner_name: String::new(),
            zoning,
            announced_value,
            assessed_value,
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
            .and(path("/LandDescription/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{
                    "LANDREG": {
                        "AREA": "120",
                        "ZONING": "住宅區",
                        "ALVALUE": "100",
                        "ALPRICE": "50"
                    }
                }]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = LandRegistryApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert!((result.land_area - 120.0).abs() < f64::EPSILON);
        assert_eq!(result.land_purpose, "住宅區");
        assert_eq!(result.owner_name, "");
        assert_eq!(result.zoning, Some("住宅區".to_string()));
        assert_eq!(result.announced_value, Some("100".to_string()));
        assert_eq!(result.assessed_value, Some("50".to_string()));

        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "land_registry");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
