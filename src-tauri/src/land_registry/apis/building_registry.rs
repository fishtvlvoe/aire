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
        "/land/parcel/building-registry"
    }

    fn parse_response(json: Value) -> Result<BuildingRegistryData, LandRegistryError> {
        let root = json.get("data").unwrap_or(&json);
        let building_area = root.get("building_area").and_then(Value::as_f64).ok_or(
            LandRegistryError::Internal {
                message: "missing building_area".to_string(),
            },
        )?;
        let building_purpose = root
            .get("building_purpose")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        let construction_date = root
            .get("construction_date")
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
        let payload = serde_json::json!({ "parcel_id": parcel_id });

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
            .and(path("/land/parcel/building-registry"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "data": {
                    "building_area": 52.5,
                    "building_purpose": "住家用",
                    "construction_date": "2001-09-01"
                }
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = BuildingRegistryApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("0301-0001").await.unwrap();
        assert!((result.building_area - 52.5).abs() < f64::EPSILON);
        assert_eq!(result.building_purpose, "住家用");
        assert_eq!(result.construction_date, "2001-09-01");

        let entries = billing_log.get_entries_for("0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "building_registry");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
