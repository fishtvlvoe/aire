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
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MortgagesData {
    pub mortgages: Vec<Mortgage>,
}

pub struct MortgagesEndpoint;

impl LandRegistryEndpoint<MortgagesData> for MortgagesEndpoint {
    fn endpoint_path() -> &'static str {
        "/LandOtherRight/1.0/QueryByLimit"
    }

    fn parse_response(json: Value) -> Result<MortgagesData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        // STATUS=0 means no records for this parcel — return empty list (not an error)
        if status != Some(1) {
            return Ok(MortgagesData { mortgages: vec![] });
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
            .map(|row| Mortgage {
                creditor: row
                    .get("RIGHTPERSON")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
                amount: row
                    .get("SETTING")
                    .and_then(Value::as_str)
                    .unwrap_or("0")
                    .parse::<f64>()
                    .unwrap_or(0.0),
            })
            .collect();

        Ok(MortgagesData { mortgages })
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
            .and(path("/LandOtherRight/1.0/QueryByLimit"))
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
            .and(path("/LandOtherRight/1.0/QueryByLimit"))
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
