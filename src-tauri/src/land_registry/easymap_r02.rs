use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::time::Duration;
use uuid::Uuid;

use crate::db::registry_query_runs::{insert_registry_query_run, NewRegistryQueryRun};
use crate::land_registry::apis::address_to_parcel::ParcelInfo;

pub const R02_DESKTOP_ADAPTER: &str = "easymap_r02_desktop";
pub const R02_PARSER_VERSION: &str = "r02-text-v1";
const EASYMAP_BASE_URL: &str = "https://easymap.moi.gov.tw/R02";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02BuildingCandidate {
    pub administrative_district: Option<String>,
    pub land_office: Option<String>,
    pub section_code: Option<String>,
    pub section_name: Option<String>,
    pub land_no: Option<String>,
    pub building_no: Option<String>,
    pub building_area_sqm: Option<String>,
    pub total_floor_count: Option<String>,
    pub floor_label: Option<String>,
    pub completion_date_roc: Option<String>,
    pub age_years: Option<String>,
    pub main_use: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02DiscoveryRun {
    pub adapter: String,
    pub parser_version: String,
    pub input_address: String,
    pub status: String,
    pub total_cost_cents: i64,
    pub candidates: Vec<R02BuildingCandidate>,
    pub raw_summary: String,
    pub missing_fields: Vec<String>,
    pub error_code: Option<String>,
    pub next_action: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02ParseFailure {
    pub adapter: String,
    pub parser_version: String,
    pub status: String,
    pub error_code: String,
    pub missing_fields: Vec<String>,
    pub raw_summary: String,
    pub next_action: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02RecordedDiscoveryRun {
    pub run_id: String,
    pub ok: bool,
    pub discovery: Option<R02DiscoveryRun>,
    pub error: Option<R02ParseFailure>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EasyMapR02Discovery {
    pub run: R02DiscoveryRun,
    pub parcels: Vec<ParcelInfo>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapAddressParts {
    city_name: String,
    city_code: String,
    town_name: String,
    road_name: String,
    lane_name: String,
    alley_name: String,
    no: String,
    floor_number: String,
    floor_unit: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapDoorplate {
    doorplate: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapDoorCandidate {
    doorplate: String,
    source_doorplate: String,
    city_code: String,
    town_code: String,
    office: String,
    section_code: String,
    section_name: String,
    land_no: String,
    building_section_code: String,
    building_no: String,
    merge_same_door_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapBuildingDescription {
    section_code: Option<String>,
    section_name: Option<String>,
    building_no: Option<String>,
    building_area_sqm: Option<String>,
    total_floor_count: Option<String>,
    floor_label: Option<String>,
    completion_date_roc: Option<String>,
    age_years: Option<String>,
    main_use: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapLandCandidate {
    city_name: String,
    town_name: String,
    city_code: String,
    town_code: String,
    office: String,
    section_code: String,
    section_name: String,
    land_no: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapLandDescription {
    building_numbers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EasyMapTownOption {
    id: String,
    name: String,
}

pub fn parse_r02_result_text(
    input_address: &str,
    text_or_html: &str,
) -> Result<R02DiscoveryRun, R02ParseFailure> {
    let normalized = normalize_text(text_or_html);
    let candidates = parse_candidate_blocks(&normalized)
        .into_iter()
        .map(|block| parse_candidate_block(&block))
        .filter(has_any_registry_signal)
        .collect::<Vec<_>>();

    if candidates.is_empty() {
        return Err(R02ParseFailure {
            adapter: R02_DESKTOP_ADAPTER.to_string(),
            parser_version: R02_PARSER_VERSION.to_string(),
            status: "r02_parse_failed".to_string(),
            error_code: "r02_no_usable_candidate".to_string(),
            missing_fields: vec![],
            raw_summary: summarize_raw(&normalized),
            next_action: "manual_registry_key_required".to_string(),
        });
    }

    let missing_fields = candidates
        .iter()
        .flat_map(required_missing_fields)
        .fold(Vec::<String>::new(), |mut fields, field| {
            if !fields.contains(&field) {
                fields.push(field);
            }
            fields
        });
    if !missing_fields.is_empty() {
        return Err(R02ParseFailure {
            adapter: R02_DESKTOP_ADAPTER.to_string(),
            parser_version: R02_PARSER_VERSION.to_string(),
            status: "r02_parse_failed".to_string(),
            error_code: "r02_required_fields_missing".to_string(),
            missing_fields,
            raw_summary: summarize_raw(&normalized),
            next_action: "manual_registry_key_required".to_string(),
        });
    }

    Ok(R02DiscoveryRun {
        adapter: R02_DESKTOP_ADAPTER.to_string(),
        parser_version: R02_PARSER_VERSION.to_string(),
        input_address: input_address.trim().to_string(),
        status: "candidate_unconfirmed".to_string(),
        total_cost_cents: 0,
        candidates,
        raw_summary: summarize_raw(&normalized),
        missing_fields,
        error_code: None,
        next_action: None,
    })
}

#[tauri::command]
pub fn land_registry_parse_r02_result_text(
    input_address: String,
    text_or_html: String,
) -> Result<R02DiscoveryRun, R02ParseFailure> {
    parse_r02_result_text(&input_address, &text_or_html)
}

pub fn record_r02_result_text(
    conn: &rusqlite::Connection,
    case_id: Option<String>,
    input_address: &str,
    text_or_html: &str,
    created_at: i64,
) -> Result<R02RecordedDiscoveryRun, String> {
    let run_id = Uuid::new_v4().to_string();
    match parse_r02_result_text(input_address, text_or_html) {
        Ok(discovery) => {
            let candidate = discovery.candidates.first();
            let registry_key = build_registry_key(candidate);
            insert_registry_query_run(
                conn,
                &NewRegistryQueryRun {
                    id: run_id.clone(),
                    case_id,
                    registry_key,
                    input_kind: "address".to_string(),
                    input_address: Some(input_address.trim().to_string()),
                    normalized_address: Some(input_address.trim().replace('台', "臺")),
                    office_code: None,
                    office_name: candidate.and_then(|value| value.land_office.clone()),
                    section_code: candidate.and_then(|value| value.section_code.clone()),
                    section_name: candidate.and_then(|value| value.section_name.clone()),
                    land_no: candidate.and_then(|value| value.land_no.clone()),
                    building_no: candidate.and_then(|value| value.building_no.clone()),
                    confirmation_status: "candidate_unconfirmed".to_string(),
                    status: "candidate_unconfirmed".to_string(),
                    cache_hit: false,
                    source_run_id: None,
                    total_cost_cents: 0,
                    r02_payload_json: Some(serde_json::to_value(&discovery).map_err(|error| {
                        format!("serialize r02 discovery failed: {error}")
                    })?),
                    cop_payload_json: None,
                    generated_json: None,
                    error_summary_json: None,
                    created_at,
                },
            )
            .map_err(|error| error.to_string())?;
            Ok(R02RecordedDiscoveryRun {
                run_id,
                ok: true,
                discovery: Some(discovery),
                error: None,
            })
        }
        Err(error) => {
            insert_registry_query_run(
                conn,
                &NewRegistryQueryRun {
                    id: run_id.clone(),
                    case_id,
                    registry_key: format!("r02_parse_failed:{run_id}"),
                    input_kind: "address".to_string(),
                    input_address: Some(input_address.trim().to_string()),
                    normalized_address: Some(input_address.trim().replace('台', "臺")),
                    office_code: None,
                    office_name: None,
                    section_code: None,
                    section_name: None,
                    land_no: None,
                    building_no: None,
                    confirmation_status: "candidate_unconfirmed".to_string(),
                    status: "r02_parse_failed".to_string(),
                    cache_hit: false,
                    source_run_id: None,
                    total_cost_cents: 0,
                    r02_payload_json: None,
                    cop_payload_json: None,
                    generated_json: None,
                    error_summary_json: Some(json!({
                        "adapter": error.adapter,
                        "parserVersion": error.parser_version,
                        "errorCode": error.error_code,
                        "missingFields": error.missing_fields,
                        "rawSummary": error.raw_summary,
                        "nextAction": error.next_action,
                    })),
                    created_at,
                },
            )
            .map_err(|error| error.to_string())?;
            Ok(R02RecordedDiscoveryRun {
                run_id,
                ok: false,
                discovery: None,
                error: Some(error),
            })
        }
    }
}

#[tauri::command]
pub fn land_registry_record_r02_result_text(
    db: tauri::State<'_, crate::DbState>,
    case_id: Option<String>,
    input_address: String,
    text_or_html: String,
) -> Result<R02RecordedDiscoveryRun, String> {
    let conn = db.0.lock().map_err(|error| format!("db lock poisoned: {error}"))?;
    record_r02_result_text(
        &conn,
        case_id,
        &input_address,
        &text_or_html,
        chrono::Utc::now().timestamp(),
    )
}

pub async fn discover_easymap_r02_address(address: &str) -> Result<EasyMapR02Discovery, R02ParseFailure> {
    EasyMapR02Client::new(EASYMAP_BASE_URL)
        .discover(address)
        .await
}

pub async fn discover_easymap_r02_address_with_base_url(
    base_url: impl Into<String>,
    address: &str,
) -> Result<EasyMapR02Discovery, R02ParseFailure> {
    EasyMapR02Client::new(base_url)
        .discover(address)
        .await
}

pub fn record_easymap_r02_discovery(
    conn: &rusqlite::Connection,
    case_id: Option<String>,
    discovery: Result<EasyMapR02Discovery, R02ParseFailure>,
    input_address: &str,
    created_at: i64,
) -> Result<R02RecordedDiscoveryRun, String> {
    match discovery {
        Ok(discovery) => record_easymap_r02_success(conn, case_id, &discovery.run, input_address, created_at),
        Err(error) => record_easymap_r02_error(conn, case_id, error, input_address, created_at),
    }
}

fn record_easymap_r02_success(
    conn: &rusqlite::Connection,
    case_id: Option<String>,
    discovery: &R02DiscoveryRun,
    input_address: &str,
    created_at: i64,
) -> Result<R02RecordedDiscoveryRun, String> {
    let run_id = Uuid::new_v4().to_string();
    let candidate = discovery.candidates.first();
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: run_id.clone(),
            case_id,
            registry_key: build_registry_key(candidate),
            input_kind: "address".to_string(),
            input_address: Some(input_address.trim().to_string()),
            normalized_address: Some(input_address.trim().replace('台', "臺")),
            office_code: None,
            office_name: candidate.and_then(|value| value.land_office.clone()),
            section_code: candidate.and_then(|value| value.section_code.clone()),
            section_name: candidate.and_then(|value| value.section_name.clone()),
            land_no: candidate.and_then(|value| value.land_no.clone()),
            building_no: candidate.and_then(|value| value.building_no.clone()),
            confirmation_status: "candidate_unconfirmed".to_string(),
            status: "candidate_unconfirmed".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: Some(serde_json::to_value(discovery).map_err(|error| {
                format!("serialize easymap r02 discovery failed: {error}")
            })?),
            cop_payload_json: None,
            generated_json: None,
            error_summary_json: None,
            created_at,
        },
    )
    .map_err(|error| error.to_string())?;

    Ok(R02RecordedDiscoveryRun {
        run_id,
        ok: true,
        discovery: Some(discovery.clone()),
        error: None,
    })
}

fn record_easymap_r02_error(
    conn: &rusqlite::Connection,
    case_id: Option<String>,
    error: R02ParseFailure,
    input_address: &str,
    created_at: i64,
) -> Result<R02RecordedDiscoveryRun, String> {
    let run_id = Uuid::new_v4().to_string();
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: run_id.clone(),
            case_id,
            registry_key: format!("easymap_r02_failed:{run_id}"),
            input_kind: "address".to_string(),
            input_address: Some(input_address.trim().to_string()),
            normalized_address: Some(input_address.trim().replace('台', "臺")),
            office_code: None,
            office_name: None,
            section_code: None,
            section_name: None,
            land_no: None,
            building_no: None,
            confirmation_status: "candidate_unconfirmed".to_string(),
            status: "manual_required".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: None,
            cop_payload_json: None,
            generated_json: None,
            error_summary_json: Some(json!({
                "adapter": error.adapter,
                "parserVersion": error.parser_version,
                "errorCode": error.error_code,
                "missingFields": error.missing_fields,
                "rawSummary": error.raw_summary,
                "nextAction": error.next_action,
            })),
            created_at,
        },
    )
    .map_err(|error| error.to_string())?;

    Ok(R02RecordedDiscoveryRun {
        run_id,
        ok: false,
        discovery: None,
        error: Some(error),
    })
}

struct EasyMapR02Client {
    base_url: String,
    http: reqwest::Client,
    cookies: HashMap<String, String>,
}

impl EasyMapR02Client {
    fn new(base_url: impl Into<String>) -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
            .expect("reqwest client should build");
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            http,
            cookies: HashMap::new(),
        }
    }

    async fn discover(mut self, address: &str) -> Result<EasyMapR02Discovery, R02ParseFailure> {
        let normalized = address.trim();
        if normalized.is_empty() {
            return Err(r02_failure(normalized, "address_parse_failed", "請先輸入完整地址"));
        }

        let parcels = if looks_like_land_descriptor(normalized) {
            self.discover_land_descriptor(normalized).await?
        } else {
            self.discover_doorplate(normalized).await?
        };

        if parcels.is_empty() {
            return Err(r02_failure(
                normalized,
                "easymap_r02_no_candidate",
                "查不到可直接補齊的地址候選，請人工確認地段、地號、建號",
            ));
        }

        let candidates = parcels.iter().map(parcel_to_r02_candidate).collect::<Vec<_>>();
        Ok(EasyMapR02Discovery {
            run: R02DiscoveryRun {
                adapter: R02_DESKTOP_ADAPTER.to_string(),
                parser_version: R02_PARSER_VERSION.to_string(),
                input_address: normalized.to_string(),
                status: "candidate_unconfirmed".to_string(),
                total_cost_cents: 0,
                candidates,
                raw_summary: format!("EasyMap R02 candidates={}", parcels.len()),
                missing_fields: vec![],
                error_code: None,
                next_action: None,
            },
            parcels,
        })
    }

    async fn discover_doorplate(&mut self, address: &str) -> Result<Vec<ParcelInfo>, R02ParseFailure> {
        let parts = parse_taiwan_address(address)
            .ok_or_else(|| r02_failure(address, "address_parse_failed", "門牌格式無法解析"))?;

        self.request_text("/Index", "GET", None, HashMap::new()).await?;
        let town_code = self.resolve_town_code(address, &parts.city_code, &parts.city_name, &parts.town_name).await?;
        let token = self.load_token().await?;
        let list_payload = self
            .request_text(
                "/Door_json_getDoorList",
                "POST",
                Some(token),
                HashMap::from([
                    ("city".to_string(), parts.city_code.clone()),
                    ("area".to_string(), town_code.clone()),
                    ("road".to_string(), parts.road_name.clone()),
                    ("doorPlate".to_string(), parts.road_name.clone()),
                    ("doorPlateType".to_string(), "A".to_string()),
                    ("lane".to_string(), parts.lane_name.clone()),
                    ("alley".to_string(), parts.alley_name.clone()),
                    ("no".to_string(), parts.no.clone()),
                    ("cityName".to_string(), parts.city_name.clone()),
                    ("townName".to_string(), parts.town_name.clone()),
                ]),
            )
            .await?;
        let parent_candidates = parse_easy_map_door_candidate_list_payload(&list_payload);
        let parent = pick_best_door_candidate(&parent_candidates, address)
            .ok_or_else(|| r02_failure(address, "easymap_r02_no_candidate", "查無門牌候選"))?;

        let mut candidates = vec![parent.clone()];
        if parent.merge_same_door_count > 0 {
            let token = self.load_token().await?;
            let full_payload = self
                .request_text(
                    "/Door_json_getFullDoorListByA",
                    "POST",
                    Some(token),
                    HashMap::from([
                        ("city".to_string(), parent.city_code.clone()),
                        ("area".to_string(), parent.town_code.clone()),
                        ("doorPlate".to_string(), if parent.source_doorplate.is_empty() { parent.doorplate.clone() } else { parent.source_doorplate.clone() }),
                        ("doorPlateType".to_string(), "A".to_string()),
                    ]),
                )
                .await?;
            let full_candidates = parse_easy_map_door_candidate_list_payload(&full_payload);
            if !full_candidates.is_empty() {
                candidates = full_candidates;
            }
        }

        let selected = select_door_candidates_for_address(&candidates, address);
        let mut parcels = Vec::new();
        for candidate in selected.into_iter().take(20) {
            let description = self.load_building_description(&candidate).await;
            parcels.push(build_door_parcel(address, &candidate, &description));
        }
        Ok(normalize_parcel_candidate_metadata(parcels))
    }

    async fn load_building_description(&mut self, candidate: &EasyMapDoorCandidate) -> EasyMapBuildingDescription {
        let Ok(token) = self.load_token().await else {
            return empty_building_description();
        };
        let result = self
            .request_text(
                "/BuildingDesc_ajax_detail",
                "POST",
                Some(token),
                HashMap::from([
                    ("office".to_string(), candidate.office.clone()),
                    ("sectNo".to_string(), if candidate.building_section_code.is_empty() { candidate.section_code.clone() } else { candidate.building_section_code.clone() }),
                    ("buildingNo".to_string(), candidate.building_no.clone()),
                ]),
            )
            .await;
        match result {
            Ok(html) => parse_easy_map_building_description_html(&html),
            Err(_) => empty_building_description(),
        }
    }

    async fn discover_land_descriptor(&mut self, address: &str) -> Result<Vec<ParcelInfo>, R02ParseFailure> {
        let parsed = parse_land_descriptor(address)
            .ok_or_else(|| r02_failure(address, "land_descriptor_parse_failed", "地段地號格式無法解析"))?;
        self.request_text("/Index", "GET", None, HashMap::new()).await?;
        let town_code = self.resolve_town_code(address, &parsed.city_code, &parsed.city_name, &parsed.town_name).await?;
        let token = self.load_token().await?;
        let section_payload = self
            .request_text(
                "/City_json_getSectionList",
                "POST",
                Some(token),
                HashMap::from([
                    ("cityCode".to_string(), parsed.city_code.clone()),
                    ("area".to_string(), town_code.clone()),
                    ("townCode".to_string(), town_code.clone()),
                    ("sectionName".to_string(), parsed.section_name.clone()),
                    ("sectName".to_string(), parsed.section_name.clone()),
                ]),
            )
            .await?;
        let section = parse_easy_map_section_list_payload(
            &section_payload,
            &parsed.section_name,
            &parsed.city_name,
            &parsed.town_name,
            &parsed.city_code,
            &town_code,
        )
        .ok_or_else(|| r02_failure(address, "easymap_section_not_found", "查無地段"))?;
        let token = self.load_token().await?;
        let locate_payload = self
            .request_text(
                "/Land_json_locate",
                "POST",
                Some(token),
                HashMap::from([
                    ("cityName".to_string(), section.city_name.clone()),
                    ("townName".to_string(), section.town_name.clone()),
                    ("cityCode".to_string(), section.city_code.clone()),
                    ("townCode".to_string(), section.town_code.clone()),
                    ("office".to_string(), section.office.clone()),
                    ("sectNo".to_string(), section.section_code.clone()),
                    ("landNo".to_string(), format_easy_map_land_no_for_detail(&parsed.land_no)),
                ]),
            )
            .await?;
        let land = parse_easy_map_land_by_coordinate_payload(&locate_payload)
            .unwrap_or(EasyMapLandCandidate { land_no: parsed.land_no, ..section });
        let description = self.load_land_description(address, &land).await;
        Ok(build_easy_map_parcels(address, address, &land, &description))
    }

    async fn load_land_description(
        &mut self,
        address: &str,
        land: &EasyMapLandCandidate,
    ) -> EasyMapLandDescription {
        let Ok(token) = self.load_token().await else {
            return EasyMapLandDescription { building_numbers: vec![] };
        };
        let result = self
            .request_text(
                "/LandDesc_ajax_detail",
                "POST",
                Some(token),
                HashMap::from([
                    ("cityCode".to_string(), land.city_code.clone()),
                    ("townCode".to_string(), land.town_code.clone()),
                    ("office".to_string(), land.office.clone()),
                    ("sectNo".to_string(), land.section_code.clone()),
                    ("landNo".to_string(), format_easy_map_land_no_for_detail(&land.land_no)),
                ]),
            )
            .await;
        match result {
            Ok(html) => parse_easy_map_land_description_html(&html),
            Err(_) => {
                let _ = address;
                EasyMapLandDescription { building_numbers: vec![] }
            }
        }
    }

    async fn resolve_town_code(
        &mut self,
        address: &str,
        city_code: &str,
        city_name: &str,
        town_name: &str,
    ) -> Result<String, R02ParseFailure> {
        let fallback = lookup_known_town_code(city_code, town_name);
        let Ok(token) = self.load_token().await else {
            return fallback.ok_or_else(|| r02_failure(address, "easymap_town_not_found", "查無行政區"));
        };
        // R02 的 getTownList 需要 cityName + doorPlateType 才會回傳完整鄉鎮清單（實證：只送 cityCode 回空）
        let payload = self
            .request_text(
                "/City_json_getTownList",
                "POST",
                Some(token),
                HashMap::from([
                    ("cityCode".to_string(), city_code.to_string()),
                    ("cityName".to_string(), city_name.to_string()),
                    ("doorPlateType".to_string(), "A".to_string()), // A = 地政門牌（預設）
                ]),
            )
            .await;
        let Ok(payload) = payload else {
            tracing::error!("[resolve_town_code] getTownList failed for cityCode={}", city_code);
            return fallback.ok_or_else(|| r02_failure(address, "easymap_town_not_found", "查無行政區"));
        };
        let towns = parse_easy_map_town_list_payload(&payload);
        let target = normalize_administrative_name(town_name);
        towns
            .into_iter()
            .find(|town| normalize_administrative_name(&town.name) == target)
            .map(|town| town.id)
            .or(fallback)
            .ok_or_else(|| r02_failure(address, "easymap_town_not_found", "查無行政區"))
    }

    async fn load_token(&mut self) -> Result<String, R02ParseFailure> {
        let html = self.request_text("/pages/setToken.jsp", "POST", None, HashMap::new()).await?;
        extract_token(&html).ok_or_else(|| r02_failure("", "easymap_token_missing", "EasyMap token missing"))
    }

    async fn request_text(
        &mut self,
        path: &str,
        method: &str,
        token: Option<String>,
        body: HashMap<String, String>,
    ) -> Result<String, R02ParseFailure> {
        let url = format!("{}{}", self.base_url, path);
        let mut form = body;
        if let Some(token) = token {
            form.insert("struts.token.name".to_string(), "token".to_string());
            form.insert("token".to_string(), token);
        }

        let mut request = if method == "POST" {
            self.http.post(&url).form(&form)
        } else {
            self.http.get(&url)
        };
        request = request
            .header(reqwest::header::ACCEPT, if method == "POST" {
                "application/json, text/javascript, text/html, */*; q=0.01"
            } else {
                "text/html,*/*"
            })
            .header(reqwest::header::REFERER, format!("{}/Index", self.base_url))
            .header(reqwest::header::USER_AGENT, "Mozilla/5.0 AIRE-local-discovery");
        if method == "POST" {
            request = request.header("x-requested-with", "XMLHttpRequest");
        }
        if !self.cookies.is_empty() {
            request = request.header(reqwest::header::COOKIE, self.cookie_header());
        }
        let response = request
            .send()
            .await
            .map_err(|error| r02_failure("", "easymap_r02_unavailable", &error.to_string()))?;
        self.store_cookies(response.headers());
        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|error| r02_failure("", "easymap_r02_unavailable", &error.to_string()))?;
        if text.trim().eq_ignore_ascii_case("PERMISSION DENIED") {
            return Err(r02_failure(
                "",
                "easymap_permission_denied",
                &format!("EasyMap R02 denied {path} with http_status={}", status.as_u16()),
            ));
        }
        if !status.is_success() {
            return Err(r02_failure(
                "",
                &format!("easymap_http_{}", status.as_u16()),
                &format!("EasyMap R02 {path} returned http_status={}", status.as_u16()),
            ));
        }
        Ok(text)
    }

    fn cookie_header(&self) -> String {
        self.cookies
            .iter()
            .map(|(key, value)| format!("{key}={value}"))
            .collect::<Vec<_>>()
            .join("; ")
    }

    fn store_cookies(&mut self, headers: &reqwest::header::HeaderMap) {
        for value in headers.get_all(reqwest::header::SET_COOKIE) {
            let Ok(raw) = value.to_str() else {
                continue;
            };
            let Some(pair) = raw.split(';').next() else {
                continue;
            };
            let Some((key, value)) = pair.split_once('=') else {
                continue;
            };
            if !key.trim().is_empty() {
                self.cookies.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ParsedLandDescriptor {
    city_name: String,
    city_code: String,
    town_name: String,
    section_name: String,
    land_no: String,
}

fn r02_failure(address: &str, code: &str, message: &str) -> R02ParseFailure {
    R02ParseFailure {
        adapter: R02_DESKTOP_ADAPTER.to_string(),
        parser_version: R02_PARSER_VERSION.to_string(),
        status: "manual_required".to_string(),
        error_code: code.to_string(),
        missing_fields: vec![],
        raw_summary: message.to_string(),
        next_action: if address.trim().is_empty() {
            "manual_registry_key_required".to_string()
        } else {
            format!("manual_registry_key_required:{address}")
        },
    }
}

fn parcel_to_r02_candidate(parcel: &ParcelInfo) -> R02BuildingCandidate {
    R02BuildingCandidate {
        administrative_district: None,
        land_office: parcel.land_office.clone(),
        section_code: parcel.section_code.clone(),
        section_name: parcel.section_name.clone(),
        land_no: Some(parcel.lot_number.clone()).filter(|value| !value.trim().is_empty()),
        building_no: Some(parcel.building_number.clone()).filter(|value| !value.trim().is_empty()),
        building_area_sqm: None,
        total_floor_count: None,
        floor_label: None,
        completion_date_roc: None,
        age_years: None,
        main_use: None,
    }
}

fn looks_like_land_descriptor(address: &str) -> bool {
    address.contains('段') && (address.contains("地號") || !address.contains('號'))
}

fn parse_taiwan_address(address: &str) -> Option<EasyMapAddressParts> {
    let normalized = to_half_width_digits(address).replace(char::is_whitespace, "");
    let (city_name_raw, after_city) = split_after_any_suffix(&normalized, &["縣", "市"])?;
    let (town_name, rest) = split_after_any_suffix(after_city, &["區", "鄉", "鎮", "市"])?;
    let city_name = city_name_raw.replacen('台', "臺", 1);
    let city_code = city_code_by_name(&city_name)
        .or_else(|| city_code_by_name(&city_name.replacen('臺', "台", 1)))?
        .to_string();
    let rest = strip_village_prefix(rest);
    let no_index = rest.find('號')?;
    let no_part = &rest[..no_index];
    let no_start = no_part
        .char_indices()
        .rev()
        .find(|(_, ch)| !(ch.is_ascii_digit() || *ch == '-'))
        .map(|(idx, ch)| idx + ch.len_utf8())
        .unwrap_or(0);
    let no = no_part[no_start..].to_string();
    if no.is_empty() {
        return None;
    }
    let before_no = &no_part[..no_start];
    let (before_alley, alley_name) = split_trailing_number_unit(before_no, '弄');
    let (road_name, lane_name) = split_trailing_number_unit(before_alley, '巷');
    if road_name.is_empty() {
        return None;
    }
    Some(EasyMapAddressParts {
        city_name,
        city_code,
        town_name: town_name.to_string(),
        road_name: road_name.to_string(),
        lane_name,
        alley_name,
        no,
        floor_number: String::new(),
        floor_unit: String::new(),
    })
}

fn parse_land_descriptor(address: &str) -> Option<ParsedLandDescriptor> {
    let normalized = to_half_width_digits(address).replace(char::is_whitespace, "");
    let (city_name_raw, after_city) = split_after_any_suffix(&normalized, &["縣", "市"])?;
    let (town_name, rest) = split_after_any_suffix(after_city, &["區", "鄉", "鎮", "市"])?;
    let section_end = rest.find('段')?;
    let section_name = rest[..=section_end].to_string();
    let after_section = &rest[section_end + '段'.len_utf8()..];
    let land_no = normalize_land_no(Some(after_section))?;
    let city_name = city_name_raw.replacen('台', "臺", 1);
    let city_code = city_code_by_name(&city_name)
        .or_else(|| city_code_by_name(&city_name.replacen('臺', "台", 1)))?
        .to_string();
    Some(ParsedLandDescriptor {
        city_name,
        city_code,
        town_name: town_name.to_string(),
        section_name,
        land_no,
    })
}

fn split_after_any_suffix<'a>(value: &'a str, suffixes: &[&str]) -> Option<(String, &'a str)> {
    let mut best: Option<usize> = None;
    for suffix in suffixes {
        if let Some(index) = value.find(suffix) {
            let end = index + suffix.len();
            best = Some(best.map_or(end, |current| current.min(end)));
        }
    }
    let end = best?;
    Some((value[..end].to_string(), &value[end..]))
}

fn strip_village_prefix(rest: &str) -> &str {
    if let Some(index) = rest.find('里') {
        let after_village = &rest[index + '里'.len_utf8()..];
        let after_digits = after_village.trim_start_matches(|ch: char| {
            ch.is_ascii_digit() || ('０'..='９').contains(&ch)
        });
        if let Some(after_neighbor) = after_digits.strip_prefix('鄰') {
            return after_neighbor;
        }
        return after_village;
    }
    rest
}

fn split_trailing_number_unit(value: &str, unit: char) -> (&str, String) {
    let Some(trimmed) = value.strip_suffix(unit) else {
        return (value, String::new());
    };
    let start = trimmed
        .char_indices()
        .rev()
        .find(|(_, ch)| !ch.is_ascii_digit())
        .map(|(idx, ch)| idx + ch.len_utf8())
        .unwrap_or(0);
    if start >= trimmed.len() {
        return (value, String::new());
    }
    (&trimmed[..start], trimmed[start..].to_string())
}

fn extract_token(html: &str) -> Option<String> {
    for input in html.split("<input").skip(1) {
        let end = input.find('>').unwrap_or(input.len());
        let tag = &input[..end];
        if html_attr(tag, "name").as_deref() == Some("token") {
            return html_attr(tag, "value").filter(|value| !value.trim().is_empty());
        }
    }
    None
}

fn html_attr(tag: &str, attr: &str) -> Option<String> {
    for quote in ['"', '\''] {
        let pattern = format!("{attr}={quote}");
        if let Some(start) = tag.find(&pattern) {
            let value_start = start + pattern.len();
            let rest = &tag[value_start..];
            let end = rest.find(quote)?;
            return Some(rest[..end].to_string());
        }
    }
    None
}

fn parse_easy_map_doorplate_list_html(html: &str) -> Vec<EasyMapDoorplate> {
    let mut items = Vec::new();
    let mut rest = html;
    while let Some(index) = rest.find("data-road=") {
        rest = &rest[index + "data-road=".len()..];
        let Some(quote) = rest.chars().next() else {
            break;
        };
        if quote != '"' && quote != '\'' {
            continue;
        }
        let quoted = &rest[quote.len_utf8()..];
        let Some(end) = quoted.find(quote) else {
            break;
        };
        let doorplate = decode_html(&quoted[..end]);
        if !doorplate.trim().is_empty() {
            items.push(EasyMapDoorplate { doorplate });
        }
        rest = &quoted[end + quote.len_utf8()..];
    }
    items
}

fn pick_best_doorplate(items: &[EasyMapDoorplate], address: &str) -> Option<EasyMapDoorplate> {
    if items.is_empty() {
        return None;
    }
    let target_parts = parse_taiwan_address(address);
    if let Some(target) = target_parts {
        if let Some(exact) = items.iter().find(|item| {
            parse_taiwan_address(&item.doorplate).is_some_and(|parts| {
                parts.city_code == target.city_code
                    && parts.town_name == target.town_name
                    && parts.road_name == target.road_name
                    && parts.lane_name == target.lane_name
                    && parts.alley_name == target.alley_name
                    && parts.no == target.no
            })
        }) {
            return Some(exact.clone());
        }
    }
    let normalized_target = normalize_address_for_match(address);
    items
        .iter()
        .find(|item| normalize_address_for_match(&item.doorplate) == normalized_target)
        .cloned()
}

fn parse_easy_map_land_by_coordinate_payload(payload: &str) -> Option<EasyMapLandCandidate> {
    let json = serde_json::from_str::<serde_json::Value>(payload).ok()?;
    if json.get("exec").and_then(serde_json::Value::as_str)?.to_lowercase() != "true" {
        return None;
    }
    let city_name = json_string(&json, "cityName")?;
    let town_name = json_string(&json, "townName")?;
    let city_code = json_string(&json, "cityCode")?;
    let town_code = json_string(&json, "townCode")?;
    let office = json_string(&json, "office")?;
    let section_code = json_string(&json, "sectNo")?;
    let section_name = json_string(&json, "sectName")?;
    let land_no = normalize_land_no(json_string(&json, "landNo").as_deref())?;
    Some(EasyMapLandCandidate {
        city_name,
        town_name,
        city_code,
        town_code,
        office,
        section_code,
        section_name,
        land_no,
    })
}

fn parse_easy_map_section_list_payload(
    payload: &str,
    target_section_name: &str,
    city_name: &str,
    town_name: &str,
    city_code: &str,
    town_code: &str,
) -> Option<EasyMapLandCandidate> {
    let json = serde_json::from_str::<serde_json::Value>(payload).ok()?;
    let candidates = collect_section_candidates(&json, city_name, town_name, city_code, town_code);
    let target = normalize_section_name(target_section_name);
    candidates
        .iter()
        .find(|candidate| normalize_section_name(&candidate.section_name) == target)
        .or_else(|| {
            candidates.iter().find(|candidate| {
                let section = normalize_section_name(&candidate.section_name);
                section.contains(&target) || target.contains(&section)
            })
        })
        .or_else(|| candidates.first())
        .cloned()
}

fn collect_section_candidates(
    value: &serde_json::Value,
    city_name: &str,
    town_name: &str,
    city_code: &str,
    town_code: &str,
) -> Vec<EasyMapLandCandidate> {
    let mut out = Vec::new();
    match value {
        serde_json::Value::Array(items) => {
            for item in items {
                out.extend(collect_section_candidates(item, city_name, town_name, city_code, town_code));
            }
        }
        serde_json::Value::Object(record) => {
            let section_code = json_string(value, "sectNo")
                .or_else(|| json_string(value, "sectionCode"))
                .or_else(|| json_string(value, "id"));
            let section_name = json_string(value, "sectName")
                .or_else(|| json_string(value, "sectionName"))
                .or_else(|| json_string(value, "name"));
            let office = json_string(value, "office").or_else(|| json_string(value, "officeCode"));
            if let (Some(section_code), Some(section_name), Some(office)) = (section_code, section_name, office) {
                out.push(EasyMapLandCandidate {
                    city_name: city_name.to_string(),
                    town_name: town_name.to_string(),
                    city_code: city_code.to_string(),
                    town_code: town_code.to_string(),
                    office,
                    section_code,
                    section_name,
                    land_no: String::new(),
                });
            }
            for child in record.values() {
                out.extend(collect_section_candidates(child, city_name, town_name, city_code, town_code));
            }
        }
        _ => {}
    }
    out
}

fn parse_easy_map_town_list_payload(payload: &str) -> Vec<EasyMapTownOption> {
    let Ok(json) = serde_json::from_str::<serde_json::Value>(payload) else {
        return vec![];
    };
    let Some(items) = json.as_array() else {
        return vec![];
    };
    items
        .iter()
        .filter_map(|item| {
            Some(EasyMapTownOption {
                id: json_string(item, "id")?,
                name: json_string(item, "name")?,
            })
        })
        .collect()
}

fn parse_easy_map_door_candidate_list_payload(payload: &str) -> Vec<EasyMapDoorCandidate> {
    let Ok(json) = serde_json::from_str::<serde_json::Value>(payload) else {
        return vec![];
    };
    let Some(results) = json.get("results").and_then(serde_json::Value::as_array) else {
        return vec![];
    };
    results.iter().filter_map(parse_easy_map_door_candidate).collect()
}

fn parse_easy_map_door_candidate(value: &serde_json::Value) -> Option<EasyMapDoorCandidate> {
    let doorplate = json_string(value, "Road").or_else(|| json_string(value, "road")).unwrap_or_default();
    let source_doorplate = json_string(value, "srcRoad").unwrap_or_else(|| doorplate.clone());
    let office = json_string(value, "office").unwrap_or_default();
    let section_code = first_list_value(&json_string(value, "sectno").unwrap_or_default());
    let section_name = json_string(value, "sectName").unwrap_or_default();
    let land_no = first_list_value(&json_string(value, "landno").unwrap_or_default());
    let building_no = json_string(value, "buildno").unwrap_or_default();
    if doorplate.is_empty() || office.is_empty() || section_code.is_empty() {
        return None;
    }
    Some(EasyMapDoorCandidate {
        doorplate,
        source_doorplate,
        city_code: json_string(value, "City").unwrap_or_default(),
        town_code: json_string(value, "towncode").unwrap_or_default(),
        office,
        section_code: section_code.clone(),
        section_name,
        land_no,
        building_section_code: json_string(value, "buildsectno").unwrap_or(section_code),
        building_no,
        merge_same_door_count: value
            .get("mergeSameDoorCount")
            .and_then(|value| value.as_u64().or_else(|| value.as_str()?.parse::<u64>().ok()))
            .unwrap_or(0) as usize,
    })
}

fn pick_best_door_candidate(items: &[EasyMapDoorCandidate], address: &str) -> Option<EasyMapDoorCandidate> {
    if items.is_empty() {
        return None;
    }
    let normalized_target = normalize_door_candidate_match(address);
    items
        .iter()
        .find(|item| normalize_door_candidate_match(&item.doorplate) == normalized_target)
        .or_else(|| {
            items
                .iter()
                .find(|item| normalized_target.ends_with(&normalize_door_candidate_match(&item.doorplate)))
        })
        .or_else(|| items.first())
        .cloned()
}

fn select_door_candidates_for_address(candidates: &[EasyMapDoorCandidate], address: &str) -> Vec<EasyMapDoorCandidate> {
    let floor_key = extract_floor_key(address);
    if floor_key.is_empty() {
        return candidates.to_vec();
    }
    let matched = candidates
        .iter()
        .filter(|candidate| extract_floor_key(&candidate.doorplate) == floor_key)
        .cloned()
        .collect::<Vec<_>>();
    if matched.is_empty() { candidates.to_vec() } else { matched }
}

fn parse_easy_map_land_description_html(html: &str) -> EasyMapLandDescription {
    let mut building_numbers = Vec::new();
    let mut rest = html;
    while let Some(index) = rest.find("getBuildDetail") {
        rest = &rest[index..];
        let quoted = collect_single_quoted_values(rest);
        if let Some(no) = quoted.get(2).filter(|value| value.len() == 8 && value.chars().all(|ch| ch.is_ascii_digit())) {
            if !building_numbers.contains(no) {
                building_numbers.push(no.clone());
            }
        }
        rest = &rest["getBuildDetail".len()..];
    }
    EasyMapLandDescription { building_numbers }
}

fn strip_html(value: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in value.chars() {
        match ch {
            '<' => {
                in_tag = true;
                out.push(' ');
            }
            '>' => {
                in_tag = false;
                out.push(' ');
            }
            _ if in_tag => {}
            _ => out.push(ch),
        }
    }
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn first_numeric_text(value: &str) -> Option<String> {
    let mut out = String::new();
    let mut seen_digit = false;
    let mut seen_dot = false;
    for ch in value.chars() {
        if ch.is_ascii_digit() {
            out.push(ch);
            seen_digit = true;
        } else if ch == '.' && seen_digit && !seen_dot {
            out.push(ch);
            seen_dot = true;
        } else if seen_digit {
            break;
        }
    }
    if out.is_empty() { None } else { Some(out) }
}

fn first_digits(value: &str) -> Option<String> {
    let digits = value.chars().filter(|ch| ch.is_ascii_digit()).collect::<String>();
    if digits.is_empty() { None } else { Some(digits) }
}

fn split_section(value: &str) -> Option<(Option<String>, Option<String>)> {
    let mut parts = value.split_whitespace();
    let first = parts.next()?;
    let rest = parts.collect::<Vec<_>>().join(" ");
    if first.chars().all(|ch| ch.is_ascii_digit()) {
        Some((Some(first.to_string()), if rest.is_empty() { None } else { Some(rest) }))
    } else {
        Some((first_digits(value), Some(value.trim().to_string())))
    }
}

fn first_list_value(value: &str) -> String {
    value
        .split(',')
        .map(str::trim)
        .find(|item| !item.is_empty())
        .unwrap_or("")
        .to_string()
}

fn normalize_door_candidate_match(value: &str) -> String {
    to_half_width_digits(value)
        .replace('臺', "台")
        .replace(['里', '鄰', ' '], "")
        .trim()
        .to_string()
}

fn extract_floor_key(value: &str) -> String {
    let normalized = to_half_width_digits(value).replace(char::is_whitespace, "");
    let Some(no_index) = normalized.find('號') else {
        return String::new();
    };
    let after_no = &normalized[no_index + '號'.len_utf8()..];
    let Some(floor_index) = after_no.find('樓') else {
        return String::new();
    };
    let before_floor = &after_no[..floor_index];
    let start = before_floor
        .char_indices()
        .rev()
        .find(|(_, ch)| !(ch.is_ascii_digit() || "一二三四五六七八九十百".contains(*ch)))
        .map(|(idx, ch)| idx + ch.len_utf8())
        .unwrap_or(0);
    let floor = before_floor[start..].trim();
    let after_floor = &after_no[floor_index + '樓'.len_utf8()..];
    let unit = after_floor
        .strip_prefix('之')
        .map(|value| {
            value
                .chars()
                .take_while(|ch| ch.is_ascii_digit() || "一二三四五六七八九十".contains(*ch))
                .collect::<String>()
        })
        .unwrap_or_default();
    if floor.is_empty() {
        String::new()
    } else if unit.is_empty() {
        floor.to_string()
    } else {
        format!("{floor}-{unit}")
    }
}

fn parse_easy_map_building_description_html(html: &str) -> EasyMapBuildingDescription {
    let rows = parse_html_table_rows(html);
    let section = rows.get("地段").and_then(|value| split_section(value));
    let completion = rows.get("建物完成日期").cloned();
    EasyMapBuildingDescription {
        section_code: section.as_ref().and_then(|value| value.0.clone()),
        section_name: section.as_ref().and_then(|value| value.1.clone()),
        building_no: rows.get("建號").and_then(|value| first_digits(value)),
        building_area_sqm: rows.get("建物面積").and_then(|value| first_numeric_text(value)),
        total_floor_count: rows.get("樓層數").and_then(|value| first_digits(value)),
        floor_label: rows.get("樓層別").cloned(),
        completion_date_roc: completion.as_ref().and_then(|value| first_digits(value)),
        age_years: completion
            .as_ref()
            .and_then(|value| value.split("屋齡").nth(1))
            .and_then(first_digits),
        main_use: rows.get("主要用途").cloned(),
    }
}

fn empty_building_description() -> EasyMapBuildingDescription {
    EasyMapBuildingDescription {
        section_code: None,
        section_name: None,
        building_no: None,
        building_area_sqm: None,
        total_floor_count: None,
        floor_label: None,
        completion_date_roc: None,
        age_years: None,
        main_use: None,
    }
}

fn parse_html_table_rows(html: &str) -> HashMap<String, String> {
    let normalized = html
        .replace("</tr>", "</tr>\n")
        .replace("</th>", "</th>\n")
        .replace("</td>", "</td>\n");
    let mut rows = HashMap::new();
    for row in normalized.split("</tr>") {
        let cells = collect_table_cells(row);
        if cells.len() >= 2 {
            rows.insert(cells[0].clone(), cells[1].clone());
        }
    }
    rows
}

fn collect_table_cells(row: &str) -> Vec<String> {
    let mut cells = Vec::new();
    let mut rest = row;
    while let Some(start) = rest.find("<th").or_else(|| rest.find("<td")) {
        rest = &rest[start..];
        let Some(close) = rest.find('>') else { break };
        let after = &rest[close + 1..];
        let end_th = after.find("</th>");
        let end_td = after.find("</td>");
        let Some(end) = [end_th, end_td].into_iter().flatten().min() else { break };
        let value = decode_html(&strip_html(&after[..end]));
        if !value.is_empty() {
            cells.push(value);
        }
        rest = &after[end..];
    }
    cells
}

fn build_door_parcel(
    input_address: &str,
    candidate: &EasyMapDoorCandidate,
    description: &EasyMapBuildingDescription,
) -> ParcelInfo {
    let section_code = description
        .section_code
        .clone()
        .unwrap_or_else(|| if candidate.building_section_code.is_empty() { candidate.section_code.clone() } else { candidate.building_section_code.clone() });
    let section_name = description
        .section_name
        .clone()
        .unwrap_or_else(|| candidate.section_name.clone());
    let building_number = description
        .building_no
        .clone()
        .unwrap_or_else(|| candidate.building_no.clone());
    let land_no = normalize_land_no(Some(&candidate.land_no)).unwrap_or_else(|| candidate.land_no.clone());
    ParcelInfo {
        parcel_id: format!("{}-{}-{}", candidate.office, section_code, if building_number.is_empty() { &land_no } else { &building_number }),
        address: if candidate.doorplate.trim().is_empty() { input_address } else { &candidate.doorplate }.to_string(),
        lot_number: land_no,
        building_number,
        source: "easymap_r02".to_string(),
        trusted_for_pdf: false,
        section_name: Some(section_name),
        section_code: Some(section_code),
        land_office: Some(candidate.office.clone()),
        discovery_confidence: Some("high".to_string()),
        object_type: Some("building".to_string()),
        confirmation_state: Some("unconfirmed".to_string()),
        building_area_sqm: description.building_area_sqm.clone(),
        total_floor_count: description.total_floor_count.clone(),
        floor_label: description.floor_label.clone(),
        completion_date_roc: description.completion_date_roc.clone(),
        age_years: description.age_years.clone(),
        main_use: description.main_use.clone(),
    }
}

fn normalize_parcel_candidate_metadata(candidates: Vec<ParcelInfo>) -> Vec<ParcelInfo> {
    let confidence = if candidates.len() > 1 { "needs_selection" } else { "high" }.to_string();
    candidates
        .into_iter()
        .map(|mut candidate| {
            candidate.discovery_confidence = Some(confidence.clone());
            candidate.object_type = Some(if candidate.building_number.trim().is_empty() { "land" } else { "building" }.to_string());
            candidate.confirmation_state = Some("unconfirmed".to_string());
            candidate
        })
        .collect()
}

fn build_easy_map_parcels(
    input_address: &str,
    doorplate: &str,
    land: &EasyMapLandCandidate,
    description: &EasyMapLandDescription,
) -> Vec<ParcelInfo> {
    let confidence = if description.building_numbers.len() > 1 {
        "needs_selection"
    } else {
        "high"
    }
    .to_string();

    if description.building_numbers.is_empty() {
        return vec![ParcelInfo {
            parcel_id: format!("{}-{}-{}", land.office, land.section_code, land.land_no),
            address: if doorplate.trim().is_empty() { input_address } else { doorplate }.to_string(),
            lot_number: land.land_no.clone(),
            building_number: String::new(),
            source: "easymap_r02".to_string(),
            trusted_for_pdf: false,
            section_name: Some(land.section_name.clone()),
            section_code: Some(land.section_code.clone()),
            land_office: Some(land.office.clone()),
            discovery_confidence: Some(confidence),
            object_type: Some("land".to_string()),
            confirmation_state: Some("unconfirmed".to_string()),
            building_area_sqm: None,
            total_floor_count: None,
            floor_label: None,
            completion_date_roc: None,
            age_years: None,
            main_use: None,
        }];
    }

    description
        .building_numbers
        .iter()
        .map(|building_no| ParcelInfo {
            parcel_id: format!("{}-{}-{}", land.office, land.section_code, building_no),
            address: if doorplate.trim().is_empty() { input_address } else { doorplate }.to_string(),
            lot_number: land.land_no.clone(),
            building_number: building_no.clone(),
            source: "easymap_r02".to_string(),
            trusted_for_pdf: false,
            section_name: Some(land.section_name.clone()),
            section_code: Some(land.section_code.clone()),
            land_office: Some(land.office.clone()),
            discovery_confidence: Some(confidence.clone()),
            object_type: Some("building".to_string()),
            confirmation_state: Some("unconfirmed".to_string()),
            building_area_sqm: None,
            total_floor_count: None,
            floor_label: None,
            completion_date_roc: None,
            age_years: None,
            main_use: None,
        })
        .collect()
}

fn collect_single_quoted_values(input: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut rest = input;
    while let Some(start) = rest.find('\'') {
        let after_start = &rest[start + 1..];
        let Some(end) = after_start.find('\'') else {
            break;
        };
        values.push(after_start[..end].to_string());
        rest = &after_start[end + 1..];
    }
    values
}

fn json_string(value: &serde_json::Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(serde_json::Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn normalize_land_no(value: Option<&str>) -> Option<String> {
    let raw = value?;
    let digits = to_half_width_digits(raw)
        .chars()
        .filter(|ch| ch.is_ascii_digit())
        .collect::<String>();
    if digits.is_empty() {
        return None;
    }
    if digits.len() <= 4 {
        return Some(format!("{:0>4}0000", digits));
    }
    Some(format!("{:0>8}", digits).chars().rev().take(8).collect::<String>().chars().rev().collect())
}

fn format_easy_map_land_no_for_detail(value: &str) -> String {
    let digits = to_half_width_digits(value)
        .chars()
        .filter(|ch| ch.is_ascii_digit())
        .collect::<String>();
    if digits.is_empty() {
        return "0".to_string();
    }
    if digits.len() == 8 {
        let main = digits[..4].trim_start_matches('0');
        let sub = digits[4..].trim_start_matches('0');
        let main = if main.is_empty() { "0" } else { main };
        if sub.is_empty() {
            main.to_string()
        } else {
            format!("{main}-{sub}")
        }
    } else {
        let trimmed = digits.trim_start_matches('0');
        if trimmed.is_empty() { "0".to_string() } else { trimmed.to_string() }
    }
}

fn normalize_address_for_match(value: &str) -> String {
    to_half_width_digits(value)
        .replace('臺', "台")
        .replace(['里', '鄰', ' '], "")
        .trim()
        .to_string()
}

fn normalize_section_name(value: &str) -> String {
    value.trim().replace(char::is_whitespace, "").replacen('臺', "台", 1)
}

fn normalize_administrative_name(value: &str) -> String {
    value.trim().replace(char::is_whitespace, "").replacen('臺', "台", 1)
}

fn lookup_known_town_code(city_code: &str, town_name: &str) -> Option<String> {
    let key = format!("{}:{}", city_code, normalize_administrative_name(town_name));
    match key.as_str() {
        "D:東區" => Some("01".to_string()),
        "D:永康區" => Some("39".to_string()),
        "E:苓雅區" => Some("08".to_string()),
        "O:北區" | "O:新竹市" => Some("01".to_string()),
        _ => None,
    }
}

fn to_half_width_digits(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ('０'..='９').contains(&ch) {
                char::from_u32(ch as u32 - 0xfee0).unwrap_or(ch)
            } else {
                ch
            }
        })
        .collect()
}

fn decode_html(value: &str) -> String {
    value
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}

fn city_code_by_name(name: &str) -> Option<&'static str> {
    match name {
        "基隆市" => Some("C"),
        "臺北市" | "台北市" => Some("A"),
        "新北市" => Some("F"),
        "桃園市" => Some("H"),
        "新竹市" => Some("O"),
        "新竹縣" => Some("J"),
        "苗栗縣" => Some("K"),
        "臺中市" | "台中市" => Some("B"),
        "南投縣" => Some("M"),
        "彰化縣" => Some("N"),
        "雲林縣" => Some("P"),
        "嘉義市" => Some("I"),
        "嘉義縣" => Some("Q"),
        "臺南市" | "台南市" => Some("D"),
        "高雄市" => Some("E"),
        "屏東縣" => Some("T"),
        "宜蘭縣" => Some("G"),
        "花蓮縣" => Some("U"),
        "臺東縣" | "台東縣" => Some("V"),
        "澎湖縣" => Some("X"),
        "金門縣" => Some("W"),
        "連江縣" => Some("Z"),
        _ => None,
    }
}

fn normalize_text(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut in_tag = false;

    for ch in input.chars() {
        match ch {
            '<' => {
                in_tag = true;
                out.push('\n');
            }
            '>' => {
                in_tag = false;
                out.push('\n');
            }
            _ if in_tag => {}
            '\r' | '\t' | '\u{00a0}' => out.push(' '),
            _ => out.push(ch),
        }
    }

    out.lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn parse_candidate_blocks(text: &str) -> Vec<String> {
    let mut blocks = Vec::new();
    let mut current = Vec::new();

    for line in text.lines() {
        let is_new_result = line.starts_with("查詢結果") && !current.is_empty();
        if is_new_result {
            blocks.push(current.join("\n"));
            current.clear();
        }
        current.push(line.to_string());
    }

    if !current.is_empty() {
        blocks.push(current.join("\n"));
    }

    blocks
}

fn parse_candidate_block(block: &str) -> R02BuildingCandidate {
    R02BuildingCandidate {
        administrative_district: extract_label(block, "行政區"),
        land_office: extract_label(block, "地政事務所"),
        section_code: extract_section_code(block),
        section_name: extract_section_name(block),
        land_no: extract_label(block, "地號"),
        building_no: extract_label(block, "建號").map(|value| digits_only_or_original(&value)),
        building_area_sqm: extract_label(block, "建物面積")
            .map(|value| value.replace("平方公尺", "").trim().to_string()),
        total_floor_count: extract_label(block, "樓層數"),
        floor_label: extract_label(block, "樓層別"),
        completion_date_roc: extract_completion_date(block),
        age_years: extract_age_years(block),
        main_use: extract_label(block, "主要用途"),
    }
}

fn has_any_registry_signal(candidate: &R02BuildingCandidate) -> bool {
    candidate.administrative_district.is_some()
        || candidate.land_office.is_some()
        || candidate.section_code.is_some()
        || candidate.section_name.is_some()
        || candidate.land_no.is_some()
        || candidate.building_no.is_some()
}

fn extract_label(text: &str, label: &str) -> Option<String> {
    let labels = [
        "行政區",
        "地政事務所",
        "地段",
        "地號",
        "建號",
        "建物面積",
        "樓層數",
        "樓層別",
        "建物完成日期",
        "主要用途",
    ];
    let lines: Vec<&str> = text.lines().collect();

    for (idx, line) in lines.iter().enumerate() {
        let compact = line.replace('：', ":");
        if compact == label {
            return lines.get(idx + 1).map(|value| clean_value(value));
        }

        if let Some(value) = compact.strip_prefix(label) {
            let value = value.trim_start_matches(':').trim();
            if !value.is_empty() {
                return Some(clean_value(value));
            }
        }

        if let Some(pos) = compact.find(label) {
            let after = compact[pos + label.len()..].trim_start_matches(':').trim();
            if !after.is_empty() {
                let next_label_pos = labels
                    .iter()
                    .filter(|candidate| **candidate != label)
                    .filter_map(|candidate| after.find(candidate))
                    .min()
                    .unwrap_or(after.len());
                return Some(clean_value(&after[..next_label_pos]));
            }
        }
    }

    None
}

fn extract_section_code(text: &str) -> Option<String> {
    extract_label(text, "地段").and_then(|value| value.split_whitespace().next().map(str::to_string))
}

fn extract_section_name(text: &str) -> Option<String> {
    extract_label(text, "地段").map(|value| {
        let mut parts = value.split_whitespace();
        let first = parts.next().unwrap_or_default();
        let rest = parts.collect::<Vec<_>>().join(" ");
        if rest.is_empty() {
            first.to_string()
        } else {
            rest
        }
    })
}

fn extract_completion_date(text: &str) -> Option<String> {
    extract_label(text, "建物完成日期").and_then(|value| value.split_whitespace().next().map(str::to_string))
}

fn extract_age_years(text: &str) -> Option<String> {
    let value = extract_label(text, "建物完成日期")?;
    let start = value.find("屋齡")?;
    Some(value[start..].trim_matches(|ch| ch == '(' || ch == ')' || ch == '（' || ch == '）').to_string())
}

fn clean_value(value: &str) -> String {
    value
        .trim()
        .trim_matches('|')
        .trim()
        .replace("　", " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn digits_only_or_original(value: &str) -> String {
    let digits = value.chars().filter(|ch| ch.is_ascii_digit()).collect::<String>();
    if digits.is_empty() {
        value.trim().to_string()
    } else {
        digits
    }
}

fn required_missing_fields(candidate: &R02BuildingCandidate) -> Vec<String> {
    let mut missing = Vec::new();
    if candidate.section_code.as_deref().unwrap_or_default().is_empty() {
        missing.push("section_code".to_string());
    }
    if candidate.section_name.as_deref().unwrap_or_default().is_empty() {
        missing.push("section_name".to_string());
    }
    if candidate.building_no.as_deref().unwrap_or_default().is_empty() {
        missing.push("building_no".to_string());
    }
    missing
}

fn summarize_raw(text: &str) -> String {
    const MAX_CHARS: usize = 1200;
    text.chars().take(MAX_CHARS).collect()
}

fn build_registry_key(candidate: Option<&R02BuildingCandidate>) -> String {
    let section = candidate
        .and_then(|value| value.section_code.as_deref())
        .unwrap_or("unknown-section");
    let land = candidate
        .and_then(|value| value.land_no.as_deref())
        .unwrap_or("unknown-land");
    let building = candidate
        .and_then(|value| value.building_no.as_deref())
        .unwrap_or("unknown-building");
    format!("r02:{section}:{land}:{building}")
}

#[cfg(test)]
mod tests {
    use super::{
        discover_easymap_r02_address_with_base_url, parse_easy_map_land_description_html,
        parse_easy_map_land_by_coordinate_payload, parse_r02_result_text,
        record_easymap_r02_discovery, record_r02_result_text,
    };
    use crate::db::registry_query_runs::get_registry_query_run_row;
    use crate::db::tests::open_in_memory;
    use wiremock::matchers::{body_string_contains, method, path};
    use wiremock::{Match, Request};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    struct BodyStringNotContains(&'static str);

    impl Match for BodyStringNotContains {
        fn matches(&self, request: &Request) -> bool {
            std::str::from_utf8(&request.body)
                .map(|body| !body.contains(self.0))
                .unwrap_or(false)
        }
    }

    #[test]
    fn parses_old_r02_building_result_dialog_text() {
        let text = r#"
            查詢結果
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            建號 00204000
            建物面積 83.61 平方公尺
            樓層數 012
            樓層別 八層
            建物完成日期 0800829 (屋齡:約 34年)
            主要用途 住家用
        "#;

        let run = parse_r02_result_text("台南市東區裕農路288巷17號8樓之1", text).unwrap();
        let candidate = &run.candidates[0];

        assert_eq!(run.adapter, "easymap_r02_desktop");
        assert_eq!(run.parser_version, "r02-text-v1");
        assert_eq!(run.status, "candidate_unconfirmed");
        assert_eq!(run.total_cost_cents, 0);
        assert_eq!(candidate.administrative_district.as_deref(), Some("臺南市 東區"));
        assert_eq!(candidate.land_office.as_deref(), Some("東南地政事務所"));
        assert_eq!(candidate.section_code.as_deref(), Some("1556"));
        assert_eq!(candidate.section_name.as_deref(), Some("富強段"));
        assert_eq!(candidate.building_no.as_deref(), Some("00204000"));
        assert_eq!(candidate.building_area_sqm.as_deref(), Some("83.61"));
        assert_eq!(candidate.total_floor_count.as_deref(), Some("012"));
        assert_eq!(candidate.floor_label.as_deref(), Some("八層"));
        assert_eq!(candidate.completion_date_roc.as_deref(), Some("0800829"));
        assert_eq!(candidate.age_years.as_deref(), Some("屋齡:約 34年"));
        assert_eq!(candidate.main_use.as_deref(), Some("住家用"));
    }

    #[test]
    fn records_parse_failed_diagnostics_when_required_fields_missing() {
        let error = parse_r02_result_text(
            "台南市永康區勝利街 2 巷 92 弄 13 號",
            "查詢結果\n行政區 臺南市 永康區\n地政事務所 永康地政事務所",
        )
        .unwrap_err();

        assert_eq!(error.status, "r02_parse_failed");
        assert_eq!(error.error_code, "r02_required_fields_missing");
        assert_eq!(error.next_action, "manual_registry_key_required");
        assert!(error.missing_fields.contains(&"section_code".to_string()));
        assert!(error.missing_fields.contains(&"section_name".to_string()));
        assert!(error.missing_fields.contains(&"building_no".to_string()));
        assert!(error.raw_summary.contains("行政區"));
    }

    #[test]
    fn records_successful_r02_parse_to_query_run_table() {
        let conn = open_in_memory();
        let text = r#"
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            建號 00204000
            主要用途 住家用
        "#;

        let recorded = record_r02_result_text(
            &conn,
            Some("case-r02-001".to_string()),
            "台南市東區裕農路288巷17號8樓之1",
            text,
            1_779_648_000,
        )
        .unwrap();

        assert!(recorded.ok);
        let row = get_registry_query_run_row(&conn, &recorded.run_id).unwrap();
        assert_eq!(row.case_id.as_deref(), Some("case-r02-001"));
        assert_eq!(row.status, "candidate_unconfirmed");
        assert_eq!(row.total_cost_cents, 0);
        assert_eq!(row.section_code.as_deref(), Some("1556"));
        assert_eq!(row.building_no.as_deref(), Some("00204000"));
        let payload = row.r02_payload_json.expect("r02 parsed payload is saved");
        assert_eq!(payload["adapter"], "easymap_r02_desktop");
        assert_eq!(payload["candidates"][0]["section_code"], "1556");
        assert!(payload["raw_summary"].as_str().unwrap_or_default().contains("地段 1556 富強段"));
    }

    #[test]
    fn records_failed_r02_parse_to_query_run_table() {
        let conn = open_in_memory();

        let recorded = record_r02_result_text(
            &conn,
            None,
            "台南市永康區勝利街 2 巷 92 弄 13 號",
            "查詢結果\n行政區 臺南市 永康區",
            1_779_648_000,
        )
        .unwrap();

        assert!(!recorded.ok);
        let row = get_registry_query_run_row(&conn, &recorded.run_id).unwrap();
        assert_eq!(row.status, "r02_parse_failed");
        assert_eq!(row.total_cost_cents, 0);
        let error = row.error_summary_json.expect("r02 error diagnostics are saved");
        assert_eq!(error["errorCode"], "r02_required_fields_missing");
        assert_eq!(error["nextAction"], "manual_registry_key_required");
        assert!(error["rawSummary"].as_str().unwrap_or_default().contains("行政區"));
    }

    #[test]
    fn parses_easymap_coordinate_payload_and_land_description() {
        let land = parse_easy_map_land_by_coordinate_payload(r#"{
            "exec": "true",
            "cityName": "臺南市",
            "townName": "永康區",
            "cityCode": "D",
            "townCode": "05",
            "office": "DC",
            "sectNo": "0414",
            "sectName": "兵南段",
            "landNo": "414"
        }"#).expect("land candidate");

        assert_eq!(land.section_name, "兵南段");
        assert_eq!(land.land_no, "04140000");

        let desc = parse_easy_map_land_description_html(
            "getBuildDetail('D','0414','00084000'); getBuildDetail('D','0414','00085000');",
        );
        assert_eq!(desc.building_numbers, vec!["00084000", "00085000"]);
    }

    #[test]
    fn extracts_real_struts_token_not_token_name_marker() {
        let html = r#"
            <input type="hidden" name="struts.token.name" value="token" />
            <input type="hidden" name="token" value="2AWSP39IV76NCX30Y342T1WXNSS5WJAT" />
        "#;

        assert_eq!(
            super::extract_token(html).as_deref(),
            Some("2AWSP39IV76NCX30Y342T1WXNSS5WJAT"),
        );
    }

    #[tokio::test]
    async fn live_r02_client_discovers_doorplate_without_paid_cop_and_records_evidence() {
        let server = MockServer::start().await;
        mount_token(&server).await;
        Mock::given(method("GET"))
            .and(path("/Index"))
            .respond_with(ResponseTemplate::new(200).insert_header("set-cookie", "JSESSIONID=test; Path=/"))
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/Door_json_getDoorList"))
            .and(body_string_contains("lane=58"))
            .and(BodyStringNotContains("laneName"))
            .and(BodyStringNotContains("alleyName"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "results": [{
                    "Road": "勝利街５８巷４號",
                    "srcRoad": "勝利街５８巷４號",
                    "City": "D",
                    "towncode": "39",
                    "office": "DK",
                    "sectno": "9125",
                    "sectName": "兵南段",
                    "landno": "414",
                    "buildsectno": "9125",
                    "buildno": "00084000",
                    "mergeSameDoorCount": 0
                }],
                "msg": ""
            })))
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/BuildingDesc_ajax_detail"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"
                <table>
                  <tr><th>地段</th><td>9125 兵南段</td></tr>
                  <tr><th>建號</th><td>00084000</td></tr>
                  <tr><th>建物面積</th><td>128.21 平方公尺</td></tr>
                  <tr><th>樓層數</th><td>003</td></tr>
                  <tr><th>樓層別</th><td>一層，二層，三層，騎樓，電梯樓梯間</td></tr>
                  <tr><th>建物完成日期</th><td>0710804 (屋齡:約 43年)</td></tr>
                  <tr><th>主要用途</th><td>住商用</td></tr>
                </table>
                "#,
            ))
            .mount(&server)
            .await;

        let discovery = discover_easymap_r02_address_with_base_url(
            server.uri(),
            "台南市永康區勝利街58巷4號",
        )
        .await
        .expect("r02 discovery should succeed");

        assert_eq!(discovery.parcels.len(), 1);
        assert_eq!(discovery.parcels[0].source, "easymap_r02");
        assert_eq!(discovery.parcels[0].trusted_for_pdf, false);
        assert_eq!(discovery.parcels[0].address, "勝利街５８巷４號");
        assert_eq!(discovery.parcels[0].section_name.as_deref(), Some("兵南段"));
        assert_eq!(discovery.parcels[0].lot_number, "04140000");
        assert_eq!(discovery.parcels[0].building_number, "00084000");
        assert_eq!(discovery.run.total_cost_cents, 0);

        let conn = open_in_memory();
        let recorded = record_easymap_r02_discovery(
            &conn,
            None,
            Ok(discovery),
            "台南市永康區勝利街58巷4號",
            1_779_648_000,
        )
        .expect("record discovery");
        let row = get_registry_query_run_row(&conn, &recorded.run_id).expect("run row");
        assert_eq!(row.status, "candidate_unconfirmed");
        assert_eq!(row.total_cost_cents, 0);
        assert_eq!(row.section_name.as_deref(), Some("兵南段"));
        assert_eq!(row.land_no.as_deref(), Some("04140000"));
        assert_eq!(row.building_no.as_deref(), Some("00084000"));
        assert_eq!(row.r02_payload_json.as_ref().unwrap()["adapter"], "easymap_r02_desktop");
    }

    #[tokio::test]
    async fn live_r02_client_records_manual_required_without_paid_cop_when_no_candidate() {
        let server = MockServer::start().await;
        mount_token(&server).await;
        Mock::given(method("GET"))
            .and(path("/Index"))
            .respond_with(ResponseTemplate::new(200))
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/Door_json_getDoorList"))
            .respond_with(ResponseTemplate::new(200).set_body_string(""))
            .mount(&server)
            .await;

        let discovery = discover_easymap_r02_address_with_base_url(
            server.uri(),
            "高雄市苓雅區苓雅路二段18巷8弄2號",
        )
        .await;
        assert!(discovery.is_err());

        let conn = open_in_memory();
        let recorded = record_easymap_r02_discovery(
            &conn,
            None,
            discovery,
            "高雄市苓雅區苓雅路二段18巷8弄2號",
            1_779_648_000,
        )
        .expect("record manual required");
        let row = get_registry_query_run_row(&conn, &recorded.run_id).expect("run row");
        assert_eq!(row.status, "manual_required");
        assert_eq!(row.total_cost_cents, 0);
        assert!(row.r02_payload_json.is_none());
        assert_eq!(row.error_summary_json.as_ref().unwrap()["errorCode"], "easymap_r02_no_candidate");
    }

    async fn mount_token(server: &MockServer) {
        Mock::given(method("POST"))
            .and(path("/pages/setToken.jsp"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"<input type="hidden" name="token" value="test-token">"#,
            ))
            .mount(server)
            .await;
    }
}
