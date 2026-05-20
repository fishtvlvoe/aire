// AIRE — Case asset IPC commands
//
// Bridge 階段只開放 Step 3 raster 格局圖匯入與 PDF 讀取。

use chrono::{FixedOffset, Utc};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::State;

use crate::db::case_assets::{self, CaseAsset};
use crate::paths::app_data_dir;
use crate::DbState;

const MAX_ASSET_BYTES: usize = 10 * 1024 * 1024;

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
pub struct ImportCaseAssetPayload {
    pub case_id: String,
    pub kind: String,
    pub source: String,
    pub file_name: String,
    pub mime_type: String,
    pub file_bytes: Vec<u8>,
    pub metadata_json: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CaseAssetBytes {
    pub bytes: Vec<u8>,
    pub mime: String,
}

#[derive(Debug, Serialize)]
pub struct DeleteCaseAssetResult {
    pub ok: bool,
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, IpcError> {
    db.0.lock()
        .map_err(|e| IpcError::new("db_lock", format!("db lock poisoned: {e}")))
}

fn now_tpe() -> String {
    let tz = FixedOffset::east_opt(8 * 3600).unwrap();
    Utc::now().with_timezone(&tz).to_rfc3339()
}

fn extension_for_mime(mime: &str) -> Option<&'static str> {
    match mime {
        "image/png" => Some("png"),
        "image/jpeg" => Some("jpg"),
        "image/webp" => Some("webp"),
        _ => None,
    }
}

fn validate_payload(payload: &ImportCaseAssetPayload) -> Result<&'static str, IpcError> {
    if payload.case_id.trim().is_empty() {
        return Err(IpcError::new("missing_field", "case_id 為必填"));
    }
    if payload.kind != "floor_plan" {
        return Err(IpcError::new(
            "unsupported_kind",
            "kind 目前只支援 floor_plan",
        ));
    }
    if payload.source != "manual_upload" && payload.source != "legacy_floor_plan_photo" {
        return Err(IpcError::new("unsupported_source", "source 不支援"));
    }
    if payload.file_bytes.is_empty() {
        return Err(IpcError::new("empty_file", "圖片不可為空"));
    }
    if payload.file_bytes.len() > MAX_ASSET_BYTES {
        return Err(IpcError::new("file_too_large", "圖片大小不可超過 10MB"));
    }
    extension_for_mime(&payload.mime_type)
        .ok_or_else(|| IpcError::new("unsupported_mime", "僅支援 PNG、JPEG、WebP"))
}

fn trust_tier_for_source(source: &str) -> &'static str {
    match source {
        "legacy_floor_plan_photo" => "legacy_import",
        _ => "assistant_uploaded",
    }
}

fn asset_dir(root: &Path, case_id: &str) -> PathBuf {
    root.join("case-assets").join(case_id)
}

fn import_case_asset_impl(
    conn: &Connection,
    root: &Path,
    payload: ImportCaseAssetPayload,
) -> Result<CaseAsset, IpcError> {
    let ext = validate_payload(&payload)?;
    let asset_id = uuid::Uuid::new_v4().to_string();
    let dir = asset_dir(root, &payload.case_id);
    std::fs::create_dir_all(&dir)
        .map_err(|e| IpcError::new("file_io", format!("建立資產目錄失敗：{e}")))?;

    let storage_path = dir.join(format!("{asset_id}.{ext}"));
    std::fs::write(&storage_path, &payload.file_bytes)
        .map_err(|e| IpcError::new("file_io", format!("寫入資產檔案失敗：{e}")))?;

    let now = now_tpe();
    let asset = CaseAsset {
        id: asset_id,
        case_id: payload.case_id,
        kind: payload.kind,
        source: payload.source.clone(),
        trust_tier: trust_tier_for_source(&payload.source).into(),
        review_status: "approved".into(),
        is_primary: true,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        size_bytes: payload.file_bytes.len() as i64,
        storage_path: storage_path.to_string_lossy().into_owned(),
        metadata_json: payload.metadata_json.unwrap_or_else(|| "{}".into()),
        created_at: now.clone(),
        updated_at: now,
    };

    case_assets::insert_asset(conn, &asset).map_err(|e| {
        let _ = std::fs::remove_file(&storage_path);
        IpcError::new(&e.code, e.message)
    })?;
    Ok(asset)
}

#[tauri::command]
pub fn import_case_asset(
    db: State<'_, DbState>,
    payload: ImportCaseAssetPayload,
) -> Result<CaseAsset, IpcError> {
    let root = app_data_dir().map_err(|e| IpcError::new("file_io", e.to_string()))?;
    let conn = lock(&db)?;
    import_case_asset_impl(&conn, &root, payload)
}

#[tauri::command]
pub fn list_case_assets(
    db: State<'_, DbState>,
    case_id: String,
    kind: Option<String>,
) -> Result<Vec<CaseAsset>, IpcError> {
    let conn = lock(&db)?;
    case_assets::list_assets(&conn, &case_id, kind.as_deref())
        .map_err(|e| IpcError::new(&e.code, e.message))
}

#[tauri::command]
pub fn read_case_asset_bytes(
    db: State<'_, DbState>,
    asset_id: String,
) -> Result<CaseAssetBytes, IpcError> {
    let conn = lock(&db)?;
    let asset =
        case_assets::get_asset(&conn, &asset_id).map_err(|e| IpcError::new(&e.code, e.message))?;
    let bytes = std::fs::read(&asset.storage_path)
        .map_err(|e| IpcError::new("asset_file_missing", format!("讀取資產檔案失敗：{e}")))?;
    Ok(CaseAssetBytes {
        bytes,
        mime: asset.mime_type,
    })
}

#[tauri::command]
pub fn delete_case_asset(
    db: State<'_, DbState>,
    asset_id: String,
) -> Result<DeleteCaseAssetResult, IpcError> {
    let conn = lock(&db)?;
    let asset = case_assets::delete_asset(&conn, &asset_id)
        .map_err(|e| IpcError::new(&e.code, e.message))?;
    let _ = std::fs::remove_file(asset.storage_path);
    Ok(DeleteCaseAssetResult { ok: true })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{cases, tests::open_in_memory};

    fn insert_case(conn: &Connection, id: &str) {
        let case = cases::Case {
            id: id.into(),
            case_no: Some("AIRE-ASSET".into()),
            property_type: "residential".into(),
            land_lot_no: "測試段1".into(),
            address: "台南市測試路1號".into(),
            owner_name: Some("測試屋主".into()),
            status: "draft".into(),
            created_at: 1,
            updated_at: 1,
            case_name: None,
            building_lot_no: None,
            asking_price: None,
            land_lots: vec!["測試段1".into()],
        };
        cases::insert_case(conn, &case).unwrap();
    }

    fn payload(case_id: &str, mime_type: &str, bytes: Vec<u8>) -> ImportCaseAssetPayload {
        ImportCaseAssetPayload {
            case_id: case_id.into(),
            kind: "floor_plan".into(),
            source: "manual_upload".into(),
            file_name: "floor.png".into(),
            mime_type: mime_type.into(),
            file_bytes: bytes,
            metadata_json: None,
        }
    }

    #[test]
    fn import_list_read_and_delete_raster_asset() {
        let conn = open_in_memory();
        insert_case(&conn, "case-command-1");
        let temp = tempfile::tempdir().unwrap();

        let asset = import_case_asset_impl(
            &conn,
            temp.path(),
            payload("case-command-1", "image/png", vec![1, 2, 3]),
        )
        .unwrap();
        assert_eq!(asset.review_status, "approved");
        assert!(Path::new(&asset.storage_path).exists());

        let list = case_assets::list_assets(&conn, "case-command-1", Some("floor_plan")).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(std::fs::read(&asset.storage_path).unwrap(), vec![1, 2, 3]);

        let deleted = case_assets::delete_asset(&conn, &asset.id).unwrap();
        std::fs::remove_file(&deleted.storage_path).unwrap();
        assert!(!Path::new(&deleted.storage_path).exists());
    }

    #[test]
    fn unsupported_mime_creates_no_asset() {
        let conn = open_in_memory();
        insert_case(&conn, "case-command-2");
        let temp = tempfile::tempdir().unwrap();

        let err = import_case_asset_impl(
            &conn,
            temp.path(),
            payload("case-command-2", "application/pdf", vec![1, 2, 3]),
        )
        .unwrap_err();
        assert_eq!(err.code, "unsupported_mime");
        assert!(
            case_assets::list_assets(&conn, "case-command-2", Some("floor_plan"))
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn oversized_import_creates_no_asset() {
        let conn = open_in_memory();
        insert_case(&conn, "case-command-3");
        let temp = tempfile::tempdir().unwrap();

        let err = import_case_asset_impl(
            &conn,
            temp.path(),
            payload("case-command-3", "image/png", vec![0; MAX_ASSET_BYTES + 1]),
        )
        .unwrap_err();
        assert_eq!(err.code, "file_too_large");
        assert!(
            case_assets::list_assets(&conn, "case-command-3", Some("floor_plan"))
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn missing_asset_file_returns_explicit_error() {
        let conn = open_in_memory();
        insert_case(&conn, "case-command-4");
        let temp = tempfile::tempdir().unwrap();
        let asset = import_case_asset_impl(
            &conn,
            temp.path(),
            payload("case-command-4", "image/png", vec![1, 2, 3]),
        )
        .unwrap();
        std::fs::remove_file(&asset.storage_path).unwrap();

        let read = std::fs::read(&asset.storage_path)
            .map_err(|e| IpcError::new("asset_file_missing", e.to_string()));
        assert_eq!(read.unwrap_err().code, "asset_file_missing");
    }
}
