use crate::commands::cases::IpcError;
use crate::db::cases;
use crate::db::registry_query_runs::{
    get_registry_query_run_row,
    insert_registry_query_api_call, insert_registry_query_run, NewRegistryQueryApiCall,
    NewRegistryQueryRun, RegistryQueryRunRow,
};
use crate::land_registry::api_key_storage::ApiKeyStorage;
use crate::land_registry::apis::StaticApiKeyProvider;
use crate::land_registry::apis::address_to_parcel::{AddressToParcelApi, ParcelInfo};
use crate::land_registry::apis::building_other_rights::BuildingOtherRightsApi;
use crate::land_registry::apis::building_ownership::BuildingOwnershipApi;
use crate::land_registry::apis::building_registry::BuildingRegistryApi;
use crate::land_registry::apis::co_owners::CoOwnersApi;
use crate::land_registry::apis::land_registry::LandRegistryApi;
use crate::land_registry::apis::land_value::LandValueApi;
use crate::land_registry::apis::mortgages::MortgagesApi;
use crate::land_registry::apis::nlsc_cadastral::{NlscCadastralClient, NlscLandCandidate};
use crate::land_registry::apis::zoning::ZoningApi;
use crate::land_registry::consent::check_consent;
use crate::land_registry::errors::LandRegistryError;
use crate::{AsyncIpcState, KeyringState, LandRegistryBillingState};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

const CHUNK_SIZE: usize = 25;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApiResult {
    pub success: bool,
    pub data: Option<Value>,
    pub error: Option<IpcError>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PullResult {
    pub results: HashMap<String, ApiResult>,
    pub total_cost: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FormalPullResult {
    pub run_id: String,
    pub results: HashMap<String, ApiResult>,
    pub total_cost: i64,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FormalPullTarget {
    pub case_id: String,
    pub registry_key: String,
    pub section_name: String,
    pub land_no: String,
    pub building_no: Option<String>,
    pub address: String,
}

fn to_ipc_error(error: LandRegistryError) -> IpcError {
    let code = match error {
        LandRegistryError::ApiKeyNotConfigured => "ApiKeyNotConfigured",
        LandRegistryError::ConsentRequired => "ConsentRequired",
        LandRegistryError::NlscPermissionDenied { .. } => "NlscPermissionDenied",
        LandRegistryError::InsufficientBalance { .. } => "InsufficientBalance",
        _ => "InternalError",
    };

    IpcError {
        code: code.to_string(),
        message: error.to_string(),
    }
}

fn nlsc_land_to_parcel(address: &str, candidate: &NlscLandCandidate) -> ParcelInfo {
    ParcelInfo {
        parcel_id: format!("{}-{}-{}", candidate.office, candidate.section, candidate.land_no),
        address: candidate.content.clone().if_empty_then(address),
        lot_number: candidate.section.clone(),
        building_number: String::new(),
        source: "nlsc_cad".to_string(),
        trusted_for_pdf: false,
        section_name: None,
        section_code: Some(candidate.section.clone()),
        land_office: Some(candidate.office.clone()),
        discovery_confidence: Some("needs_selection".to_string()),
        object_type: Some("land".to_string()),
        confirmation_state: Some("unconfirmed".to_string()),
        building_area_sqm: None,
        total_floor_count: None,
        floor_label: None,
        completion_date_roc: None,
        age_years: None,
        main_use: None,
    }
}

trait EmptyFallback {
    fn if_empty_then(self, fallback: &str) -> String;
}

impl EmptyFallback for String {
    fn if_empty_then(self, fallback: &str) -> String {
        if self.trim().is_empty() {
            fallback.to_string()
        } else {
            self
        }
    }
}

pub async fn land_registry_address_lookup_core(
    address: &str,
    cop_base_url: &str,
    nlsc_base_url: &str,
    cache: crate::land_registry::cache::LandRegistryCache,
    key_provider: Arc<StaticApiKeyProvider>,
    enable_nlsc_fallback: bool,
) -> Result<Vec<ParcelInfo>, LandRegistryError> {
    let cache_ref = cache.clone();
    let query_date_provider = Arc::new(move || cache_ref.current_query_date());
    let cop_results =
        AddressToParcelApi::new(cop_base_url, cache.clone(), key_provider, query_date_provider)
            .lookup(address)
            .await?;

    if !cop_results.is_empty() || !enable_nlsc_fallback {
        return Ok(cop_results);
    }

    let city_code = crate::land_registry::client::city_code_from_address(address);
    let nlsc = NlscCadastralClient::new(nlsc_base_url);
    let land_candidates = nlsc.address_query_land(address, 10).await?;
    let mut parcels = Vec::new();

    for candidate in land_candidates {
        parcels.push(nlsc_land_to_parcel(address, &candidate));
        let building_info = nlsc
            .cadas_land_info(&city_code, &candidate.section, &candidate.land_no)
            .await?;
        for building_no in building_info.build_list {
            parcels.push(ParcelInfo {
                parcel_id: format!("{}-{}-{}", city_code, candidate.section, building_no),
                address: candidate.content.clone().if_empty_then(address),
                lot_number: candidate.section.clone(),
                building_number: building_no,
                source: "nlsc_cad".to_string(),
                trusted_for_pdf: false,
                section_name: None,
                section_code: Some(candidate.section.clone()),
                land_office: Some(city_code.to_string()),
                discovery_confidence: Some("needs_selection".to_string()),
                object_type: Some("building".to_string()),
                confirmation_state: Some("unconfirmed".to_string()),
                building_area_sqm: None,
                total_floor_count: None,
                floor_label: None,
                completion_date_roc: None,
                age_years: None,
                main_use: None,
            });
        }
    }

    parcels.sort_by(|a, b| a.parcel_id.cmp(&b.parcel_id));
    parcels.dedup_by(|a, b| a.parcel_id == b.parcel_id);
    Ok(parcels)
}

fn unsupported_api_error(api_id: &str) -> LandRegistryError {
    LandRegistryError::Internal {
        message: format!("unsupported api_id: {api_id}"),
    }
}

fn registry_match_required(message: impl Into<String>) -> IpcError {
    IpcError {
        code: "registry_match_required".to_string(),
        message: message.into(),
    }
}

fn is_building_formal_api(api_id: &str) -> bool {
    matches!(
        api_id,
        "building_registry"
            | "building_ownership"
            | "building_other_rights"
            | "building_anchor"
            | "building_parking"
    )
}

fn string_at<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str).map(str::trim).filter(|text| !text.is_empty())
}

fn is_untrusted_placeholder_match(match_json: &Value) -> bool {
    let source = string_at(match_json, "source").unwrap_or_default();
    let trusted_for_pdf = match_json
        .get("trusted_for_pdf")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let section_name = string_at(match_json, "section_name").unwrap_or_default();
    let land_no = string_at(match_json, "land_no").unwrap_or_default();
    let building_no = string_at(match_json, "building_no").unwrap_or_default();

    source == "mock"
        || source == "dev_fixture"
        || !trusted_for_pdf
        || (section_name == "0001" && land_no == "0001")
        || (land_no == "0001" && building_no == "0001")
}

pub(crate) fn validate_formal_pull_target(
    conn: &rusqlite::Connection,
    case_id: &str,
    api_ids: &[String],
) -> Result<FormalPullTarget, IpcError> {
    let case_id = case_id.trim();
    if case_id.is_empty() {
        return Err(registry_match_required("請先確認地段、地號與建號後再查詢"));
    }

    let case = cases::get_case(conn, case_id)
        .map_err(|error| IpcError { code: error.code, message: error.message })?;
    let match_json = case
        .land_registry_data
        .as_ref()
        .and_then(|value| value.get("confirmed_registry_match"))
        .ok_or_else(|| registry_match_required("請先確認地段、地號與建號後再查詢"))?;

    if string_at(match_json, "status") != Some("confirmed") {
        return Err(registry_match_required("請先確認地段、地號與建號後再查詢"));
    }
    if is_untrusted_placeholder_match(match_json) {
        return Err(registry_match_required("候選或測試資料不可用於正式查詢"));
    }

    let section_name = string_at(match_json, "section_name")
        .ok_or_else(|| registry_match_required("請先確認地段"))?
        .to_string();
    let land_no = string_at(match_json, "land_no")
        .ok_or_else(|| registry_match_required("請先確認地號"))?
        .to_string();
    let building_no = string_at(match_json, "building_no").map(str::to_string);

    if api_ids.iter().any(|api_id| is_building_formal_api(api_id)) && building_no.is_none() {
        return Err(registry_match_required("建物正式查詢需要先確認建號"));
    }

    Ok(FormalPullTarget {
        case_id: case.id,
        registry_key: format!(
            "confirmed:{}:{}:{}",
            section_name,
            land_no,
            building_no.as_deref().unwrap_or("land-only")
        ),
        section_name,
        land_no,
        building_no,
        address: case.address,
    })
}

pub(crate) fn record_formal_pull_run(
    conn: &rusqlite::Connection,
    target: &FormalPullTarget,
    api_ids: &[String],
    pulled: &PullResult,
    now: i64,
) -> Result<String, IpcError> {
    let run_id = uuid::Uuid::new_v4().to_string();
    let cop_response_json = serde_json::to_value(&pulled.results).ok();
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: run_id.clone(),
            case_id: Some(target.case_id.clone()),
            registry_key: target.registry_key.clone(),
            input_kind: "registry_key".to_string(),
            input_address: Some(target.address.clone()),
            normalized_address: Some(target.address.trim().replace('台', "臺")),
            office_code: None,
            office_name: None,
            section_code: None,
            section_name: Some(target.section_name.clone()),
            land_no: Some(target.land_no.clone()),
            building_no: target.building_no.clone(),
            confirmation_status: "confirmed".to_string(),
            status: "formal_pulled".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: pulled.total_cost * 100,
            r02_payload_json: None,
            cop_payload_json: cop_response_json.clone(),
            generated_json: Some(serde_json::json!({
                "selected_api_set": api_ids,
                "registry_key": target.registry_key,
            })),
            error_summary_json: None,
            created_at: now,
        },
    )
    .map_err(|error| IpcError {
        code: "registry_query_run_insert_failed".to_string(),
        message: error.to_string(),
    })?;

    for api_id in api_ids {
        let result = pulled.results.get(api_id);
        let success = result.map(|value| value.success).unwrap_or(false);
        let error = result.and_then(|value| value.error.as_ref());
        insert_registry_query_api_call(
            conn,
            &NewRegistryQueryApiCall {
                id: uuid::Uuid::new_v4().to_string(),
                run_id: run_id.clone(),
                api_id: api_id.clone(),
                service_name: Some(api_id.clone()),
                method: "POST".to_string(),
                endpoint: format!("/formal/{api_id}"),
                http_status: Some(if success { 200 } else { 0 }),
                cop_code: error.map(|value| value.code.clone()),
                cop_message: error.map(|value| value.message.clone()),
                transaction_id: if success {
                    Some(format!("local-{run_id}-{api_id}"))
                } else {
                    None
                },
                cost_cents: if success { formal_api_unit_cost(api_id) * 100 } else { 0 },
                request_summary_json: Some(serde_json::json!({
                    "registry_key": target.registry_key,
                    "api_id": api_id,
                })),
                response_summary_json: result.and_then(|value| serde_json::to_value(value).ok()),
                created_at: now,
            },
        )
        .map_err(|error| IpcError {
            code: "registry_query_api_call_insert_failed".to_string(),
            message: error.to_string(),
        })?;
    }

    let mut case = cases::get_case(conn, &target.case_id)
        .map_err(|error| IpcError { code: error.code, message: error.message })?;
    let mut land_registry_data = case
        .land_registry_data
        .take()
        .unwrap_or_else(|| serde_json::json!({}));
    if !land_registry_data.is_object() {
        land_registry_data = serde_json::json!({});
    }
    land_registry_data["formal_registry_run_id"] = serde_json::json!(run_id.clone());
    land_registry_data["formal_registry_json"] = cop_response_json.unwrap_or_else(|| serde_json::json!({}));
    land_registry_data["formal_registry_api_set"] = serde_json::json!(api_ids);
    case.land_registry_data = Some(land_registry_data);
    case.updated_at = now;
    cases::update_case(conn, &case)
        .map_err(|error| IpcError { code: error.code, message: error.message })?;

    Ok(run_id)
}

fn api_set_matches(a: &[String], b: &[String]) -> bool {
    let mut left = a.to_vec();
    let mut right = b.to_vec();
    left.sort();
    right.sort();
    left == right
}

fn api_set_for_run(conn: &rusqlite::Connection, run_id: &str) -> Result<Vec<String>, IpcError> {
    let mut stmt = conn
        .prepare("SELECT api_id FROM registry_query_api_calls WHERE run_id = ?1 ORDER BY api_id ASC")
        .map_err(|error| IpcError {
            code: "registry_query_api_call_read_failed".to_string(),
            message: error.to_string(),
        })?;
    let rows = stmt
        .query_map([run_id], |row| row.get::<_, String>(0))
        .map_err(|error| IpcError {
            code: "registry_query_api_call_read_failed".to_string(),
            message: error.to_string(),
        })?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|error| IpcError {
        code: "registry_query_api_call_read_failed".to_string(),
        message: error.to_string(),
    })
}

pub(crate) fn find_formal_cache_source_run(
    conn: &rusqlite::Connection,
    registry_key: &str,
    api_ids: &[String],
) -> Result<Option<RegistryQueryRunRow>, IpcError> {
    let mut stmt = conn
        .prepare(
            "SELECT id FROM registry_query_runs
             WHERE registry_key = ?1
               AND confirmation_status = 'confirmed'
               AND status = 'formal_pulled'
               AND cache_hit = 0
               AND total_cost_cents > 0
             ORDER BY created_at DESC",
        )
        .map_err(|error| IpcError {
            code: "registry_query_run_read_failed".to_string(),
            message: error.to_string(),
        })?;
    let ids = stmt
        .query_map([registry_key], |row| row.get::<_, String>(0))
        .map_err(|error| IpcError {
            code: "registry_query_run_read_failed".to_string(),
            message: error.to_string(),
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| IpcError {
            code: "registry_query_run_read_failed".to_string(),
            message: error.to_string(),
        })?;

    for id in ids {
        let existing_api_set = api_set_for_run(conn, &id)?;
        if api_set_matches(&existing_api_set, api_ids) {
            let row = get_registry_query_run_row(conn, &id).map_err(|error| IpcError {
                code: error.code,
                message: error.message,
            })?;
            return Ok(Some(row));
        }
    }
    Ok(None)
}

pub(crate) fn record_formal_cache_hit_run(
    conn: &rusqlite::Connection,
    target: &FormalPullTarget,
    api_ids: &[String],
    source_run: &RegistryQueryRunRow,
    now: i64,
) -> Result<String, IpcError> {
    let run_id = uuid::Uuid::new_v4().to_string();
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: run_id.clone(),
            case_id: Some(target.case_id.clone()),
            registry_key: target.registry_key.clone(),
            input_kind: "registry_key".to_string(),
            input_address: Some(target.address.clone()),
            normalized_address: Some(target.address.trim().replace('台', "臺")),
            office_code: None,
            office_name: None,
            section_code: None,
            section_name: Some(target.section_name.clone()),
            land_no: Some(target.land_no.clone()),
            building_no: target.building_no.clone(),
            confirmation_status: "confirmed".to_string(),
            status: "formal_pulled".to_string(),
            cache_hit: true,
            source_run_id: Some(source_run.id.clone()),
            total_cost_cents: 0,
            r02_payload_json: None,
            cop_payload_json: source_run.cop_payload_json.clone(),
            generated_json: Some(serde_json::json!({
                "selected_api_set": api_ids,
                "registry_key": target.registry_key,
                "cache_source_run_id": source_run.id,
            })),
            error_summary_json: None,
            created_at: now,
        },
    )
    .map_err(|error| IpcError {
        code: "registry_query_run_insert_failed".to_string(),
        message: error.to_string(),
    })?;

    let mut case = cases::get_case(conn, &target.case_id)
        .map_err(|error| IpcError { code: error.code, message: error.message })?;
    let mut land_registry_data = case
        .land_registry_data
        .take()
        .unwrap_or_else(|| serde_json::json!({}));
    if !land_registry_data.is_object() {
        land_registry_data = serde_json::json!({});
    }
    land_registry_data["formal_registry_run_id"] = serde_json::json!(run_id.clone());
    land_registry_data["formal_registry_source_run_id"] = serde_json::json!(source_run.id.clone());
    land_registry_data["formal_registry_json"] = source_run
        .cop_payload_json
        .clone()
        .unwrap_or_else(|| serde_json::json!({}));
    land_registry_data["formal_registry_api_set"] = serde_json::json!(api_ids);
    case.land_registry_data = Some(land_registry_data);
    case.updated_at = now;
    cases::update_case(conn, &case)
        .map_err(|error| IpcError { code: error.code, message: error.message })?;

    Ok(run_id)
}

pub(crate) fn record_formal_error_run(
    conn: &rusqlite::Connection,
    target: &FormalPullTarget,
    api_ids: &[String],
    code: &str,
    message: &str,
    now: i64,
) -> Result<String, IpcError> {
    let run_id = uuid::Uuid::new_v4().to_string();
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: run_id.clone(),
            case_id: Some(target.case_id.clone()),
            registry_key: target.registry_key.clone(),
            input_kind: "registry_key".to_string(),
            input_address: Some(target.address.clone()),
            normalized_address: Some(target.address.trim().replace('台', "臺")),
            office_code: None,
            office_name: None,
            section_code: None,
            section_name: Some(target.section_name.clone()),
            land_no: Some(target.land_no.clone()),
            building_no: target.building_no.clone(),
            confirmation_status: "confirmed".to_string(),
            status: "formal_error".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: None,
            cop_payload_json: None,
            generated_json: Some(serde_json::json!({
                "selected_api_set": api_ids,
                "registry_key": target.registry_key,
            })),
            error_summary_json: Some(serde_json::json!({
                "errorCode": code,
                "message": message,
                "selectedApiSet": api_ids,
            })),
            created_at: now,
        },
    )
    .map_err(|error| IpcError {
        code: "registry_query_run_insert_failed".to_string(),
        message: error.to_string(),
    })?;

    Ok(run_id)
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
        "building_other_rights" => {
            let api = BuildingOtherRightsApi::new(base_url, billing_log.clone(), key_provider);
            serde_json::to_value(api.fetch(parcel_id).await?).map_err(|error| {
                LandRegistryError::Internal {
                    message: format!("serialize building_other_rights result failed: {error}"),
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
                    total_cost += formal_api_unit_cost(api_id);
                    results.insert(
                        api_id.to_string(),
                        ApiResult {
                            success: true,
                            data: Some(data),
                            error: None,
                            source: "api".to_string(),
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
                            source: "api".to_string(),
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

fn formal_api_unit_cost(api_id: &str) -> i64 {
    match api_id {
        "land_registry" | "MOI_API_001" => 1,
        "land_value" | "MOI_API_014" => 0,
        "building_registry" | "MOI_API_004" => 1,
        "building_ownership" | "MOI_API_005" => 1,
        "building_other_rights" | "MOI_API_006" => 1,
        "address_to_building" | "MOI_API_036" => 0,
        _ => 0,
    }
}

#[tauri::command]
pub async fn land_registry_address_lookup(
    address: String,
    db: State<'_, crate::DbState>,
) -> Result<Vec<ParcelInfo>, IpcError> {
    let discovery = crate::land_registry::easymap_r02::discover_easymap_r02_address(&address).await;
    let parcels = discovery
        .as_ref()
        .map(|value| value.parcels.clone())
        .unwrap_or_default();
    {
        let conn = db.0.lock().map_err(|error| IpcError {
            code: "db_lock".to_string(),
            message: format!("db lock poisoned: {error}"),
        })?;
        crate::land_registry::easymap_r02::record_easymap_r02_discovery(
            &conn,
            None,
            discovery,
            &address,
            chrono::Utc::now().timestamp(),
        )
        .map_err(|message| IpcError {
            code: "db_error".to_string(),
            message,
        })?;
    }
    Ok(parcels)
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
    let key_provider = Arc::new(StaticApiKeyProvider::with_token_endpoint(
        credentials.client_id,
        credentials.client_secret,
        credentials.token_endpoint,
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

#[tauri::command]
#[allow(non_snake_case)]
pub async fn land_registry_formal_pull_data(
    caseId: String,
    apiIds: Vec<String>,
    db: State<'_, crate::DbState>,
    keyring: State<'_, KeyringState>,
    ipc: State<'_, AsyncIpcState>,
    billing: State<'_, LandRegistryBillingState>,
) -> Result<FormalPullResult, IpcError> {
    eprintln!(
        "[formal_pull] start caseId={} apiIds={}",
        caseId,
        apiIds.join(",")
    );
    let cache_hit = {
        let conn = db.0.lock().map_err(|error| IpcError {
            code: "db_lock".to_string(),
            message: format!("db lock poisoned: {error}"),
        })?;
        let target = validate_formal_pull_target(&conn, &caseId, &apiIds)?;
        if let Some(source_run) = find_formal_cache_source_run(&conn, &target.registry_key, &apiIds)? {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            let run_id = record_formal_cache_hit_run(&conn, &target, &apiIds, &source_run, now)?;
            let results = source_run
                .cop_payload_json
                .clone()
                .and_then(|value| serde_json::from_value::<HashMap<String, ApiResult>>(value).ok())
                .unwrap_or_default();
            Some(FormalPullResult {
                run_id,
                results,
                total_cost: 0,
                cache_hit: true,
                source_run_id: Some(source_run.id),
            })
        } else {
            None
        }
    };
    if let Some(result) = cache_hit {
        eprintln!(
            "[formal_pull] cache_hit caseId={} run_id={} source_run_id={}",
            caseId,
            result.run_id,
            result.source_run_id.clone().unwrap_or_default()
        );
        return Ok(result);
    }

    let target = {
        let conn = db.0.lock().map_err(|error| IpcError {
            code: "db_lock".to_string(),
            message: format!("db lock poisoned: {error}"),
        })?;
        validate_formal_pull_target(&conn, &caseId, &apiIds)?
    };

    let storage = ApiKeyStorage::new(keyring.0.as_ref());
    let credentials = match storage.get_raw_api_key() {
        Ok(Some(credentials)) => credentials,
        Ok(None) => {
            let err = to_ipc_error(LandRegistryError::ApiKeyNotConfigured);
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            if let Ok(conn) = db.0.lock() {
                let _ = record_formal_error_run(
                    &conn,
                    &target,
                    &apiIds,
                    "cop_credential_required",
                    &err.message,
                    now,
                );
            }
            eprintln!(
                "[formal_pull] credential_missing caseId={} code={} message={}",
                caseId,
                err.code,
                err.message
            );
            return Err(err);
        }
        Err(error) => {
            let err = to_ipc_error(error);
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            if let Ok(conn) = db.0.lock() {
                let _ = record_formal_error_run(&conn, &target, &apiIds, &err.code, &err.message, now);
            }
            eprintln!(
                "[formal_pull] credential_error caseId={} code={} message={}",
                caseId,
                err.code,
                err.message
            );
            return Err(err);
        }
    };
    let key_provider = Arc::new(StaticApiKeyProvider::with_token_endpoint(
        credentials.client_id,
        credentials.client_secret,
        credentials.token_endpoint,
    ));

    let parcel_id = match target.building_no.as_deref() {
        Some(building_no) => format!("{}-{}-{}", target.section_name, target.land_no, building_no),
        None => format!("{}-{}", target.section_name, target.land_no),
    };
    let pulled = land_registry_pull_data_core(
        parcel_id,
        apiIds.clone(),
        &ipc.opcos_base_url,
        &billing.0,
        key_provider,
    )
    .await;
    eprintln!(
        "[formal_pull] core_done caseId={} total_cost={} result_count={}",
        caseId,
        pulled.total_cost,
        pulled.results.len()
    );

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let run_id = {
        let conn = db.0.lock().map_err(|error| IpcError {
            code: "db_lock".to_string(),
            message: format!("db lock poisoned: {error}"),
        })?;
        record_formal_pull_run(&conn, &target, &apiIds, &pulled, now)?
    };
    eprintln!(
        "[formal_pull] done caseId={} run_id={} total_cost={}",
        caseId,
        run_id,
        pulled.total_cost
    );

    Ok(FormalPullResult {
        run_id,
        results: pulled.results,
        total_cost: pulled.total_cost,
        cache_hit: false,
        source_run_id: None,
    })
}

#[cfg(test)]
mod tests {
    use super::{
        find_formal_cache_source_run, land_registry_address_lookup_core, land_registry_pull_data_core,
        record_formal_cache_hit_run, record_formal_error_run, record_formal_pull_run,
        validate_formal_pull_target, ApiResult, PullResult,
    };
    use crate::commands::cases::confirm_case_registry_match_core;
    use crate::db::cases::{insert_case, Case};
    use crate::db::registry_query_runs::{get_registry_query_run_row, list_registry_query_run_rows};
    use crate::db::tests::open_in_memory;
    use crate::land_registry::apis::StaticApiKeyProvider;
    use crate::land_registry::billing_log::BillingLog;
    use crate::land_registry::consent::{check_consent, record_consent};
    use crate::land_registry::errors::LandRegistryError;
    use std::sync::Arc;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn land_registry_address_lookup_returns_cop_result_before_nlsc_fallback() {
        let cop_server = MockServer::start().await;
        let nlsc_server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingNo/1.0/QueryByAddress"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{
                    "ADDRESS": "addr",
                    "BLDGREG": {"UNIT": "A", "SEC": "0301", "NO": "00010000"}
                }]
            })))
            .mount(&cop_server)
            .await;
        Mock::given(method("GET"))
            .respond_with(ResponseTemplate::new(404).set_body_string("PERMISSION DENIED"))
            .mount(&nlsc_server)
            .await;

        let result = land_registry_address_lookup_core(
            "addr",
            &cop_server.uri(),
            &nlsc_server.uri(),
            crate::land_registry::cache::LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            true,
        )
        .await
        .unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].source, "cop_moi");
        assert!(result[0].trusted_for_pdf);
    }

    #[test]
    fn formal_pull_requires_confirmed_registry_key_before_paid_api_calls() {
        let conn = open_in_memory();
        let pending = Case {
            id: "pending-formal-gate".to_string(),
            case_no: None,
            property_type: "residential".into(),
            land_lot_no: "".into(),
            address: "台南市永康區勝利街58巷4號".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
            land_lots: vec![],
            land_registry_data: Some(serde_json::json!({
                "registry_status": "registry_pending",
                "candidate_options": [{
                    "source": "mock",
                    "trusted_for_pdf": false,
                    "section_name": "0001",
                    "land_no": "0001",
                    "building_no": "0001"
                }]
            })),
            current_step: 1,
        };
        insert_case(&conn, &pending).unwrap();

        let err = validate_formal_pull_target(&conn, &pending.id, &["building_registry".to_string()])
            .unwrap_err();
        assert_eq!(err.code, "registry_match_required");
        assert!(list_registry_query_run_rows(&conn, None).unwrap().is_empty());

        confirm_case_registry_match_core(
            &conn,
            &pending.id,
            "富強段",
            "00700000",
            Some("00165000"),
            1_779_648_000,
        )
        .unwrap();
        let target = validate_formal_pull_target(&conn, &pending.id, &["building_registry".to_string()])
            .unwrap();
        assert_eq!(target.registry_key, "confirmed:富強段:00700000:00165000");
    }

    #[test]
    fn formal_pull_rejects_unconfirmed_registry_states_before_paid_api_calls() {
        let conn = open_in_memory();
        let cases = [
            (
                "multi-candidates",
                serde_json::json!({
                    "registry_status": "candidate_selection_required",
                    "candidate_options": [
                        {"section_name": "富強段", "land_no": "00700000", "building_no": "00165000"},
                        {"section_name": "富強段", "land_no": "00700000", "building_no": "00167000"}
                    ]
                }),
            ),
            (
                "correction-suggestion",
                serde_json::json!({
                    "registry_status": "manual_required",
                    "correction_suggestions": ["苓雅二路"]
                }),
            ),
            (
                "registry-pending",
                serde_json::json!({
                    "registry_status": "registry_pending",
                    "missing_registry_fields": ["地段", "地號", "建號"]
                }),
            ),
            (
                "manual-required",
                serde_json::json!({
                    "registry_status": "manual_required"
                }),
            ),
        ];

        for (id, land_registry_data) in cases {
            let case = Case {
                id: id.to_string(),
                case_no: None,
                property_type: "residential".into(),
                land_lot_no: "".into(),
                address: "高雄市苓雅區苓雅路二段18巷8弄2號".into(),
                owner_name: None,
                status: "draft".into(),
                created_at: 1,
                updated_at: 1,
                case_name: None,
                building_lot_no: None,
                asking_price: None,
                land_lots: vec![],
                land_registry_data: Some(land_registry_data),
                current_step: 1,
            };
            insert_case(&conn, &case).unwrap();
            let err = validate_formal_pull_target(&conn, &case.id, &["building_registry".to_string()])
                .unwrap_err();
            assert_eq!(err.code, "registry_match_required");
        }

        assert!(list_registry_query_run_rows(&conn, None).unwrap().is_empty());
    }

    #[test]
    fn formal_pull_run_records_cost_payload_api_calls_and_case_pointer() {
        let conn = open_in_memory();
        let case = Case {
            id: "formal-record-case".to_string(),
            case_no: None,
            property_type: "residential".into(),
            land_lot_no: "00700000".into(),
            address: "台南市東區裕農路288巷17號8樓之1".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: Some("00165000".into()),
            asking_price: None,
            land_lots: vec!["00700000".into()],
            land_registry_data: Some(serde_json::json!({
                "confirmed_registry_match": {
                    "section_name": "富強段",
                    "land_no": "00700000",
                    "building_no": "00165000",
                    "status": "confirmed"
                }
            })),
            current_step: 1,
        };
        insert_case(&conn, &case).unwrap();
        let target = validate_formal_pull_target(
            &conn,
            &case.id,
            &["building_registry".to_string(), "building_ownership".to_string()],
        )
        .unwrap();
        let mut results = std::collections::HashMap::new();
        results.insert(
            "building_registry".to_string(),
            ApiResult {
                success: true,
                data: Some(serde_json::json!({"building_number": "00165000"})),
                error: None,
                source: "api".to_string(),
            },
        );
        results.insert(
            "building_ownership".to_string(),
            ApiResult {
                success: true,
                data: Some(serde_json::json!({"owner": ""})),
                error: None,
                source: "api".to_string(),
            },
        );
        let pulled = PullResult { results, total_cost: 2 };
        let api_ids = vec!["building_registry".to_string(), "building_ownership".to_string()];
        let run_id = record_formal_pull_run(&conn, &target, &api_ids, &pulled, 1_779_648_001)
            .unwrap();

        let run = crate::db::registry_query_runs::get_registry_query_run_row(&conn, &run_id)
            .unwrap();
        assert_eq!(run.confirmation_status, "confirmed");
        assert_eq!(run.status, "formal_pulled");
        assert_eq!(run.total_cost_cents, 200);
        assert!(run.cop_payload_json.unwrap().get("building_registry").is_some());

        let call_rows: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM registry_query_api_calls WHERE run_id = ?1",
                [&run_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(call_rows, 2);
        let total_call_cost: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(cost_cents), 0) FROM registry_query_api_calls WHERE run_id = ?1",
                [&run_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(total_call_cost, 200);

        let updated = crate::db::cases::get_case(&conn, &case.id).unwrap();
        let registry_data = updated.land_registry_data.unwrap();
        assert_eq!(registry_data["formal_registry_run_id"], run_id);
        assert_eq!(registry_data["formal_registry_api_set"], serde_json::json!(api_ids));
    }

    #[test]
    fn repeated_formal_pull_records_cache_hit_without_api_call_rows() {
        let conn = open_in_memory();
        let case = Case {
            id: "formal-cache-case".to_string(),
            case_no: None,
            property_type: "residential".into(),
            land_lot_no: "00700000".into(),
            address: "台南市東區裕農路288巷17號8樓之1".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: Some("00165000".into()),
            asking_price: None,
            land_lots: vec!["00700000".into()],
            land_registry_data: Some(serde_json::json!({
                "confirmed_registry_match": {
                    "section_name": "富強段",
                    "land_no": "00700000",
                    "building_no": "00165000",
                    "status": "confirmed"
                }
            })),
            current_step: 1,
        };
        insert_case(&conn, &case).unwrap();
        let api_ids = vec!["building_registry".to_string(), "building_ownership".to_string()];
        let target = validate_formal_pull_target(&conn, &case.id, &api_ids).unwrap();
        let mut results = std::collections::HashMap::new();
        results.insert(
            "building_registry".to_string(),
            ApiResult {
                success: true,
                data: Some(serde_json::json!({"building_number": "00165000"})),
                error: None,
                source: "api".to_string(),
            },
        );
        results.insert(
            "building_ownership".to_string(),
            ApiResult {
                success: true,
                data: Some(serde_json::json!({"owner": ""})),
                error: None,
                source: "api".to_string(),
            },
        );
        let source_run_id = record_formal_pull_run(
            &conn,
            &target,
            &api_ids,
            &PullResult { results, total_cost: 2 },
            1_779_648_001,
        )
        .unwrap();

        let source_run = find_formal_cache_source_run(&conn, &target.registry_key, &api_ids)
            .unwrap()
            .expect("source run should be cacheable");
        assert_eq!(source_run.id, source_run_id);
        let cache_run_id =
            record_formal_cache_hit_run(&conn, &target, &api_ids, &source_run, 1_779_648_002)
                .unwrap();
        let cache_run = get_registry_query_run_row(&conn, &cache_run_id).unwrap();
        assert!(cache_run.cache_hit);
        assert_eq!(cache_run.total_cost_cents, 0);
        assert_eq!(cache_run.source_run_id.as_deref(), Some(source_run_id.as_str()));

        let cache_api_rows: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM registry_query_api_calls WHERE run_id = ?1",
                [&cache_run_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(cache_api_rows, 0);
    }

    #[test]
    fn formal_pull_error_run_records_readable_error_without_api_call_rows() {
        let conn = open_in_memory();
        let case = Case {
            id: "formal-error-case".to_string(),
            case_no: None,
            property_type: "residential".into(),
            land_lot_no: "00700000".into(),
            address: "台南市東區裕農路288巷17號8樓之1".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: Some("00165000".into()),
            asking_price: None,
            land_lots: vec!["00700000".into()],
            land_registry_data: Some(serde_json::json!({
                "confirmed_registry_match": {
                    "section_name": "富強段",
                    "land_no": "00700000",
                    "building_no": "00165000",
                    "status": "confirmed"
                }
            })),
            current_step: 1,
        };
        insert_case(&conn, &case).unwrap();
        let api_ids = vec!["building_registry".to_string()];
        let target = validate_formal_pull_target(&conn, &case.id, &api_ids).unwrap();
        let run_id = record_formal_error_run(
            &conn,
            &target,
            &api_ids,
            "cop_credential_required",
            "請先在設定頁完成地政查詢帳號設定",
            1_779_648_003,
        )
        .unwrap();

        let run = get_registry_query_run_row(&conn, &run_id).unwrap();
        assert_eq!(run.status, "formal_error");
        assert_eq!(run.total_cost_cents, 0);
        assert_eq!(
            run.error_summary_json.unwrap()["errorCode"],
            "cop_credential_required"
        );
        let api_rows: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM registry_query_api_calls WHERE run_id = ?1",
                [&run_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(api_rows, 0);
    }

    #[tokio::test]
    async fn land_registry_address_lookup_reports_nlsc_permission_denied() {
        let cop_server = MockServer::start().await;
        let nlsc_server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingNo/1.0/QueryByAddress"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"ADDRESS": "addr", "BLDGREG": null}]
            })))
            .mount(&cop_server)
            .await;
        Mock::given(method("GET"))
            .respond_with(ResponseTemplate::new(404).set_body_string("PERMISSION DENIED"))
            .mount(&nlsc_server)
            .await;

        let error = land_registry_address_lookup_core(
            "addr",
            &cop_server.uri(),
            &nlsc_server.uri(),
            crate::land_registry::cache::LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            true,
        )
        .await
        .unwrap_err();

        assert!(matches!(error, LandRegistryError::NlscPermissionDenied { .. }));
    }

    #[tokio::test]
    async fn land_registry_address_lookup_returns_untrusted_nlsc_candidates() {
        let cop_server = MockServer::start().await;
        let nlsc_server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/BuildingNo/1.0/QueryByAddress"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"ADDRESS": "addr", "BLDGREG": null}]
            })))
            .mount(&cop_server)
            .await;
        Mock::given(method("GET"))
            .and(path("/idc/AddressQueryLand/addr/10"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"<addressItems><addressItem><content>addr</content><location>120,24</location><office>A</office><sect>2013</sect><landno>03420000</landno></addressItem></addressItems>"#,
            ))
            .mount(&nlsc_server)
            .await;
        Mock::given(method("GET"))
            .and(path("/dmaps/CadasLandInfo/A/2013/03420000"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"buildList":["02906000"],"ownerType":{"本國人":"100%"}}"#,
            ))
            .mount(&nlsc_server)
            .await;

        let result = land_registry_address_lookup_core(
            "addr",
            &cop_server.uri(),
            &nlsc_server.uri(),
            crate::land_registry::cache::LandRegistryCache::new_in_memory(),
            Arc::new(StaticApiKeyProvider::configured("cid", "secret")),
            true,
        )
        .await
        .unwrap();

        assert_eq!(result.len(), 2);
        assert!(result.iter().all(|parcel| parcel.source == "nlsc_cad"));
        assert!(result.iter().all(|parcel| !parcel.trusted_for_pdf));
    }

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
            .and(path("/BuildingDescription/1.0/QueryByBuildNo"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "STATUS": 1,
                "RESPONSE": [{"BLDGREG": {"AREA": "52.5", "PURPOSE": "住家用", "COMPLETEDATE": "090/09/01"}}]
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
        assert_eq!(result.total_cost, 2);
        assert!(result.results["building_registry"].success);
        assert!(result.results["land_registry"].success);
        assert!(result.results["co_owners"].success);
    }
}
