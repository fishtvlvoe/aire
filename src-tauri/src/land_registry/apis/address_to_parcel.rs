use crate::land_registry::apis::{
    address_cache_parcel_id, normalize_address, post_json_with_key, require_api_key, ApiKeyProvider,
    FieldMapping, LandRegistryEndpoint,
};
use crate::land_registry::cache::LandRegistryCache;
use crate::land_registry::errors::LandRegistryError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

const API_ID: &str = "address_to_parcel";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ParcelInfo {
    pub parcel_id: String,
    pub address: String,
    pub lot_number: String,
    pub building_number: String,
}

pub struct AddressToParcelEndpoint;

impl LandRegistryEndpoint<Vec<ParcelInfo>> for AddressToParcelEndpoint {
    fn endpoint_path() -> &'static str {
        "/land/address-to-parcel"
    }

    fn parse_response(json: Value) -> Result<Vec<ParcelInfo>, LandRegistryError> {
        fn parse_entry(entry: &Value) -> Option<ParcelInfo> {
            Some(ParcelInfo {
                parcel_id: entry.get("parcel_id")?.as_str()?.to_string(),
                address: entry
                    .get("address")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
                lot_number: entry
                    .get("lot_number")
                    .or_else(|| entry.get("lotNo"))
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
                building_number: entry
                    .get("building_number")
                    .or_else(|| entry.get("buildingNo"))
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string(),
            })
        }

        let mut rows = match json {
            Value::Array(items) => items
                .iter()
                .filter_map(parse_entry)
                .collect::<Vec<ParcelInfo>>(),
            Value::Object(_) => json
                .get("results")
                .and_then(Value::as_array)
                .map(|items| items.iter().filter_map(parse_entry).collect())
                .unwrap_or_default(),
            _ => vec![],
        };

        rows.sort_by(|a, b| a.parcel_id.cmp(&b.parcel_id));
        Ok(rows)
    }

    fn field_mappings() -> Vec<FieldMapping> {
        vec![
            FieldMapping {
                target_field: "parcel_id".to_string(),
                json_path: "$.results[*].parcel_id".to_string(),
            },
            FieldMapping {
                target_field: "address".to_string(),
                json_path: "$.results[*].address".to_string(),
            },
            FieldMapping {
                target_field: "lot_number".to_string(),
                json_path: "$.results[*].lot_number".to_string(),
            },
            FieldMapping {
                target_field: "building_number".to_string(),
                json_path: "$.results[*].building_number".to_string(),
            },
        ]
    }
}

#[derive(Clone)]
pub struct AddressToParcelApi<P: ApiKeyProvider> {
    base_url: String,
    http_client: reqwest::Client,
    cache: LandRegistryCache,
    key_provider: Arc<P>,
    query_date_provider: Arc<dyn Fn() -> String + Send + Sync>,
}

impl<P: ApiKeyProvider> AddressToParcelApi<P> {
    pub fn new(
        base_url: impl Into<String>,
        cache: LandRegistryCache,
        key_provider: Arc<P>,
        query_date_provider: Arc<dyn Fn() -> String + Send + Sync>,
    ) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
            cache,
            key_provider,
            query_date_provider,
        }
    }

    pub async fn lookup(&self, address: &str) -> Result<Vec<ParcelInfo>, LandRegistryError> {
        let credentials = require_api_key(self.key_provider.as_ref())?;
        let normalized = normalize_address(address);
        let query_date = (self.query_date_provider)();

        let cache_parcel_id = address_cache_parcel_id(&normalized);
        if let Some(cached) = self.cache.get(&cache_parcel_id, API_ID, &query_date) {
            return AddressToParcelEndpoint::parse_response(cached);
        }

        let payload = serde_json::json!({"address": normalized});
        let (_, json) = post_json_with_key(
            &self.http_client,
            &self.base_url,
            AddressToParcelEndpoint::endpoint_path(),
            &credentials,
            &payload,
        )
        .await?;

        self.cache.store(&cache_parcel_id, API_ID, &query_date, &json)?;
        AddressToParcelEndpoint::parse_response(json)
    }
}

#[cfg(test)]
mod tests {
    use super::{AddressToParcelApi, ParcelInfo};
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::cache::LandRegistryCache;
    use crate::land_registry::errors::LandRegistryError;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn fixed_date() -> Arc<dyn Fn() -> String + Send + Sync> {
        Arc::new(|| "2026-05-15".to_string())
    }

    #[tokio::test]
    async fn returns_sorted_parcels_for_two_results() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/address-to-parcel"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "results": [
                    {
                        "parcel_id": "0301-0002",
                        "address": "台北市大安區和平東路一段100號",
                        "lot_number": "0301",
                        "building_number": "0002"
                    },
                    {
                        "parcel_id": "0301-0001",
                        "address": "台北市大安區和平東路一段100號",
                        "lot_number": "0301",
                        "building_number": "0001"
                    }
                ]
            })))
            .mount(&server)
            .await;

        let api = AddressToParcelApi::new(
            server.uri(),
            LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            fixed_date(),
        );

        let result = api.lookup("台北市大安區和平東路一段100號").await.unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].parcel_id, "0301-0001");
        assert_eq!(result[1].parcel_id, "0301-0002");
    }

    #[tokio::test]
    async fn returns_empty_when_no_results() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/address-to-parcel"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "results": []
            })))
            .mount(&server)
            .await;

        let api = AddressToParcelApi::new(
            server.uri(),
            LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            fixed_date(),
        );

        let result: Vec<ParcelInfo> = api.lookup("不存在的地址XYZ").await.unwrap();
        assert!(result.is_empty());
    }

    #[tokio::test]
    async fn second_lookup_uses_cache_without_second_http_call() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/land/address-to-parcel"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "results": [{
                    "parcel_id": "0301-0001",
                    "address": "台北市大安區和平東路一段100號",
                    "lot_number": "0301",
                    "building_number": "0001"
                }]
            })))
            .mount(&server)
            .await;

        let api = AddressToParcelApi::new(
            server.uri(),
            LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            fixed_date(),
        );

        let _ = api.lookup("台北市大安區和平東路一段100號").await.unwrap();
        let _ = api.lookup("台北市大安區和平東路一段100號").await.unwrap();

        let requests = server.received_requests().await.unwrap();
        assert_eq!(requests.len(), 1, "second lookup should hit cache");
    }

    #[tokio::test]
    async fn missing_api_key_returns_guard_error() {
        let api = AddressToParcelApi::new(
            "https://example.test",
            LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::missing()),
            fixed_date(),
        );

        let error = api.lookup("台北市信義區").await.unwrap_err();
        assert!(matches!(error, LandRegistryError::ApiKeyNotConfigured));
    }
}
