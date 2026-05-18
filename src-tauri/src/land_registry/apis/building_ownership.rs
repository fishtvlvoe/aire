use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "building_ownership";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BuildingOwnershipData {
    pub owner_name: String,
    pub certificate_no: String,
    pub issue_date: String,
}

pub struct BuildingOwnershipEndpoint;

impl LandRegistryEndpoint<BuildingOwnershipData> for BuildingOwnershipEndpoint {
    fn endpoint_path() -> &'static str {
        "/BuildingOwnership/1.0/QueryByLimit"
    }

    fn parse_response(json: Value) -> Result<BuildingOwnershipData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        if status != Some(1) {
            return Err(LandRegistryError::Internal {
                message: "COP API returned non-success STATUS".to_string(),
            });
        }

        // BLDGOWNERSHIP may be null or empty — return empty data instead of error
        let first = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .and_then(|entry| entry.get("BLDGOWNERSHIP"))
            .and_then(Value::as_array)
            .and_then(|arr| arr.first());

        let record = match first {
            Some(v) => v,
            None => {
                return Ok(BuildingOwnershipData {
                    owner_name: String::new(),
                    certificate_no: String::new(),
                    issue_date: String::new(),
                });
            }
        };

        let owner_name = record
            .get("OWNER")
            .and_then(|o| o.get("LNAME"))
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let certificate_no = record
            .get("OWRNO")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        let issue_date = record
            .get("RDATE")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();

        Ok(BuildingOwnershipData {
            owner_name,
            certificate_no,
            issue_date,
        })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "owner_name".to_string(),
                json_path: "$.RESPONSE[0].BUILDOWNER[0].OWNERNAME".to_string(),
            },
            FieldMapping {
                target_field: "certificate_no".to_string(),
                json_path: "$.RESPONSE[0].BUILDOWNER[0].REGNO".to_string(),
            },
            FieldMapping {
                target_field: "issue_date".to_string(),
                json_path: "$.RESPONSE[0].BUILDOWNER[0].REGDATE".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct BuildingOwnershipApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> BuildingOwnershipApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<BuildingOwnershipData, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;
        let parts: Vec<&str> = parcel_id.splitn(3, '-').collect();
        let (unit, sec, no) = if parts.len() == 3 {
            (parts[0], parts[1], parts[2])
        } else {
            return Err(LandRegistryError::Internal {
                message: format!("invalid parcel_id format: {parcel_id}"),
            });
        };
        let payload = serde_json::json!([{ "unit": unit, "sec": sec, "no": no, "offset": 1, "limit": 100 }]);
        let response = post_json_with_key(
            &self.http_client,
            &self.base_url,
            BuildingOwnershipEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = BuildingOwnershipEndpoint::parse_response(json);
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
    use super::BuildingOwnershipApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_building_ownership_and_records_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingOwnership/1.0/QueryByLimit"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"BLDGOWNERSHIP": [{"OWRNO": "TC001", "RDATE": "090/01/01", "OWNER": {"LNAME": "陳大明"}}]}]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = BuildingOwnershipApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert_eq!(result.owner_name, "陳大明");
        assert_eq!(result.certificate_no, "TC001");
        assert_eq!(result.issue_date, "090/01/01");

        let entries = billing_log.get_entries_for("A-0301-0001");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "building_ownership");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
