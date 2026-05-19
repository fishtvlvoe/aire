use chrono::{FixedOffset, Utc};
use rusqlite::params;
use serde_json::Value;
use tauri::State;

use crate::commands::floor_plan::ipc_err;
use crate::db::floor_plan_sketches::get_conversion_for_render;
use crate::paths::app_data_dir;
use crate::rendering::render_to_svg;
use crate::DbState;

fn dimensions_verified_from_checklist(checklist_json: &str) -> bool {
    let s = checklist_json.trim();
    if s.is_empty() {
        return false;
    }

    let Ok(v) = serde_json::from_str::<Value>(s) else {
        return false;
    };

    match v
        .get("dimensions_source")
        .and_then(|x| x.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some("field_sketch") | Some("manual_confirmation") => true,
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::dimensions_verified_from_checklist;

    #[test]
    fn record_dimensions_source_mapping() {
        assert!(!dimensions_verified_from_checklist(""));
        assert!(!dimensions_verified_from_checklist("{}"));
        assert!(!dimensions_verified_from_checklist(r#"{"dimensions_source":""}"#));
        assert!(!dimensions_verified_from_checklist(r#"{"dimensions_source":"ai_guess"}"#));

        assert!(dimensions_verified_from_checklist(r#"{"dimensions_source":"field_sketch"}"#));
        assert!(dimensions_verified_from_checklist(r#"{"dimensions_source":"manual_confirmation"}"#));
    }
}

fn map_prefixed_err(err: String) -> String {
    // floor_plan_sketches::get_conversion_for_render returns "code: message" strings.
    if let Some((code, msg)) = err.split_once(": ") {
        return ipc_err(code, msg);
    }
    ipc_err("error", err)
}

#[tauri::command]
pub fn render_floor_plan_conversion(
    state: State<'_, DbState>,
    conversion_id: String,
) -> Result<String, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    // 1) get_conversion_for_render (only approved allowed)
    let conv = get_conversion_for_render(&conn, &conversion_id).map_err(map_prefixed_err)?;

    // 2) render_to_svg
    // dimensions are only considered verified when the source is explicitly provided.
    let dimensions_verified = dimensions_verified_from_checklist(&conv.approval_checklist_json);

    let svg = render_to_svg(&conv.extracted_json, dimensions_verified)
        .map_err(|e| ipc_err("render_error", e))?;

    // 3) write svg to app_data_dir()/renders/{conversion_id}.svg
    let root = app_data_dir().map_err(|e| ipc_err("file_io", e.to_string()))?;
    let dir = root.join("renders");
    std::fs::create_dir_all(&dir).map_err(|e| ipc_err("file_io", e.to_string()))?;
    let path = dir.join(format!("{conversion_id}.svg"));
    std::fs::write(&path, svg.as_bytes()).map_err(|e| ipc_err("file_io", e.to_string()))?;

    // 4) update conversion: set rendered_asset_id=conversion_id
    let tz = FixedOffset::east_opt(8 * 3600).unwrap();
    let now = Utc::now().with_timezone(&tz).to_rfc3339();

    let changed = conn
        .execute(
            "UPDATE floor_plan_conversions SET rendered_asset_id=?1, updated_at=?2 WHERE id=?3",
            params![conversion_id, now, conversion_id],
        )
        .map_err(|e| ipc_err("db_error", format!("failed to update conversion: {e}")))?;

    if changed != 1 {
        return Err(ipc_err(
            "db_error",
            format!("expected to update 1 row, updated {changed}"),
        ));
    }

    // 5) return SVG string
    Ok(svg)
}
