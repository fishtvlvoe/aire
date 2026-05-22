use aire_lib::land_registry::{
    apis::{
        address_to_parcel::AddressToParcelApi,
        post_json_with_key, require_api_key, StaticApiKeyProvider,
    },
    billing_log::BillingLog,
    cache::LandRegistryCache,
    pull::land_registry_pull_data_core,
};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::sync::Arc;

const ADDRESS: &str = "台南市東區裕農路288巷17號8樓之1";
const OUTPUT_PATH: &str = "/tmp/aire-yunong-live-api.json";
const DOWNLOAD_OUTPUT_PATH: &str = "/Users/fishtv/Downloads/裕農路-live-api.json";
const OFFICE_UNIT: &str = "DC";
const SECTION: &str = "1556";
const LAND_NO: &str = "00700000";
const LNG: &str = "120.22908";
const LAT: &str = "22.986314";

fn land_parcel_id() -> String {
    format!("{OFFICE_UNIT}-{SECTION}-{LAND_NO}")
}

fn building_parcel_ids() -> Vec<String> {
    ["00165000", "00167000", "00229000", "00230000"]
        .iter()
        .map(|no| format!("{OFFICE_UNIT}-{SECTION}-{no}"))
        .collect()
}

fn required_env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is required"))
}

fn parcel_parts(parcel_id: &str) -> (&str, &str, &str) {
    let parts: Vec<&str> = parcel_id.splitn(3, '-').collect();
    assert_eq!(parts.len(), 3, "invalid parcel id: {parcel_id}");
    (parts[0], parts[1], parts[2])
}

fn str_field<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a str> {
    keys.iter().find_map(|key| value.get(*key).and_then(Value::as_str))
}

fn land_ids_from_building_registry(result: &Value) -> Vec<String> {
    let mut ids = BTreeSet::new();
    let Some(rows) = result
        .get("building_registry")
        .and_then(|api| api.get("data"))
        .and_then(|data| data.get("base_land_numbers"))
        .and_then(Value::as_array)
    else {
        return vec![];
    };

    for row in rows {
        let unit = str_field(row, &["UNIT", "unit", "LANDUNIT", "land_unit"]);
        let sec = str_field(row, &["SEC", "sec", "LANDSEC", "land_sec"]);
        let no = str_field(row, &["NO", "no", "LANDNO", "land_no"]);
        if let (Some(unit), Some(sec), Some(no)) = (unit, sec, no) {
            ids.insert(format!("{unit}-{sec}-{no}"));
        }
    }

    ids.into_iter().collect()
}

async fn raw_post(
    http_client: &reqwest::Client,
    base_url: &str,
    credentials: &aire_lib::land_registry::apis::ApiCredentials,
    service_id: &str,
    service_name: &str,
    endpoint_path: &str,
    payload: Value,
    input_source: &str,
) -> Value {
    let result = post_json_with_key(
        http_client,
        base_url,
        endpoint_path,
        credentials,
        &payload,
    )
    .await;

    match result {
        Ok((http_status, response)) => json!({
            "service_id": service_id,
            "service_name": service_name,
            "endpoint_path": endpoint_path,
            "input_source": input_source,
            "payload": payload,
            "http_status": http_status,
            "cop_status": response.get("STATUS").cloned(),
            "cop_code": response.get("CODE").cloned(),
            "cop_message": response.get("MESSAGE").cloned(),
            "return_rows": response.get("RETURNROWS").cloned(),
            "success": response.get("STATUS").and_then(Value::as_i64) == Some(1),
            "response": response,
        }),
        Err(error) => json!({
            "service_id": service_id,
            "service_name": service_name,
            "endpoint_path": endpoint_path,
            "input_source": input_source,
            "payload": payload,
            "success": false,
            "error": error.to_string(),
        }),
    }
}

#[tokio::test]
#[ignore]
async fn yunong_address_all_supported_moi_api_live_dump() {
    let base_url = std::env::var("LAND_REGISTRY_API_BASE_URL")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/api".to_string());
    let token_endpoint = std::env::var("LAND_REGISTRY_TOKEN_ENDPOINT")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/getToken".to_string());
    let key_provider = Arc::new(StaticApiKeyProvider::with_token_endpoint(
        required_env("LAND_REGISTRY_CLIENT_ID"),
        required_env("LAND_REGISTRY_CLIENT_SECRET"),
        token_endpoint,
    ));

    let cache = LandRegistryCache::new_in_memory();
    let query_date_provider = Arc::new(move || "2026-05-22".to_string());
    let address_api = AddressToParcelApi::new(
        base_url.clone(),
        cache,
        key_provider.clone(),
        query_date_provider,
    );
    let credentials = require_api_key(key_provider.as_ref()).unwrap();
    let http_client = reqwest::Client::new();
    let raw_address_payloads = vec![
        json!([{"CITY": "D", "ADDRESS": ADDRESS}]),
        json!([{"CITY": "D", "ADDRESS": "臺南市東區裕農路288巷17號8樓之1"}]),
        json!([{"CITY": "D", "ADDRESS": "台南市東區裕農路288巷17號"}]),
        json!([{"CITY": "D", "ADDRESS": "臺南市東區裕農路288巷17號"}]),
        json!([{"CITY": "D", "ADDRESS": "東區裕農路288巷17號8樓之1"}]),
        json!([{"CITY": "D", "ADDRESS": "裕農路288巷17號8樓之1"}]),
        json!([{"CITY": "D", "ADDRESS": "裕農路288巷17號"}]),
    ];
    let mut raw_address_attempts = vec![];
    for payload in &raw_address_payloads {
        let result = post_json_with_key(
            &http_client,
            &base_url,
            "/BuildingNo/1.0/QueryByAddress",
            &credentials,
            payload,
        )
        .await;
        match result {
            Ok((status, response)) => raw_address_attempts.push(json!({
                "payload": payload,
                "http_status": status,
                "response": response,
            })),
            Err(error) => raw_address_attempts.push(json!({
                "payload": payload,
                "error": error.to_string(),
            })),
        }
    }

    let building_parcels = address_api.lookup(ADDRESS).await.unwrap();
    println!("address_to_parcel count={}", building_parcels.len());
    for parcel in &building_parcels {
        println!("building parcel={}", parcel.parcel_id);
    }

    let building_api_ids = vec![
        "building_registry".to_string(),
        "building_ownership".to_string(),
        "building_other_rights".to_string(),
    ];
    let land_api_ids = vec![
        "land_registry".to_string(),
        "zoning".to_string(),
        "land_value".to_string(),
        "co_owners".to_string(),
        "mortgages".to_string(),
    ];
    let all_api_ids = [
        building_api_ids.clone(),
        land_api_ids.clone(),
    ]
    .concat();

    let billing_log = BillingLog::new_in_memory();
    let mut parcel_runs = vec![];
    let mut discovered_land_ids = BTreeSet::new();
    let public_land_id = land_parcel_id();
    let public_building_ids = building_parcel_ids();

    for parcel in &building_parcels {
        let building_result = land_registry_pull_data_core(
            parcel.parcel_id.clone(),
            building_api_ids.clone(),
            &base_url,
            &billing_log,
            key_provider.clone(),
        )
        .await;
        let building_results_value = serde_json::to_value(&building_result.results).unwrap();
        for land_id in land_ids_from_building_registry(&building_results_value) {
            discovered_land_ids.insert(land_id);
        }
        parcel_runs.push(json!({
            "parcel_kind": "building",
            "parcel_id": parcel.parcel_id,
            "source_address": parcel.address,
            "api_ids": building_api_ids,
            "total_cost": building_result.total_cost,
            "results": building_result.results,
        }));
    }

    for parcel_id in &public_building_ids {
        if building_parcels.iter().any(|parcel| &parcel.parcel_id == parcel_id) {
            continue;
        }

        let building_result = land_registry_pull_data_core(
            parcel_id.clone(),
            building_api_ids.clone(),
            &base_url,
            &billing_log,
            key_provider.clone(),
        )
        .await;
        let building_results_value = serde_json::to_value(&building_result.results).unwrap();
        for land_id in land_ids_from_building_registry(&building_results_value) {
            discovered_land_ids.insert(land_id);
        }
        parcel_runs.push(json!({
            "parcel_kind": "building_public_fallback",
            "parcel_id": parcel_id,
            "source": "twzipcode address page listed ground building numbers for this address; unit/section derived from Tainan land-section open data",
            "api_ids": building_api_ids,
            "total_cost": building_result.total_cost,
            "results": building_result.results,
        }));
    }

    if discovered_land_ids.is_empty() {
        for parcel in &building_parcels {
            let fallback_result = land_registry_pull_data_core(
                parcel.parcel_id.clone(),
                land_api_ids.clone(),
                &base_url,
                &billing_log,
                key_provider.clone(),
            )
            .await;
            parcel_runs.push(json!({
                "parcel_kind": "land_fallback_using_building_id",
                "parcel_id": parcel.parcel_id,
                "api_ids": land_api_ids,
                "total_cost": fallback_result.total_cost,
                "results": fallback_result.results,
            }));
        }

        let public_land_result = land_registry_pull_data_core(
            public_land_id.clone(),
            land_api_ids.clone(),
            &base_url,
            &billing_log,
            key_provider.clone(),
        )
        .await;
        parcel_runs.push(json!({
            "parcel_kind": "land_public_fallback",
            "parcel_id": public_land_id,
            "source": "twzipcode address page lists 台南市東區富強段0070-0000; Tainan open data lists 富強段 code 1556 under 東南地政事務所",
            "api_ids": land_api_ids,
            "total_cost": public_land_result.total_cost,
            "results": public_land_result.results,
        }));
    } else {
        for land_id in &discovered_land_ids {
            let land_result = land_registry_pull_data_core(
                land_id.clone(),
                land_api_ids.clone(),
                &base_url,
                &billing_log,
                key_provider.clone(),
            )
            .await;
            parcel_runs.push(json!({
                "parcel_kind": "land",
                "parcel_id": land_id,
                "api_ids": land_api_ids,
                "total_cost": land_result.total_cost,
                "results": land_result.results,
            }));
        }
    }

    let (land_unit, land_sec, land_no) = parcel_parts(&public_land_id);
    let raw_land_payload = json!([{"UNIT": land_unit, "SEC": land_sec, "NO": land_no}]);
    let raw_land_sec_payload = json!([{"UNIT": land_unit, "SEC": land_sec}]);
    let raw_xy_payload = json!([{"X": LNG, "Y": LAT, "SRS": "EPSG:4326"}]);
    let mut raw_moi_endpoint_attempts = vec![
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_007",
            "地號資料服務-以地段查詢",
            "/LandNo/1.0/QueryBySec",
            raw_land_sec_payload.clone(),
            "public land section candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_007",
            "地號資料服務-以坐標查詢",
            "/LandNo/1.0/QueryByXY",
            raw_xy_payload,
            "twzipcode coordinate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_011",
            "新舊地號資料服務-新號查舊號",
            "/OldNewNo/1.0/QueryLandNo",
            json!([{"UNIT": land_unit, "SEC": land_sec, "NO": land_no, "TYPE": "O"}]),
            "public land candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_011",
            "新舊地號資料服務-舊號查新號",
            "/OldNewNo/1.0/QueryLandNo",
            json!([{"UNIT": land_unit, "SEC": land_sec, "NO": land_no, "TYPE": "N"}]),
            "public land candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_015",
            "建號資料服務-以地號查詢",
            "/BuildingNo/1.0/QueryByLandNo",
            raw_land_payload.clone(),
            "public land candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_040",
            "分割合併前後地建號資料服務-以地段查詢",
            "/DivisionMergeNo/1.0/QueryBySEC",
            raw_land_sec_payload.clone(),
            "public land section candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_040",
            "分割合併前後地建號資料服務-以地號查詢",
            "/DivisionMergeNo/1.0/QueryLandNo",
            raw_land_payload.clone(),
            "public land candidate",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_041",
            "帳務查詢API-未出帳金額",
            "/Bill/1.0/GetUnBilled",
            json!([]),
            "account credentials",
        )
        .await,
        raw_post(
            &http_client,
            &base_url,
            &credentials,
            "MOI_API_041",
            "帳務查詢API-未繳費帳單",
            "/Bill/1.0/GetUnPaid",
            json!([]),
            "account credentials",
        )
        .await,
    ];

    for parcel_id in &public_building_ids {
        let (unit, sec, no) = parcel_parts(parcel_id);
        let build_payload = json!([{"UNIT": unit, "SEC": sec, "NO": no}]);
        raw_moi_endpoint_attempts.push(
            raw_post(
                &http_client,
                &base_url,
                &credentials,
                "MOI_API_011",
                "新舊建號資料服務-新號查舊號",
                "/OldNewNo/1.0/QueryBuildNo",
                json!([{"UNIT": unit, "SEC": sec, "NO": no, "TYPE": "O"}]),
                "public building candidate",
            )
            .await,
        );
        raw_moi_endpoint_attempts.push(
            raw_post(
                &http_client,
                &base_url,
                &credentials,
                "MOI_API_038",
                "車位查詢服務-以建號查詢",
                "/Parking/1.0/QueryByBuildNo",
                build_payload.clone(),
                "public building candidate",
            )
            .await,
        );
        raw_moi_endpoint_attempts.push(
            raw_post(
                &http_client,
                &base_url,
                &credentials,
                "MOI_API_040",
                "分割合併前後地建號資料服務-以建號查詢",
                "/DivisionMergeNo/1.0/QueryBuildingNo",
                build_payload.clone(),
                "public building candidate",
            )
            .await,
        );
        raw_moi_endpoint_attempts.push(
            raw_post(
                &http_client,
                &base_url,
                &credentials,
                "MOI_API_046",
                "三維地籍建號定位點資料服務-以建號查詢",
                "/BuildingAnchor/1.0/QueryByBuildNo",
                build_payload,
                "public building candidate",
            )
            .await,
        );
    }

    let skipped_moi_endpoints = vec![
        json!({
            "service_id": "MOI_API_009",
            "service_name": "所有權人比對服務",
            "reason": "本案沒有屋主姓名或身分證字號；系統不應猜測私人資料，只能待屋主或正式文件提供後比對。",
        }),
        json!({
            "service_id": "MOI_API_012",
            "service_name": "全國土地基本資料庫代碼資料服務",
            "reason": "此 SR 使用已爬取文件與臺南市開放資料取得代碼；AIRE 尚未有此 API client，未在本次 live runner 產品化。",
        }),
    ];

    let billing_entries: Vec<Value> = billing_log
        .entries()
        .iter()
        .map(|entry| {
            json!({
                "parcel_id": entry.parcel_id(),
                "api_id": entry.api_id(),
                "cost": entry.cost(),
                "timestamp": entry.timestamp(),
                "transaction_id": entry.transaction_id(),
            })
        })
        .collect();

    let total_cost: f64 = billing_entries
        .iter()
        .filter_map(|entry| entry.get("cost").and_then(Value::as_f64))
        .sum();
    let summary = json!({
        "address": ADDRESS,
        "base_url": base_url,
        "external_reference_inputs": {
            "twzipcode_url": "https://twzipcode.com/zipcode-8063287-%E5%8F%B0%E5%8D%97%E5%B8%82%E6%9D%B1%E5%8D%80%E5%AF%8C%E5%BC%B7%E9%87%8C%E8%A3%95%E8%BE%B2%E8%B7%AF288%E5%B7%B717%E8%99%9F.html",
            "address_from_reference": "台南市東區富強里裕農路288巷17號",
            "coordinate": {"longitude": LNG, "latitude": LAT, "srs": "EPSG:4326"},
            "land_office": "東南地政事務所",
            "land_section": "富強段",
            "section_code": SECTION,
            "candidate_land_ids": [land_parcel_id()],
            "candidate_building_ids": public_building_ids,
        },
        "api_scope": {
            "address_lookup": "address_to_parcel",
            "building_api_ids": building_api_ids,
            "land_api_ids": land_api_ids,
            "all_supported_api_ids": all_api_ids,
        },
        "raw_address_attempts": raw_address_attempts,
        "building_parcels": building_parcels,
        "discovered_land_ids": discovered_land_ids.into_iter().collect::<Vec<_>>(),
        "parcel_runs": parcel_runs,
        "raw_moi_endpoint_attempts": raw_moi_endpoint_attempts,
        "skipped_moi_endpoints": skipped_moi_endpoints,
        "billing_entries": billing_entries,
        "total_billing_log_cost": total_cost,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });

    std::fs::write(OUTPUT_PATH, serde_json::to_string_pretty(&summary).unwrap()).unwrap();
    std::fs::write(DOWNLOAD_OUTPUT_PATH, serde_json::to_string_pretty(&summary).unwrap()).unwrap();
    println!("wrote {OUTPUT_PATH}");
}
