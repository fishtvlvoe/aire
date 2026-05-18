use crate::land_registry::apis::{
    post_json_with_key, record_failure, record_success, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::billing_log::BillingLog;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "co_owners";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CoOwner {
    pub name: String,
    pub share: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CoOwnersData {
    pub owners: Vec<CoOwner>,
}

pub struct CoOwnersEndpoint;

impl LandRegistryEndpoint<CoOwnersData> for CoOwnersEndpoint {
    fn endpoint_path() -> &'static str {
        "/LandOwnership/1.0/QueryByLimit"
    }

    fn parse_response(json: Value) -> Result<CoOwnersData, LandRegistryError> {
        let status = json.get("STATUS").and_then(|s| s.as_u64());
        if status != Some(1) {
            return Err(LandRegistryError::Internal {
                message: "COP API returned non-success STATUS".to_string(),
            });
        }

        let rows = json
            .get("RESPONSE")
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
            .and_then(|entry| entry.get("LANDOWNERSHIP"))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();

        let owners = rows
            .iter()
            .map(|row| {
                let name = row
                    .get("OWNER")
                    .and_then(|o| o.get("LNAME"))
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string();
                let numerator = row.get("NUMERATOR").and_then(Value::as_str);
                let denominator = row.get("DENOMINATOR").and_then(Value::as_str);
                let share = match (numerator, denominator) {
                    (Some(n), Some(d)) if !n.is_empty() && !d.is_empty() => {
                        format!("{n}/{d}")
                    }
                    _ => String::new(),
                };
                CoOwner { name, share }
            })
            .collect();

        Ok(CoOwnersData { owners })
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![FieldMapping {
            target_field: "co_owners".to_string(),
            json_path: "$.data[*]".to_string(),
        }]
    }
}

#[derive(Clone)]
pub struct CoOwnersApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    billing_log: BillingLog,
    key_provider: Arc<P>,
    unit_cost: f64,
}

impl<P: ApiKeyProvider> CoOwnersApi<P> {
    pub fn new(base_url: impl Into<String>, billing_log: BillingLog, key_provider: Arc<P>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            billing_log,
            key_provider,
            unit_cost: 10.0,
        }
    }

    pub async fn fetch(&self, parcel_id: &str) -> Result<CoOwnersData, LandRegistryError> {
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
            CoOwnersEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await;

        match response {
            Ok((_status, json)) => {
                let parsed = CoOwnersEndpoint::parse_response(json);
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
    use super::CoOwnersApi;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn parses_multiple_co_owners() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/LandOwnership/1.0/QueryByLimit"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"LANDOWNERSHIP": [
                    {"NUMERATOR": "1", "DENOMINATOR": "2", "OWNER": {"LNAME": "王小明"}},
                    {"NUMERATOR": "1", "DENOMINATOR": "2", "OWNER": {"LNAME": "王小美"}}
                ]}]
            })))
            .mount(&server)
            .await;

        let billing_log = BillingLog::new_in_memory();
        let api = CoOwnersApi::new(
            server.uri(),
            billing_log.clone(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        );

        let result = api.fetch("D-0200-00010000").await.unwrap();
        assert_eq!(result.owners.len(), 2);
        assert_eq!(result.owners[0].name, "王小明");
        assert_eq!(result.owners[0].share, "1/2");
        assert_eq!(result.owners[1].name, "王小美");

        let entries = billing_log.get_entries_for("D-0200-00010000");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].api_id(), "co_owners");
        assert!((entries[0].cost() - 10.0).abs() < f64::EPSILON);
    }
}
