use rusqlite::{params, Connection};
use tauri::State;

use crate::commands::floor_plan::ipc_err;
use crate::db::floor_plan_sketches::{
    current_taipei_ts, get_conversion_by_id, validate_approval_checklist, ApprovalChecklist,
    FloorPlanConversion,
};
use crate::DbState;

fn map_prefixed_err(err: String) -> String {
    // validate_approval_checklist returns "code: message" strings.
    if let Some((code, msg)) = err.split_once(": ") {
        return ipc_err(code, msg);
    }
    ipc_err("error", err)
}

fn approve_floor_plan_conversion_impl(
    conn: &Connection,
    conversion_id: &str,
    checklist: &ApprovalChecklist,
) -> Result<FloorPlanConversion, String> {
    // 1) validate checklist
    validate_approval_checklist(checklist).map_err(map_prefixed_err)?;

    // 2) status gate
    let current = get_conversion_by_id(conn, conversion_id)
        .map_err(|e| ipc_err("db_error", e.to_string()))?;
    if current.status != "draft" && current.status != "needs_correction" {
        return Err(ipc_err(
            "approval_blocked",
            format!(
                "conversion {conversion_id} has status {} — only draft/needs_correction can be approved",
                current.status
            ),
        ));
    }

    // 3) serialize checklist
    let checklist_json =
        serde_json::to_string(checklist).map_err(|e| ipc_err("serialization_error", e.to_string()))?;

    // 4) approved_at
    let now = current_taipei_ts();

    // 5) update
    let changed = conn
        .execute(
            "UPDATE floor_plan_conversions \
             SET status='approved', approved_at=?1, approval_checklist_json=?2, approved_by=NULL, updated_at=?3 \
             WHERE id=?4",
            params![now, checklist_json, now, conversion_id],
        )
        .map_err(|e| ipc_err("db_error", format!("failed to approve conversion: {e}")))?;

    if changed != 1 {
        return Err(ipc_err(
            "db_error",
            format!("expected to update 1 row, updated {changed}"),
        ));
    }

    // 6) return updated row
    get_conversion_by_id(conn, conversion_id).map_err(|e| ipc_err("db_error", e.to_string()))
}

fn revoke_floor_plan_conversion_impl(
    conn: &Connection,
    conversion_id: &str,
    reason: &str,
) -> Result<FloorPlanConversion, String> {
    // 1) status gate
    let current = get_conversion_by_id(conn, conversion_id)
        .map_err(|e| ipc_err("db_error", e.to_string()))?;
    if current.status != "approved" {
        return Err(ipc_err(
            "revoke_blocked",
            format!(
                "conversion {conversion_id} has status {} — only approved conversions can be revoked",
                current.status
            ),
        ));
    }

    // 2) update
    let now = current_taipei_ts();
    let manual_edits_json =
        serde_json::to_string(&serde_json::json!({"revoke_reason": reason}))
            .map_err(|e| ipc_err("serialization_error", e.to_string()))?;

    let changed = conn
        .execute(
            "UPDATE floor_plan_conversions \
             SET status='revoked', manual_edits_json=?1, updated_at=?2 \
             WHERE id=?3",
            params![manual_edits_json, now, conversion_id],
        )
        .map_err(|e| ipc_err("db_error", format!("failed to revoke conversion: {e}")))?;

    if changed != 1 {
        return Err(ipc_err(
            "db_error",
            format!("expected to update 1 row, updated {changed}"),
        ));
    }

    // 3) return updated row
    get_conversion_by_id(conn, conversion_id).map_err(|e| ipc_err("db_error", e.to_string()))
}

#[tauri::command]
pub fn approve_floor_plan_conversion(
    state: State<'_, DbState>,
    conversion_id: String,
    checklist: ApprovalChecklist,
) -> Result<FloorPlanConversion, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    approve_floor_plan_conversion_impl(&conn, &conversion_id, &checklist)
}

#[tauri::command]
pub fn revoke_floor_plan_conversion(
    state: State<'_, DbState>,
    conversion_id: String,
    reason: String,
) -> Result<FloorPlanConversion, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| ipc_err("db_error", format!("db lock poisoned: {e}")))?;

    revoke_floor_plan_conversion_impl(&conn, &conversion_id, &reason)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use tempfile::TempDir;

    fn full_checklist() -> ApprovalChecklist {
        ApprovalChecklist {
            room_count_confirmed: true,
            kitchen_confirmed: true,
            bathrooms_confirmed: true,
            balcony_confirmed: true,
            entrance_confirmed: true,
            openings_confirmed: true,
            dimensions_source: "field_sketch".to_string(),
            dimensions_source_confirmed: true,
            uncertainty_resolved: true,
            approval_statement: "ok".to_string(),
        }
    }

    fn setup_approvable_conversion() -> (TempDir, Connection, String) {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

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

        let conversion_id = "cv1".to_string();
        let conv = FloorPlanConversion {
            id: conversion_id.clone(),
            sketch_id: "s1".into(),
            case_id: "c1".into(),
            status: "draft".into(),
            extracted_json: "{}".into(),
            manual_edits_json: "{}".into(),
            uncertainty_json: "[]".into(),
            renderer_version: Some("renderer-v1".into()),
            rendered_asset_id: Some("render-asset-1".into()),
            approval_checklist_json: "{}".into(),
            approved_by: None,
            approved_at: None,
            model_provider: None,
            model_id: None,
            prompt_template_version: None,
            response_fingerprint: None,
            created_at: ts.clone(),
            updated_at: ts,
        };
        crate::db::floor_plan_sketches::insert_conversion(&conn, &conv).unwrap();

        (dir, conn, conversion_id)
    }

    #[test]
    fn approve_with_full_checklist_sets_approved() {
        let (_dir, conn, conversion_id) = setup_approvable_conversion();
        let checklist = full_checklist();

        let conv = approve_floor_plan_conversion_impl(&conn, &conversion_id, &checklist).unwrap();
        assert_eq!(conv.status, "approved");
        assert!(conv.approved_at.as_ref().is_some_and(|s| !s.trim().is_empty()));
        assert!(
            !conv.approval_checklist_json.trim().is_empty() && conv.approval_checklist_json != "{}"
        );
    }

    #[test]
    fn approve_with_incomplete_checklist_fails() {
        let (_dir, conn, conversion_id) = setup_approvable_conversion();
        let mut checklist = full_checklist();
        checklist.room_count_confirmed = false;

        let res = approve_floor_plan_conversion_impl(&conn, &conversion_id, &checklist);
        assert!(res.is_err());
    }

    #[test]
    fn revoke_approved_conversion_sets_revoked() {
        let (_dir, conn, conversion_id) = setup_approvable_conversion();
        let checklist = full_checklist();
        let _ = approve_floor_plan_conversion_impl(&conn, &conversion_id, &checklist).unwrap();

        let conv = revoke_floor_plan_conversion_impl(&conn, &conversion_id, "測試撤銷").unwrap();
        assert_eq!(conv.status, "revoked");

        let v: serde_json::Value = serde_json::from_str(&conv.manual_edits_json).unwrap();
        assert_eq!(v["revoke_reason"].as_str().unwrap(), "測試撤銷");
    }

    #[test]
    fn revoke_non_approved_fails() {
        let (_dir, conn, conversion_id) = setup_approvable_conversion();

        let res = revoke_floor_plan_conversion_impl(&conn, &conversion_id, "測試撤銷");
        assert!(res.is_err());
    }
}
