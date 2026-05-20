use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "mortgages";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Mortgage {
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
    pub claim_right_type: String,
    pub claim_denominator: String,
    pub claim_numerator: String,
    pub duration_type: String,
    pub start_date: String,
    pub end_date: String,
    pub payoff_date_type: String,
    pub payoff_date_note: String,
    pub interest_note: String,
    pub delayed_interest_note: String,
    pub penalty_note: String,
    pub claim_scope_note: String,
    pub claim_confirm_date: String,
    pub other_guarantee_scope: String,
    pub collateral_land_numbers: Vec<String>,
    pub collateral_building_numbers: Vec<String>,
    pub other_notes: Vec<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MortgagesData {
    pub mortgages: Vec<Mortgage>,
    pub raw_rows: Vec<Value>,
}

pub struct MortgagesEndpoint;

impl LandRegistryEndpoint<MortgagesData> for MortgagesEndpoint {
    fn endpoint_path() -> &'static str {
        "/LandOtherRights/1.0/QueryByLimit"
    }

    fn parse_response(json: Value) -> Result<MortgagesData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        // STATUS=0 means no records for this parcel — return empty list (not an error)
        if status != Some(1) {
            return Ok(MortgagesData { mortgages: vec![], raw_rows: vec![] });
        }

        let rows = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .and_then(|entry| entry.get("LANDOTHERIGHTS"))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();

        let mortgages = rows
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
                                    if let Some(s) = item.as_str() {
                                        Some(s.to_string())
                                    } else {
                                        let sec = item.get("SEC").and_then(Value::as_str).unwrap_or_default();
                                        let no = item.get("NO").and_then(Value::as_str).unwrap_or_default();
                                        (!sec.is_empty() || !no.is_empty()).then(|| format!("{sec}-{no}"))
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default()
                };
                Mortgage {
                    creditor: row
                        .get("RIGHTPERSON")
                        .or_else(|| row.get("LNAME"))
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                    amount: row
                        .get("SETTING")
                        .or_else(|| row.get("CCP_RV"))
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
                    claim_right_type: str_field("CLAIMRIGHT"),
                    claim_denominator: str_field("CRDENOMINATOR"),
                    claim_numerator: str_field("CRNUMERATOR"),
                    duration_type: str_field("DURATIONTYPE"),
                    start_date: str_field("STARTDATE"),
                    end_date: str_field("ENDDATE"),
                    payoff_date_type: str_field("PODT"),
                    payoff_date_note: str_field("PODD"),
                    interest_note: str_field("ID_LRD"),
                    delayed_interest_note: str_field("DID"),
                    penalty_note: str_field("PD"),
                    claim_scope_note: str_field("CCCONTENT"),
                    claim_confirm_date: str_field("CCSDD"),
                    other_guarantee_scope: str_field("OGSAC"),
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

        Ok(MortgagesData { mortgages, raw_rows: rows })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![FieldMapping {
            target_field: "mortgages".to_string(),
            json_path: "$.data[*]".to_string(),
        }]
    }
}

#[derive(Clone)]
pub struct MortgagesApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> MortgagesApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<MortgagesData, LandRegistryError> {
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
            MortgagesEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = MortgagesEndpoint::parse_response(json);
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
    use super::MortgagesApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_mortgages_and_records_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/LandOtherRights/1.0/QueryByLimit"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"LANDOTHERIGHTS": [{"RIGHTPERSON": "台灣銀行", "SETTING": "1000000"}]}]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = MortgagesApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("D-0200-00010000").await.unwrap();
        assert_eq!(result.mortgages.len(), 1);
        assert_eq!(result.mortgages[0].creditor, "台灣銀行");
        assert!((result.mortgages[0].amount - 1000000.0).abs() < f64::EPSILON);
        assert_eq!(result.raw_rows.len(), 1);

        let entries = billing_log.get_entries_for("D-0200-00010000");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "mortgages");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }

    #[tokio::test]
    async fn status_zero_returns_empty_list_not_error() {
        // COP returns STATUS=0 when parcel has no other rights records
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/LandOtherRights/1.0/QueryByLimit"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 0,
                "MESSAGE": "取得服務資訊失敗"
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = MortgagesApi::new(
            server.uri(),
            billing_log,
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("D-0200-00010000").await.unwrap();
        assert_eq!(result.mortgages.len(), 0);
    }
}
