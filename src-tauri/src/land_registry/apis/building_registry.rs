use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "building_registry";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BuildingRegistryData {
    pub building_area: f64,
    pub building_purpose: String,
    pub construction_date: String,
}

pub struct BuildingRegistryEndpoint;

impl LandRegistryEndpoint<BuildingRegistryData> for BuildingRegistryEndpoint {
    fn endpoint_path() -> &'static str {
        "/BuildingDescription/1.0/QueryByBuildNo"
    }

    fn parse_response(json: Value) -> Result<BuildingRegistryData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        if status != Some(1) {
            return Err(LandRegistryError::Internal {
                message: "COP API returned non-success STATUS".to_string(),
            });
        }

        // BLDGREG may be null when no building is found — return empty data instead of error
        let bldgreg = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .and_then(|entry| entry.get("BLDGREG"));

        let bldgreg = match bldgreg {
            Some(v) if !v.is_null() => v,
            _ => {
                return Ok(BuildingRegistryData {
                    building_area: 0.0,
                    building_purpose: String::new(),
                    construction_date: String::new(),
                });
            }
        };

        let building_area = bldgreg
            .get("AREA")
            .and_then(Value::as_str)
            .unwrap_or("0")
            .parse::<f64>()
            .unwrap_or(0.0);

        let building_purpose = bldgreg
            .get("PURPOSE")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let construction_date = bldgreg
            .get("COMPLETEDATE")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        Ok(BuildingRegistryData {
            building_area,
            building_purpose,
            construction_date,
        })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "building_area".to_string(),
                json_path: "$.data.building_area".to_string(),
            },
            FieldMapping {
                target_field: "building_purpose".to_string(),
                json_path: "$.data.building_purpose".to_string(),
            },
            FieldMapping {
                target_field: "construction_date".to_string(),
                json_path: "$.data.construction_date".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct BuildingRegistryApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> BuildingRegistryApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<BuildingRegistryData, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;

        let parts: Vec<&str> = parcel_id.splitn(3, '-').collect();
        let (unit, sec, no) = if parts.len() == 3 {
            (parts[0], parts[1], parts[2])
        } else {
            return Err(LandRegistryError::Internal {
                message: format!("invalid parcel_id format: {parcel_id}"),
            });
        };
        let payload = serde_json::json!([{ "unit": unit, "sec": sec, "no": no }]);

        let response = post_json_with_key(
            &self.http_client,
            &self.base_url,
            BuildingRegistryEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = BuildingRegistryEndpoint::parse_response(json);
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
    use super::BuildingRegistryApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_building_registry_and_records_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingDescription/1.0/QueryByBuildNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"BLDGREG": {"AREA": "52.5", "PURPOSE": "住家用", "COMPLETEDATE": "090/09/01"}}]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = BuildingRegistryApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert!((result.building_area - 52.5).abs() < f64::EPSILON);
        assert_eq!(result.building_purpose, "住家用");
        assert_eq!(result.construction_date, "090/09/01");

        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "building_registry");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
