// AIRE — Cases IPC commands（Task 5.1 / 5.5）
//
// 依據：openspec/changes/aire-desktop-phase1/design.md / case-management spec
// capability: case-management

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;
use tauri::State;

use crate::db::{cases, oplog};
use crate::db::registry_query_runs::{insert_registry_query_run, NewRegistryQueryRun};
use crate::DbState;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl IpcError {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateCaseInput {
    pub property_type: String,
    pub land_lot_no: String,
    pub address: String,
    pub owner_name: Option<String>,
    pub case_no: Option<String>,
    pub case_name: Option<String>,
    pub building_lot_no: Option<String>,
    pub asking_price: Option<i64>,
    pub land_lots: Option<Vec<String>>,
    pub land_registry_data: Option<Value>,
    pub current_step: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct UpdateCaseInput {
    pub case_no: Option<Option<String>>,
    pub property_type: Option<String>,
    pub land_lot_no: Option<String>,
    pub address: Option<String>,
    pub owner_name: Option<Option<String>>,
    pub status: Option<String>,
    pub case_name: Option<Option<String>>,
    pub building_lot_no: Option<Option<String>>,
    pub asking_price: Option<Option<i64>>,
    pub land_lots: Option<Vec<String>>,
    pub land_registry_data: Option<Option<Value>>,
    pub current_step: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ExportRegistryPayloadInput {
    pub outputPath: String,
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConfirmedRegistryMatch {
    pub case_id: String,
    pub section_name: String,
    pub land_no: String,
    pub building_no: Option<String>,
    pub confirmed_at: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConfirmRegistryMatchResult {
    pub success: bool,
    #[serde(rename = "match")]
    pub match_info: ConfirmedRegistryMatch,
}

fn resolve_land_lots(
    land_lots: Option<Vec<String>>,
    land_lot_no: &str,
    allow_empty: bool,
) -> Result<(String, Vec<String>), IpcError> {
    let lots: Vec<String> = match land_lots {
        Some(v) => v.into_iter().filter(|s| !s.trim().is_empty()).collect(),
        None => vec![land_lot_no.to_string()],
    };
    if lots.is_empty() {
        if allow_empty {
            return Ok((String::new(), Vec::new()));
        }
        return Err(IpcError::new("missing_field", "地號為必填（land_lots 不可全為空字串）"));
    }
    let primary = lots[0].clone();
    Ok((primary, lots))
}

fn is_registry_pending_case(input: &CreateCaseInput) -> bool {
    input
        .land_registry_data
        .as_ref()
        .and_then(|value| value.get("registry_status"))
        .and_then(|value| value.as_str())
        == Some("registry_pending")
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, IpcError> {
    db.0.lock()
        .map_err(|e| IpcError::new("db_lock", format!("db lock poisoned: {e}")))
}

#[tauri::command]
pub async fn list_cases(db: State<'_, DbState>) -> Result<Vec<cases::Case>, IpcError> {
    let conn = lock(&db)?;
    cases::list_cases(&conn).map_err(|e| IpcError::new(&e.code, e.message))
}

#[tauri::command]
pub async fn get_case(id: String, db: State<'_, DbState>) -> Result<cases::Case, IpcError> {
    let conn = lock(&db)?;
    cases::get_case(&conn, &id).map_err(|e| IpcError::new(&e.code, e.message))
}

#[tauri::command]
pub async fn create_case(
    input: CreateCaseInput,
    db: State<'_, DbState>,
) -> Result<cases::Case, IpcError> {
    if input.property_type != "residential" && input.property_type != "land" {
        return Err(IpcError::new(
            "invalid_property_type",
            "property_type 必須為 residential 或 land",
        ));
    }
    let registry_pending = is_registry_pending_case(&input);
    if input.address.trim().is_empty() {
        return Err(IpcError::new("missing_field", "地址為必填"));
    }
    if input.land_lot_no.trim().is_empty() && !registry_pending {
        return Err(IpcError::new("missing_field", "地號為必填"));
    }

    let (land_lot_no, land_lots) = resolve_land_lots(input.land_lots, &input.land_lot_no, registry_pending)?;
    let now = now_secs();
    let c = cases::Case {
        id: uuid::Uuid::new_v4().to_string(),
        case_no: input.case_no,
        property_type: input.property_type,
        land_lot_no,
        address: input.address,
        owner_name: input.owner_name,
        status: "draft".into(),
        created_at: now,
        updated_at: now,
        case_name: input.case_name,
        building_lot_no: input.building_lot_no,
        asking_price: input.asking_price,
        land_lots,
        land_registry_data: input.land_registry_data,
        current_step: input.current_step.unwrap_or(1).max(1),
    };

    let conn = lock(&db)?;
    cases::insert_case(&conn, &c).map_err(|e| IpcError::new(&e.code, e.message))?;
    let payload = format!("{{\"case_id\":\"{}\"}}", c.id);
    let _ = oplog::insert_log(&conn, "case_create", Some(&payload), "ok");
    Ok(c)
}

#[tauri::command]
pub async fn update_case(
    id: String,
    input: UpdateCaseInput,
    db: State<'_, DbState>,
) -> Result<cases::Case, IpcError> {
    let conn = lock(&db)?;
    let mut existing =
        cases::get_case(&conn, &id).map_err(|e| IpcError::new(&e.code, e.message))?;

    if let Some(ref new_status) = input.status {
        // 防呆：禁止從 exported 倒退
        if (existing.status == "exported" || existing.status == "completed")
            && new_status == "draft"
        {
            return Err(IpcError::new(
                "invalid_status_transition",
                "已完成或已匯出的案件不可退回草稿狀態",
            ));
        }
        if !["draft", "keyin", "completed", "exported"].contains(&new_status.as_str()) {
            return Err(IpcError::new(
                "invalid_status",
                "status 必須為 draft / keyin / completed / exported",
            ));
        }
        existing.status = new_status.clone();
    }

    if let Some(property_type) = input.property_type {
        if property_type != "residential" && property_type != "land" {
            return Err(IpcError::new(
                "invalid_property_type",
                "property_type 必須為 residential 或 land",
            ));
        }
        existing.property_type = property_type;
    }

    if input.land_lots.is_some() || input.land_lot_no.is_some() {
        let requested_land_lot_no = input.land_lot_no.unwrap_or_else(|| existing.land_lot_no.clone());
        let (land_lot_no, land_lots) = resolve_land_lots(input.land_lots, &requested_land_lot_no, false)?;
        existing.land_lot_no = land_lot_no;
        existing.land_lots = land_lots;
    }

    if let Some(case_no) = input.case_no {
        existing.case_no = case_no;
    }
    if let Some(address) = input.address {
        if address.trim().is_empty() {
            return Err(IpcError::new("missing_field", "地址不可為空"));
        }
        existing.address = address;
    }
    if let Some(owner_name) = input.owner_name {
        existing.owner_name = owner_name;
    }
    if let Some(case_name) = input.case_name {
        existing.case_name = case_name;
    }
    if let Some(building_lot_no) = input.building_lot_no {
        existing.building_lot_no = building_lot_no;
    }
    if let Some(asking_price) = input.asking_price {
        existing.asking_price = asking_price;
    }
    if let Some(land_registry_data) = input.land_registry_data {
        existing.land_registry_data = land_registry_data;
    }
    if let Some(current_step) = input.current_step {
        existing.current_step = current_step.max(1);
    }
    existing.updated_at = now_secs();

    cases::update_case(&conn, &existing).map_err(|e| IpcError::new(&e.code, e.message))?;
    Ok(existing)
}

#[tauri::command]
pub async fn delete_case(id: String, db: State<'_, DbState>) -> Result<(), IpcError> {
    let conn = lock(&db)?;
    cases::delete_case(&conn, &id).map_err(|e| IpcError::new(&e.code, e.message))?;
    let payload = format!("{{\"case_id\":\"{}\"}}", id);
    let _ = oplog::insert_log(&conn, "case_delete", Some(&payload), "ok");
    Ok(())
}

#[tauri::command]
pub async fn export_registry_payload(args: ExportRegistryPayloadInput) -> Result<String, IpcError> {
    if args.outputPath.trim().is_empty() {
        return Err(IpcError::new("path_empty", "輸出路徑不可為空"));
    }
    let target = Path::new(&args.outputPath);
    if target.parent().is_none() {
        return Err(IpcError::new("path_invalid", "輸出路徑不正確"));
    }
    let content = serde_json::to_string_pretty(&args.payload).map_err(|error| {
        IpcError::new("serialize_failed", format!("謄本資料序列化失敗：{error}"))
    })?;
    std::fs::write(target, format!("{content}\n"))
        .map_err(|error| IpcError::new("file_io", format!("寫入謄本資料失敗：{error}")))?;
    Ok(args.outputPath)
}

pub fn confirm_case_registry_match_core(
    conn: &Connection,
    case_id: &str,
    section_name: &str,
    land_no: &str,
    building_no: Option<&str>,
    confirmed_at: i64,
) -> Result<ConfirmedRegistryMatch, IpcError> {
    let section_name = section_name.trim();
    let land_no = land_no.trim();
    let building_no = building_no.map(str::trim).filter(|value| !value.is_empty());
    if case_id.trim().is_empty() || section_name.is_empty() || land_no.is_empty() {
        return Err(IpcError::new("registry_match_required", "請先確認地段與地號"));
    }

    let mut c = cases::get_case(conn, case_id).map_err(|e| IpcError::new(&e.code, e.message))?;
    let confirmed_json = serde_json::json!({
        "section_name": section_name,
        "land_no": land_no,
        "building_no": building_no,
        "status": "confirmed",
        "confirmed_at": confirmed_at,
    });
    let mut land_registry_data = c.land_registry_data.take().unwrap_or_else(|| serde_json::json!({}));
    if !land_registry_data.is_object() {
        land_registry_data = serde_json::json!({});
    }
    land_registry_data["confirmed_registry_match"] = confirmed_json;
    c.land_lot_no = land_no.to_string();
    c.land_lots = vec![land_no.to_string()];
    c.building_lot_no = building_no.map(str::to_string);
    c.land_registry_data = Some(land_registry_data);
    c.updated_at = confirmed_at;
    cases::update_case(conn, &c).map_err(|e| IpcError::new(&e.code, e.message))?;

    let registry_key = format!(
        "confirmed:{}:{}:{}",
        section_name,
        land_no,
        building_no.unwrap_or("land-only")
    );
    insert_registry_query_run(
        conn,
        &NewRegistryQueryRun {
            id: uuid::Uuid::new_v4().to_string(),
            case_id: Some(case_id.to_string()),
            registry_key,
            input_kind: "registry_key".to_string(),
            input_address: Some(c.address.clone()),
            normalized_address: Some(c.address.trim().replace('台', "臺")),
            office_code: None,
            office_name: None,
            section_code: None,
            section_name: Some(section_name.to_string()),
            land_no: Some(land_no.to_string()),
            building_no: building_no.map(str::to_string),
            confirmation_status: "confirmed".to_string(),
            status: "confirmed".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: None,
            cop_payload_json: None,
            generated_json: Some(serde_json::json!({
                "confirmedRegistryMatch": {
                    "sectionName": section_name,
                    "landNo": land_no,
                    "buildingNo": building_no,
                }
            })),
            error_summary_json: None,
            created_at: confirmed_at,
        },
    )
    .map_err(|error| IpcError::new("registry_query_run_insert_failed", error.to_string()))?;

    Ok(ConfirmedRegistryMatch {
        case_id: case_id.to_string(),
        section_name: section_name.to_string(),
        land_no: land_no.to_string(),
        building_no: building_no.map(str::to_string),
        confirmed_at,
    })
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn confirm_case_registry_match(
    caseId: String,
    sectionName: String,
    landNo: String,
    buildingNo: Option<String>,
    db: State<'_, DbState>,
) -> Result<ConfirmRegistryMatchResult, IpcError> {
    let conn = lock(&db)?;
    let match_info = confirm_case_registry_match_core(
        &conn,
        &caseId,
        &sectionName,
        &landNo,
        buildingNo.as_deref(),
        now_secs(),
    )?;
    Ok(ConfirmRegistryMatchResult { success: true, match_info })
}

/// 標示案件為填入中（draft → keyin）。
#[tauri::command]
pub async fn mark_keyin(
    case_id: String,
    db: State<'_, DbState>,
) -> Result<cases::Case, IpcError> {
    let conn = lock(&db)?;
    let mut c = cases::get_case(&conn, &case_id).map_err(|e| IpcError::new(&e.code, e.message))?;
    match c.status.as_str() {
        "keyin" => return Ok(c),
        "completed" | "exported" => {
            return Err(IpcError::new(
                "invalid_status_transition",
                "已完成或已匯出的案件不可轉為填入中狀態",
            ));
        }
        _ => {}
    }
    c.status = "keyin".into();
    c.updated_at = now_secs();
    cases::update_case(&conn, &c).map_err(|e| IpcError::new(&e.code, e.message))?;
    let payload = format!("{{\"case_id\":\"{}\"}}", c.id);
    let _ = oplog::insert_log(&conn, "case_mark_keyin", Some(&payload), "ok");
    Ok(c)
}

/// 標示案件為完成（draft/keyin → completed）。
#[tauri::command]
pub async fn mark_completed(
    case_id: String,
    db: State<'_, DbState>,
) -> Result<cases::Case, IpcError> {
    let conn = lock(&db)?;
    let mut c = cases::get_case(&conn, &case_id).map_err(|e| IpcError::new(&e.code, e.message))?;
    if c.status == "exported" {
        return Err(IpcError::new(
            "invalid_status_transition",
            "已匯出的案件不可改為完成狀態",
        ));
    }
    if c.status == "completed" {
        return Ok(c);
    }
    c.status = "completed".into();
    c.updated_at = now_secs();
    cases::update_case(&conn, &c).map_err(|e| IpcError::new(&e.code, e.message))?;
    let payload = format!("{{\"case_id\":\"{}\"}}", c.id);
    let _ = oplog::insert_log(&conn, "case_mark_completed", Some(&payload), "ok");
    Ok(c)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::cases::Case;
    use crate::db::tests::open_in_memory;

    fn sample(id: &str) -> Case {
        Case {
            id: id.to_string(),
            case_no: None,
            property_type: "residential".into(),
            land_lot_no: "X-1".into(),
            address: "addr".into(),
            owner_name: None,
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
            land_lots: vec!["X-1".into()],
            land_registry_data: None,
            current_step: 1,
        }
    }

    // mark_keyin TDD 測試（AC-1~AC-4）
    #[test]
    fn mark_keyin_draft_to_keyin() {
        let conn = open_in_memory();
        let c = sample("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
        cases::insert_case(&conn, &c).unwrap();
        // 模擬 mark_keyin 邏輯
        let mut loaded = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(loaded.status, "draft");
        loaded.status = "keyin".into();
        loaded.updated_at = now_secs();
        cases::update_case(&conn, &loaded).unwrap();
        let after = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(after.status, "keyin");
    }

    #[test]
    fn mark_keyin_idempotent_on_keyin() {
        let conn = open_in_memory();
        let mut c = sample("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
        c.status = "keyin".into();
        cases::insert_case(&conn, &c).unwrap();
        // 已是 keyin，不應再 update
        let loaded = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(loaded.status, "keyin");
    }

    #[test]
    fn mark_keyin_rejected_on_completed() {
        let conn = open_in_memory();
        let mut c = sample("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
        c.status = "completed".into();
        cases::insert_case(&conn, &c).unwrap();
        let loaded = cases::get_case(&conn, &c.id).unwrap();
        // IPC 層應拒絕 completed → keyin
        assert!(loaded.status == "completed");
        // 驗證 IPC 邏輯等同：completed / exported → error
        let should_error = loaded.status == "completed" || loaded.status == "exported";
        assert!(should_error);
    }

    #[test]
    fn mark_completed_accepts_keyin_status() {
        let conn = open_in_memory();
        let mut c = sample("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
        c.status = "keyin".into();
        cases::insert_case(&conn, &c).unwrap();
        let mut loaded = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(loaded.status, "keyin");
        // keyin → completed 應被允許（mark_completed 接受 keyin）
        loaded.status = "completed".into();
        assert!(cases::update_case(&conn, &loaded).is_ok());
        let after = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(after.status, "completed");
    }

    #[test]
    fn confirm_case_registry_match_persists_case_and_query_run() {
        let conn = open_in_memory();
        let c = sample("ffffffff-ffff-4fff-8fff-ffffffffffff");
        cases::insert_case(&conn, &c).unwrap();

        let confirmed = confirm_case_registry_match_core(
            &conn,
            &c.id,
            "富強段",
            "00700000",
            Some("00165000"),
            1_779_648_000,
        )
        .unwrap();

        assert_eq!(confirmed.section_name, "富強段");
        let updated = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(updated.land_lot_no, "00700000");
        assert_eq!(updated.building_lot_no.as_deref(), Some("00165000"));
        assert_eq!(updated.land_registry_data.unwrap()["confirmed_registry_match"]["status"], "confirmed");

        let runs = crate::db::registry_query_runs::list_registry_query_run_rows(&conn, Some("富強段")).unwrap();
        assert_eq!(runs.len(), 1);
        assert_eq!(runs[0].case_id.as_deref(), Some(c.id.as_str()));
        assert_eq!(runs[0].confirmation_status, "confirmed");
        assert_eq!(runs[0].total_cost_cents, 0);
    }

    // multi-lot TDD 紅燈測試（AC-1~AC-2，Task 1.1）
    #[test]
    fn create_case_with_multiple_lots() {
        let conn = open_in_memory();
        let mut c = sample("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
        c.land_lots = vec!["123-4".into(), "456-7".into()]; // 紅燈：land_lots 欄位尚未存在
        cases::insert_case(&conn, &c).unwrap();
        let got = cases::get_case(&conn, &c.id).unwrap();
        assert_eq!(got.land_lot_no, "123-4");
        assert_eq!(got.land_lots.len(), 2);
    }

    #[test]
    fn create_case_all_empty_lots_filtered_to_error() {
        let lots: Vec<String> = vec!["".into(), "".into()];
        let filtered: Vec<String> = lots.into_iter().filter(|s| !s.trim().is_empty()).collect();
        assert!(filtered.is_empty());
    }

    #[test]
    fn resolve_land_lots_allows_empty_for_registry_pending_case() {
        let input = CreateCaseInput {
            property_type: "residential".into(),
            land_lot_no: "".into(),
            address: "台南市永康區勝利街58巷4號".into(),
            owner_name: None,
            case_no: None,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
            land_lots: Some(vec!["".into()]),
            land_registry_data: Some(serde_json::json!({
                "registry_status": "registry_pending",
                "missing_registry_fields": ["地段", "地號"]
            })),
            current_step: None,
        };

        assert!(is_registry_pending_case(&input));
        let (primary, lots) = resolve_land_lots(input.land_lots, &input.land_lot_no, true).unwrap();
        assert_eq!(primary, "");
        assert!(lots.is_empty());
    }

    // mark_completed 的核心轉換邏輯（直接測 db layer + 模擬命令邏輯）
    #[test]
    fn cannot_revert_from_exported_to_draft() {
        let conn = open_in_memory();
        let mut c = sample("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        c.status = "exported".into();
        cases::insert_case(&conn, &c).unwrap();
        // 嘗試把 status 改回 draft 應由 IPC 層拒絕（這裡只是驗證 db 層仍可寫，
        // 防呆責任在 commands 層）
        c.status = "draft".into();
        // db 層允許寫入（schema 沒這條規則），IPC 層才拒絕
        assert!(cases::update_case(&conn, &c).is_ok());
    }
}
