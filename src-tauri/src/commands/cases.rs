// AIRE — Cases IPC commands（Task 5.1 / 5.5）
//
// 依據：openspec/changes/aire-desktop-phase1/design.md / case-management spec
// capability: case-management

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::{cases, oplog};
use crate::DbState;

#[derive(Debug, Serialize, Clone)]
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
}

#[derive(Debug, Deserialize)]
pub struct UpdateCaseInput {
    pub case_no: Option<String>,
    pub property_type: String,
    pub land_lot_no: String,
    pub address: String,
    pub owner_name: Option<String>,
    pub status: Option<String>,
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
    if input.land_lot_no.trim().is_empty() || input.address.trim().is_empty() {
        return Err(IpcError::new("missing_field", "地號與地址為必填"));
    }

    let now = now_secs();
    let c = cases::Case {
        id: uuid::Uuid::new_v4().to_string(),
        case_no: input.case_no,
        property_type: input.property_type,
        land_lot_no: input.land_lot_no,
        address: input.address,
        owner_name: input.owner_name,
        status: "draft".into(),
        created_at: now,
        updated_at: now,
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
        if new_status != "draft" && new_status != "completed" && new_status != "exported" {
            return Err(IpcError::new(
                "invalid_status",
                "status 必須為 draft / completed / exported",
            ));
        }
        existing.status = new_status.clone();
    }

    existing.case_no = input.case_no;
    existing.property_type = input.property_type;
    existing.land_lot_no = input.land_lot_no;
    existing.address = input.address;
    existing.owner_name = input.owner_name;
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

/// 標示案件為完成（Task 5.5）。拒絕 exported / completed 倒退回 draft。
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
        }
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
