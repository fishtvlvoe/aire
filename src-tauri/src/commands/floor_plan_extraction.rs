use std::path::PathBuf;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::{FixedOffset, Utc};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::commands::floor_plan::ipc_err;
use crate::db::floor_plan_sketches::{self, FloorPlanConversion};
use crate::paths::app_data_dir;
use crate::DbState;

// FieldSketchExtraction shape (Rust mirror of the TypeScript type):
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionRoom {
    pub id: String,
    pub label: String,
    pub room_type: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionOpening {
    pub opening_type: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionAdjacency {
    pub from_room_id: String,
    pub to_room_id: String,
    pub relation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionUncertainty {
    pub field: String,
    pub message: String,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldSketchExtraction {
    pub sketch_id: String,
    pub rooms: Vec<ExtractionRoom>,
    pub openings: Vec<ExtractionOpening>,
    pub adjacency: Vec<ExtractionAdjacency>,
    pub uncertainty: Vec<ExtractionUncertainty>,
}

pub trait AiExtractor: Send + Sync {
    fn extract(&self, image_bytes: &[u8]) -> Result<String, String>; // returns JSON string
}

pub struct OpenAiExtractor {
    pub api_key: String,
}

impl AiExtractor for OpenAiExtractor {
    fn extract(&self, image_bytes: &[u8]) -> Result<String, String> {
        if self.api_key.trim().is_empty() {
            return Err("missing OPENAI_API_KEY".to_string());
        }

        let image_b64 = STANDARD.encode(image_bytes);
        let image_url = format!("data:image/jpeg;base64,{image_b64}");

        let body = serde_json::json!({
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": "Extract floor plan structure as JSON matching FieldSketchExtraction schema. Return ONLY valid JSON."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract floor plan structure."},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ]
        });

        let client = reqwest::blocking::Client::new();
        let resp = client
            .post("https://api.openai.com/v1/chat/completions")
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .map_err(|e| format!("openai request failed: {e}"))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            return Err(format!("openai error: {status} {text}"));
        }

        let v: Value = resp
            .json()
            .map_err(|e| format!("openai response parse failed: {e}"))?;

        let content = v
            .pointer("/choices/0/message/content")
            .and_then(|x| x.as_str())
            .ok_or_else(|| "openai response missing choices[0].message.content".to_string())?;

        Ok(content.to_string())
    }
}

pub struct MockAiExtractor {
    pub response_json: String,
}

impl AiExtractor for MockAiExtractor {
    fn extract(&self, _image_bytes: &[u8]) -> Result<String, String> {
        Ok(self.response_json.clone())
    }
}

fn sketch_image_path(root: &PathBuf, case_id: &str, original_asset_id: &str) -> PathBuf {
    root.join("sketches")
        .join(case_id)
        .join(format!("{original_asset_id}.jpg"))
}

fn extract_with_extractor(
    conn: &Connection,
    sketch_id: &str,
    extractor: &dyn AiExtractor,
) -> Result<FloorPlanConversion, String> {
    let (sketch_id, case_id, original_asset_id): (String, String, String) = conn
        .query_row(
            "SELECT id, case_id, original_asset_id FROM floor_plan_sketches WHERE id=?1",
            [sketch_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| ipc_err("db_error", e.to_string()))?;

    let root = app_data_dir().map_err(|e| ipc_err("file_io", e.to_string()))?;
    let path = sketch_image_path(&root, &case_id, &original_asset_id);
    let image_bytes = std::fs::read(&path).map_err(|e| {
        ipc_err(
            "file_io",
            format!("failed to read sketch image {p:?}: {e}", p = path),
        )
    })?;

    let extracted_json_str = extractor
        .extract(&image_bytes)
        .map_err(|e| ipc_err("ai_error", e))?;

    let extraction: FieldSketchExtraction = serde_json::from_str(&extracted_json_str)
        .map_err(|e| ipc_err("validation_error", e.to_string()))?;

    let has_blocker = extraction
        .uncertainty
        .iter()
        .any(|u| u.severity == "blocker");
    let status = if has_blocker {
        "needs_correction"
    } else {
        "draft"
    };

    let uncertainty_json = serde_json::to_string(&extraction.uncertainty).unwrap_or_else(|_| "[]".into());

    let tz = FixedOffset::east_opt(8 * 3600).unwrap();
    let now = Utc::now().with_timezone(&tz).to_rfc3339();

    let mut conv = FloorPlanConversion {
        id: uuid::Uuid::new_v4().to_string(),
        sketch_id,
        case_id,
        status: status.to_string(),
        extracted_json: extracted_json_str,
        manual_edits_json: "{}".to_string(),
        uncertainty_json,
        renderer_version: None,
        rendered_asset_id: None,
        approval_checklist_json: "{}".to_string(),
        approved_by: None,
        approved_at: None,
        model_provider: Some("openai".to_string()),
        model_id: Some("gpt-4o".to_string()),
        prompt_template_version: None,
        response_fingerprint: None,
        created_at: now.clone(),
        updated_at: now,
    };

    // SECURITY / INTEGRITY GUARD:
    // AI extraction must NEVER set a final rendered image asset. Only the deterministic renderer
    // can produce a rendered asset from approved, confirmed data.
    conv.rendered_asset_id = None;
    debug_assert!(conv.rendered_asset_id.is_none());

    floor_plan_sketches::insert_conversion(conn, &conv)
        .map_err(|e| ipc_err("db_error", e.to_string()))?;

    Ok(conv)
}

#[tauri::command]
pub fn extract_floor_plan_sketch(
    state: State<'_, DbState>,
    sketch_id: String,
) -> Result<FloorPlanConversion, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    let api_key = std::env::var("OPENAI_API_KEY").unwrap_or_default();
    let extractor = OpenAiExtractor { api_key };

    extract_with_extractor(&conn, &sketch_id, &extractor)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use std::sync::{Mutex, MutexGuard, OnceLock};
    use tempfile::TempDir;

    const APP_DATA_ENV_KEY: &str = "AIRE_APP_DATA_DIR";

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    struct AppDataEnvGuard {
        _lock: MutexGuard<'static, ()>,
        prev: Option<String>,
    }

    impl AppDataEnvGuard {
        fn lock() -> Self {
            let lock = env_lock().lock().unwrap();
            let prev = std::env::var(APP_DATA_ENV_KEY).ok();
            Self { _lock: lock, prev }
        }
    }

    impl Drop for AppDataEnvGuard {
        fn drop(&mut self) {
            match &self.prev {
                Some(v) => std::env::set_var(APP_DATA_ENV_KEY, v),
                None => std::env::remove_var(APP_DATA_ENV_KEY),
            }
        }
    }

    fn setup_extract_test() -> (TempDir, Connection, String) {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        // Route app_data_dir() to temp folder (avoid writing to real user dirs).
        // Must end with "aire" to avoid flakiness with paths.rs tests that assert that suffix.
        let app_root = dir.path().join("aire");
        std::env::set_var(APP_DATA_ENV_KEY, &app_root);

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let sketch = crate::db::floor_plan_sketches::FloorPlanSketch {
            id: "s1".into(),
            case_id: "c1".into(),
            original_asset_id: "a1".into(),
            original_sha256: "h1".into(),
            source_type: "field_sketch".into(),
            version: 1,
            upload_note: None,
            uploaded_by: None,
            uploaded_at: ts.clone(),
            created_at: ts.clone(),
            updated_at: ts.clone(),
        };
        crate::db::floor_plan_sketches::insert_sketch(&conn, &sketch).unwrap();

        // write dummy image
        let img_dir = app_root.join("sketches").join("c1");
        std::fs::create_dir_all(&img_dir).unwrap();
        std::fs::write(img_dir.join("a1.jpg"), vec![1u8, 2u8, 3u8]).unwrap();

        (dir, conn, "s1".to_string())
    }

    #[test]
    fn extract_with_mock_extractor_inserts_draft_conversion() {
        let env_guard = AppDataEnvGuard::lock();
        let (_dir, conn, sketch_id) = setup_extract_test();

        let mock_json = r#"{"sketch_id":"s1","rooms":[{"id":"r1","label":"客廳","room_type":"living","confidence":0.9}],"openings":[{"opening_type":"door","confidence":0.8}],"adjacency":[{"from_room_id":"r1","to_room_id":"r2","relation":"door"}],"uncertainty":[{"field":"room_count","message":"unclear","severity":"warning"}]}"#;
        let extractor = MockAiExtractor {
            response_json: mock_json.to_string(),
        };

        let conv = extract_with_extractor(&conn, &sketch_id, &extractor).unwrap();
        assert_eq!(conv.status, "draft");
        assert_eq!(conv.sketch_id, "s1");
        assert_eq!(conv.case_id, "c1");
        assert!(
            conv.rendered_asset_id.is_none(),
            "AI extraction must not set rendered_asset_id"
        );

        let extracted: Value = serde_json::from_str(&conv.extracted_json).unwrap();
        assert!(extracted.get("rooms").unwrap().is_array());
        assert!(extracted.get("openings").unwrap().is_array());
        assert!(extracted.get("adjacency").unwrap().is_array());
        assert!(extracted.get("uncertainty").unwrap().is_array());

        let uncertainty: Value = serde_json::from_str(&conv.uncertainty_json).unwrap();
        assert!(uncertainty.is_array());
        assert_eq!(uncertainty[0]["severity"].as_str().unwrap(), "warning");

        let list = crate::db::floor_plan_sketches::list_conversions_for_case(&conn, "c1").unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, conv.id);
        assert!(
            list[0].rendered_asset_id.is_none(),
            "persisted conversion must not have rendered_asset_id from AI extraction"
        );

        drop(env_guard);
    }

    #[test]
    fn blocker_uncertainty_sets_needs_correction() {
        let env_guard = AppDataEnvGuard::lock();
        let (_dir, conn, sketch_id) = setup_extract_test();

        let mock_json = r#"{"sketch_id":"s1","rooms":[],"openings":[],"adjacency":[],"uncertainty":[{"field":"room_count","message":"no rooms found","severity":"blocker"}]}"#;
        let extractor = MockAiExtractor {
            response_json: mock_json.to_string(),
        };

        let conv = extract_with_extractor(&conn, &sketch_id, &extractor).unwrap();
        assert_eq!(conv.status, "needs_correction");

        drop(env_guard);
    }

    #[test]
    fn warning_uncertainty_stays_draft() {
        let env_guard = AppDataEnvGuard::lock();
        let (_dir, conn, sketch_id) = setup_extract_test();

        let mock_json = r#"{"sketch_id":"s1","rooms":[],"openings":[],"adjacency":[],"uncertainty":[{"field":"label","message":"unclear","severity":"warning"}]}"#;
        let extractor = MockAiExtractor {
            response_json: mock_json.to_string(),
        };

        let conv = extract_with_extractor(&conn, &sketch_id, &extractor).unwrap();
        assert_eq!(conv.status, "draft");

        drop(env_guard);
    }

    #[test]
    fn contradictory_adjacency_blocker() {
        let env_guard = AppDataEnvGuard::lock();
        let (_dir, conn, sketch_id) = setup_extract_test();

        let mock_json = r#"{"sketch_id":"s1","rooms":[],"openings":[],"adjacency":[],"uncertainty":[{"field":"adjacency","message":"room r1 adjacent to itself","severity":"blocker"}]}"#;
        let extractor = MockAiExtractor {
            response_json: mock_json.to_string(),
        };

        let conv = extract_with_extractor(&conn, &sketch_id, &extractor).unwrap();
        assert_eq!(conv.status, "needs_correction");

        drop(env_guard);
    }
}
