// AIRE — Floor plan IPC commands
//
// Task 1.2: upload floor plan sketch

use chrono::{FixedOffset, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::State;

use crate::db::floor_plan_sketches::{self, FloorPlanConversionHistory, FloorPlanSketch};
use crate::paths::app_data_dir;
use crate::DbState;

#[derive(Debug, Serialize, Clone)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl IpcError {
    pub fn new(code: &str, msg: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: msg.into(),
        }
    }
}

pub fn ipc_err(code: &str, msg: impl Into<String>) -> String {
    serde_json::to_string(&IpcError::new(code, msg)).unwrap_or_default()
}

#[derive(Debug, Deserialize)]
pub struct UploadFloorPlanSketchPayload {
    pub case_id: String,
    pub file_bytes: Vec<u8>,
    pub uploaded_by: Option<String>,
    pub upload_note: Option<String>,
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(&mut s, "{:02x}", b);
    }
    s
}

#[tauri::command]
pub fn upload_floor_plan_sketch(
    state: State<'_, DbState>,
    payload: UploadFloorPlanSketchPayload,
) -> Result<FloorPlanSketch, String> {
    let mut hasher = Sha256::new();
    hasher.update(&payload.file_bytes);
    let sha256_hex = hex_encode(&hasher.finalize());

    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    let version = floor_plan_sketches::next_sketch_version(&conn, &payload.case_id)
        .map_err(|e| ipc_err("db_error", e.to_string()))?;

    let asset_id = uuid::Uuid::new_v4().to_string();
    let sketch_id = uuid::Uuid::new_v4().to_string();

    let root = app_data_dir().map_err(|e| ipc_err("file_io", e.to_string()))?;
    let dir = root.join("sketches").join(&payload.case_id);
    std::fs::create_dir_all(&dir).map_err(|e| ipc_err("file_io", e.to_string()))?;

    let path = dir.join(format!("{asset_id}.jpg"));
    std::fs::write(&path, &payload.file_bytes).map_err(|e| ipc_err("file_io", e.to_string()))?;

    let tz = FixedOffset::east_opt(8 * 3600).unwrap();
    let now = Utc::now().with_timezone(&tz).to_rfc3339();

    let sketch = FloorPlanSketch {
        id: sketch_id,
        case_id: payload.case_id,
        original_asset_id: asset_id,
        original_sha256: sha256_hex,
        source_type: "field_sketch".into(),
        version,
        upload_note: payload.upload_note,
        uploaded_by: payload.uploaded_by,
        uploaded_at: now.clone(),
        created_at: now.clone(),
        updated_at: now,
    };

    floor_plan_sketches::insert_sketch(&conn, &sketch)
        .map_err(|e| ipc_err("db_error", e.to_string()))?;

    Ok(sketch)
}

#[tauri::command]
pub fn list_floor_plan_conversion_history(
    state: State<'_, DbState>,
    case_id: String,
) -> Result<FloorPlanConversionHistory, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    floor_plan_sketches::list_floor_plan_history(&conn, &case_id)
        .map_err(|e| ipc_err("db_error", e.to_string()))
}
