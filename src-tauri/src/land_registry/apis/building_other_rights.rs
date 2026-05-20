use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "building_other_rights";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BuildingOtherRight {
    pub creditor: String,
    pub amount: f64,
    pub registration_order: String,
    pub receive_year: String,
    pub receive_no1: String,
    pub receive_no2: String,
    pub registration_date: String,
    pub registration_reason: String,
    pub right_type: String,
    pub subject_type: String,
    pub setting_right_type: String,
    pub setting_denominator: String,
    pub setting_numerator: String,
    pub setting_area: String,
    pub certificate_no: String,
    pub duration_type: String,
    pub start_date: String,
    pub end_date: String,
    pub claim_scope_note: String,
    pub collateral_land_numbers: Vec<String>,
    pub collateral_building_numbers: Vec<String>,
    pub other_notes: Vec<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BuildingOtherRightsData {
    pub rights: Vec<BuildingOtherRight>,
    pub raw_rows: Vec<Value>,
}

pub struct BuildingOtherRightsEndpoint;

impl LandRegistryEndpoint<BuildingOtherRightsData> for BuildingOtherRightsEndpoint {
    fn endpoint_path() -> &'static str {
        "/BuildingOtherRights/1.0/QueryByLimit"
    }

    fn parse_response(json: Value) -> Result<BuildingOtherRightsData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        if status != Some(1) {
            return Ok(BuildingOtherRightsData { rights: vec![], raw_rows: vec![] });
        }

        let rows = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .and_then(|entry| {
                entry
                    .get("BLDGOTHERIGHTS")
                    .or_else(|| entry.get("BUILDINGOTHERIGHTS"))
                    .or_else(|| entry.get("BUILDOTHERIGHTS"))
            })
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();

        let rights = rows
            .iter()
            .map(|row| {
                let str_field = |key: &str| {
                    row.get(key)
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string()
                };
                let list_numbers = |key: &str| {
                    row.get(key)
                        .and_then(Value::as_array)
                        .map(|items| {
                            items
                                .iter()
                                .filter_map(|item| {
                                    let sec = item.get("SEC").and_then(Value::as_str).unwrap_or_default();
                                    let no = item.get("NO").and_then(Value::as_str).unwrap_or_default();
                                    (!sec.is_empty() || !no.is_empty()).then(|| format!("{sec}-{no}"))
                                })
                                .collect()
                        })
                        .unwrap_or_default()
                };

                BuildingOtherRight {
                    creditor: row
                        .get("LNAME")
                        .or_else(|| row.get("RIGHTPERSON"))
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                    amount: row
                        .get("CCP_RV")
                        .and_then(Value::as_str)
                        .unwrap_or("0")
                        .parse::<f64>()
                        .unwrap_or(0.0),
                    registration_order: str_field("ORNO"),
                    receive_year: str_field("RECEIVEYEAR"),
                    receive_no1: str_field("RECEIVENO1"),
                    receive_no2: str_field("RECEIVENO2"),
                    registration_date: str_field("RDATE"),
                    registration_reason: str_field("REASON"),
                    right_type: str_field("RIGHTTYPE"),
                    subject_type: str_field("SUBJECTTYPE"),
                    setting_right_type: str_field("SETRIGHT"),
                    setting_denominator: str_field("SRDENOMINATOR"),
                    setting_numerator: str_field("SRNUMERATOR"),
                    setting_area: str_field("AREA"),
                    certificate_no: str_field("CERTIFICATENO"),
                    duration_type: str_field("DURATIONTYPE"),
                    start_date: str_field("STARTDATE"),
                    end_date: str_field("ENDDATE"),
                    claim_scope_note: str_field("CCCONTENT"),
                    collateral_land_numbers: list_numbers("COLAND"),
                    collateral_building_numbers: list_numbers("COBUILD"),
                    other_notes: row
                        .get("NOTE")
                        .or_else(|| row.get("OTHER"))
                        .and_then(Value::as_array)
                        .cloned()
                        .unwrap_or_default(),
                }
            })
            .collect();

        Ok(BuildingOtherRightsData { rights, raw_rows: rows })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![FieldMapping {
            target_field: "building_other_rights".to_string(),
            json_path: "$.data[*]".to_string(),
        }]
    }
}

#[derive(Clone)]
pub struct BuildingOtherRightsApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> BuildingOtherRightsApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<BuildingOtherRightsData, LandRegistryError> {
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
            BuildingOtherRightsEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = BuildingOtherRightsEndpoint::parse_response(json);
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
    use super::BuildingOtherRightsApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_building_other_rights_and_preserves_raw_rows() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingOtherRights/1.0/QueryByLimit"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"BLDGOTHERIGHTS": [{
                    "ORNO": "0001",
                    "RIGHTTYPE": "抵押權",
                    "LNAME": "台灣銀行",
                    "CCP_RV": "1000000",
                    "COBUILD": [{"SEC": "0001", "NO": "0002"}]
                }]}]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = BuildingOtherRightsApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("A-0301-0001").await.unwrap();
        assert_eq!(result.rights.len(), 1);
        assert_eq!(result.rights[0].creditor, "台灣銀行");
        assert_eq!(result.rights[0].collateral_building_numbers, vec!["0001-0002"]);
        assert_eq!(result.raw_rows.len(), 1);
        assert_eq!(billing_log.get_entries_for("A-0301-0001").len(), 1);
    }
}
