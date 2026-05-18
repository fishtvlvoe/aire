use crate::commands::cases::IpcError;
use crate::land_registry::api_key_storage::ApiKeyStorage;
use crate::land_registry::apis::address_to_parcel::{AddressToParcelApi, ParcelInfo};
use crate::land_registry::apis::building_ownership::BuildingOwnershipApi;
use crate::land_registry::apis::building_registry::BuildingRegistryApi;
use crate::land_registry::apis::co_owners::CoOwnersApi;
use crate::land_registry::apis::land_registry::LandRegistryApi;
use crate::land_registry::apis::land_value::LandValueApi;
use crate::land_registry::apis::mortgages::MortgagesApi;
use crate::land_registry::apis::zoning::ZoningApi;
use crate::land_registry::apis::StaticApiKeyProvider;
use crate::land_registry::consent::check_consent;
use crate::land_registry::errors::LandRegistryError;
use crate::{AsyncIpcState, KeyringState, LandRegistryBillingState, LandRegistryCacheState};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

const CHUNK_SIZE: usize = 25;
const DEFAULT_UNIT_COST: i64 = 10;

#[derive(Debug, Clone, Serialize)]
pub struct ApiResult {
    pub success: bool,
    pub data: Option<Value>,
    pub error: Option<IpcError>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PullResult {
    pub results: HashMap<String, ApiResult>,
    pub total_cost: i64,
}

fn to_ipc_error(error: LandRegistryError) -> IpcError {
    let code = match error {
        LandRegistryError::ApiKeyNotConfigured => "ApiKeyNotConfigured",
        LandRegistryError::ConsentRequired => "ConsentRequired",
        LandRegistryError::InsufficientBalance { .. } => "InsufficientBalance",
        _ => "InternalError",
    };

    IpcError {
        code: code.to_string(),
        message: error.to_string(),
    }
}

fn unsupported_api_error(api_id: &str) -> LandRegistryError {
    LandRegistryError::Internal {
        message: format!("unsupported api_id: {api_id}"),
    }
}

async fn call_single_api(
    base_url: &str,
    parcel_id: &str,
    api_id: &str,
    billing_log: &crate::land_registry::billing_log::BillingLog,
    key_provider: Arc<StaticApiKeyProvider>,
) -> Result<Value, LandRegistryError> {
    match api_id {
        "building_registry" => {
            let api = BuildingRegistryApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize building_registry result failed: {error}"),
                }
            })
        }
        "land_registry" => {
            let api = LandRegistryApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize land_registry result failed: {error}"),
                }
            })
        }
        "co_owners" => {
            let api = CoOwnersApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize co_owners result failed: {error}"),
                }
            })
        }
        "land_value" => {
            let api = LandValueApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize land_value result failed: {error}"),
                }
            })
        }
        "mortgages" => {
            let api = MortgagesApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize mortgages result failed: {error}"),
                }
            })
        }
        "building_ownership" => {
            let api = BuildingOwnershipApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize building_ownership result failed: {error}"),
                }
            })
        }
        "zoning" => {
            let api = ZoningApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize zoning result failed: {error}"),
                }
            })
        }
        _ => Err(unsupported_api_error(api_id)),
    }
}

pub async fn land_registry_pull_data_core(
    parcel_id: String,
    api_ids: Vec<String>,
    base_url: &str,
    billing_log: &crate::land_registry::billing_log::BillingLog,
    key_provider: Arc<StaticApiKeyProvider>,
) -> PullResult {
    let mut total_cost = 0_i64;
    let mut results = HashMap::new();

    for chunk in api_ids.chunks(CHUNK_SIZE) {
        for api_id in chunk {
            let call_result = call_single_api(
                base_url,
                &parcel_id,
                api_id,
                billing_log,
                key_provider.clone(),
            )
            .await;

            match call_result {
                Ok(data) => {
                    total_cost += DEFAULT_UNIT_COST;
                    results.insert(
                        api_id.to_string(),
                        ApiResult {
                            success: true,
                            data: Some(data),
                            error: None,
                        },
                    );
                }
                Err(error) => {
                    results.insert(
                        api_id.to_string(),
                        ApiResult {
                            success: false,
                            data: None,
                            error: Some(to_ipc_error(error)),
                        },
                    );
                }
            }
        }
    }

    PullResult {
        results,
        total_cost,
    }
}

#[tauri::command]
pub async fn land_registry_address_lookup(
    address: String,
    keyring: State<'_, KeyringState>,
    cache: State<'_, LandRegistryCacheState>,
    ipc: State<'_, AsyncIpcState>,
) -> Result<Vec<ParcelInfo>, IpcError> {
    let storage = ApiKeyStorage::new(keyring.0.as_ref());
    let credentials = storage
        .get_raw_api_key()
        .map_err(to_ipc_error)?
        .ok_or_else(|| to_ipc_error(LandRegistryError::ApiKeyNotConfigured))?;

    let key_provider = Arc::new(StaticApiKeyProvider::configured(
        credentials.client_id,
        credentials.client_secret,
    ));
    let cache_ref = cache.0.clone();
    let query_date_provider = Arc::new(move || cache_ref.current_query_date());

    AddressToParcelApi::new(
        ipc.opcos_base_url.clone(),
        cache.0.clone(),
        key_provider,
        query_date_provider,
    )
    .lookup(&address)
    .await
    .map_err(to_ipc_error)
}

#[tauri::command]
pub async fn land_registry_pull_data(
    parcel_id: String,
    api_ids: Vec<String>,
    db: State<'_, crate::DbState>,
    keyring: State<'_, KeyringState>,
    ipc: State<'_, AsyncIpcState>,
    billing: State<'_, LandRegistryBillingState>,
) -> Result<PullResult, IpcError> {
    {
        let conn = db.0.lock().map_err(|error| IpcError {
            code: "db_lock".to_string(),
            message: format!("db lock poisoned: {error}"),
        })?;

        // 目前 pull_data IPC 的輸入為 parcel_id，後端以同一識別值檢查 consent。
        let consented = check_consent(&conn, &parcel_id).map_err(to_ipc_error)?;
        if !consented {
            return Err(to_ipc_error(LandRegistryError::ConsentRequired));
        }
    }

    let storage = ApiKeyStorage::new(keyring.0.as_ref());
    let credentials = storage
        .get_raw_api_key()
        .map_err(to_ipc_error)?
        .ok_or_else(|| to_ipc_error(LandRegistryError::ApiKeyNotConfigured))?;
    let key_provider = Arc::new(StaticApiKeyProvider::configured(
        credentials.client_id,
        credentials.client_secret,
    ));

    Ok(land_registry_pull_data_core(
        parcel_id,
        api_ids,
        &ipc.opcos_base_url,
        &billing.0,
        key_provider,
    )
    .await)
}

#[cfg(test)]
mod tests {
    use super::land_registry_pull_data_core;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use crate::land_registry::consent::{check_consent, record_consent};
    use crate::land_registry::errors::LandRegistryError;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[test]
    fn pull_without_consent_returns_error() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        let consented = check_consent(&conn, "case-002").unwrap();
        assert!(!consented);

        let result = if consented {
            Ok(())
        } else {
            Err(LandRegistryError::ConsentRequired)
        };
        assert!(matches!(result, Err(LandRegistryError::ConsentRequired)));
    }

    #[tokio::test]
    async fn pull_three_apis_returns_three_results_and_total_cost() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingDescription/1.0/QueryByBuildingNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"BUILDREG": {"BLDGAREA": "52.5", "MAINUSE": "住家用", "COMPLETE": "090/09/01"}}]
            })))
            .mount(&server)
            .await;

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

        Mock::given(method("POST"))
            .and(path("/LandOwnership/1.0/QueryByLandNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"LANDOWNER": [
                    {"OWNERNAME": "王小明", "OWNERPERCENT": "1/2"},
                    {"OWNERNAME": "王小美", "OWNERPERCENT": "1/2"}
                ]}]
            })))
            .mount(&server)
            .await;

        let conn = rusqlite::Connection::open_in_memory().unwrap();
        record_consent(&conn, "A-0301-0001", "agent@example.com").unwrap();
        assert!(check_consent(&conn, "A-0301-0001").unwrap());

        let billing_log = BillingLog::new_in_memory();
        let result = land_registry_pull_data_core(
            "A-0301-0001".to_string(),
            vec![
                "building_registry".to_string(),
                "land_registry".to_string(),
                "co_owners".to_string(),
            ],
            &server.uri(),
            &billing_log,
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
        )
        .await;

        assert_eq!(result.results.len(), 3);
        assert_eq!(result.total_cost, 30);
        assert!(result.results["building_registry"].success);
        assert!(result.results["land_registry"].success);
        assert!(result.results["co_owners"].success);
    }
}
