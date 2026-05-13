// AIRE — Disclosure drafts IPC commands（Group 6.3 / 6.4 / 7.2 配套）
//
// 提供前端 `useDraftAutosave` / `loadDraft` 使用的兩個命令：
// - save_draft(case_id, payload, schema_version)
// - get_draft(case_id) -> Option<DraftData>

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::commands::cases::IpcError;
use crate::db::drafts;
use crate::DbState;

#[derive(Debug, Serialize)]
pub struct DraftReply {
    pub case_id: String,
    pub payload_json: String,
    pub schema_version: i64,
    pub saved_at: i64,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct SaveDraftArgs {
    pub caseId: String,
    pub payload: Value,
    pub schemaVersion: Option<i64>,
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, IpcError> {
    db.0.lock()
        .map_err(|e| IpcError {
            code: "db_lock".into(),
            message: format!("db lock poisoned: {e}"),
        })
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[tauri::command]
pub async fn save_draft(
    args: SaveDraftArgs,
    db: State<'_, DbState>,
) -> Result<(), IpcError> {
    if args.caseId.trim().is_empty() {
        return Err(IpcError {
            code: "missing_field".into(),
            message: "case_id 不可為空".into(),
        });
    }
    let payload_json = serde_json::to_string(&args.payload).map_err(|e| IpcError {
        code: "serialize_failed".into(),
        message: format!("payload 序列化失敗：{e}"),
    })?;
    let schema_version = args.schemaVersion.unwrap_or(1);
    let saved_at = now_secs();

    let conn = lock(&db)?;
    drafts::upsert_draft(&conn, &args.caseId, &payload_json, schema_version, saved_at)
        .map_err(|e| IpcError {
            code: e.code,
            message: e.message,
        })?;
    Ok(())
}

#[tauri::command]
pub async fn get_draft(
    case_id: String,
    db: State<'_, DbState>,
) -> Result<Option<DraftReply>, IpcError> {
    let conn = lock(&db)?;
    let r = drafts::get_draft(&conn, &case_id).map_err(|e| IpcError {
        code: e.code,
        message: e.message,
    })?;
    Ok(r.map(|d| DraftReply {
        case_id: d.case_id,
        payload_json: d.payload_json,
        schema_version: d.schema_version,
        saved_at: d.saved_at,
    }))
}
