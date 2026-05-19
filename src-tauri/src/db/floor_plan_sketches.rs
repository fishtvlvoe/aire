// AIRE — Floor plan sketches repository
//
// 依據 migrations/009_floor_plan_sketches.sql

use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

use super::DbError;

pub fn current_taipei_ts() -> String {
    let tz = chrono::FixedOffset::east_opt(8 * 3600).unwrap();
    chrono::Utc::now().with_timezone(&tz).to_rfc3339()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FloorPlanSketch {
    pub id: String,
    pub case_id: String,
    pub original_asset_id: String,
    pub original_sha256: String,
    pub source_type: String,
    pub version: i64,
    pub upload_note: Option<String>,
    pub uploaded_by: Option<String>,
    pub uploaded_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FloorPlanConversion {
    pub id: String,
    pub sketch_id: String,
    pub case_id: String,
    pub status: String,
    pub extracted_json: String,
    pub manual_edits_json: String,
    pub uncertainty_json: String,
    pub renderer_version: Option<String>,
    pub rendered_asset_id: Option<String>,
    pub approval_checklist_json: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<String>,
    pub model_provider: Option<String>,
    pub model_id: Option<String>,
    pub prompt_template_version: Option<String>,
    pub response_fingerprint: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FloorPlanConversionHistory {
    pub sketches: Vec<FloorPlanSketch>,
    pub conversions: Vec<FloorPlanConversion>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ApprovalChecklist {
    pub room_count_confirmed: bool,
    pub kitchen_confirmed: bool,
    pub bathrooms_confirmed: bool,
    pub balcony_confirmed: bool,
    pub entrance_confirmed: bool,
    pub openings_confirmed: bool,
    #[serde(default)]
    pub dimensions_source: String,
    pub dimensions_source_confirmed: bool,
    pub uncertainty_resolved: bool,
    pub approval_statement: String,
}

pub fn validate_approval_checklist(checklist: &ApprovalChecklist) -> Result<(), String> {
    if !checklist.room_count_confirmed {
        return Err("approval_blocked: room_count_confirmed not confirmed".into());
    }
    if !checklist.kitchen_confirmed {
        return Err("approval_blocked: kitchen_confirmed not confirmed".into());
    }
    if !checklist.bathrooms_confirmed {
        return Err("approval_blocked: bathrooms_confirmed not confirmed".into());
    }
    if !checklist.balcony_confirmed {
        return Err("approval_blocked: balcony_confirmed not confirmed".into());
    }
    if !checklist.entrance_confirmed {
        return Err("approval_blocked: entrance_confirmed not confirmed".into());
    }
    if !checklist.openings_confirmed {
        return Err("approval_blocked: openings_confirmed not confirmed".into());
    }
    if !checklist.dimensions_source_confirmed {
        return Err("approval_blocked: dimensions_source_confirmed not confirmed".into());
    }
    if checklist.dimensions_source.trim().is_empty() {
        return Err("approval_blocked: dimensions_source required".into());
    }
    match checklist.dimensions_source.as_str() {
        "field_sketch" | "manual_confirmation" => {}
        other => {
            return Err(format!(
                "approval_blocked: dimensions_source must be field_sketch or manual_confirmation (got: {other})"
            ));
        }
    }
    if !checklist.uncertainty_resolved {
        return Err("approval_blocked: uncertainty_resolved not confirmed".into());
    }
    if checklist.approval_statement.trim().is_empty() {
        return Err("approval_blocked: approval_statement required".into());
    }

    Ok(())
}

fn map_row(row: &Row<'_>) -> rusqlite::Result<FloorPlanSketch> {
    Ok(FloorPlanSketch {
        id: row.get(0)?,
        case_id: row.get(1)?,
        original_asset_id: row.get(2)?,
        original_sha256: row.get(3)?,
        source_type: row.get(4)?,
        version: row.get(5)?,
        upload_note: row.get(6)?,
        uploaded_by: row.get(7)?,
        uploaded_at: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

fn map_conversion_row(row: &Row<'_>) -> rusqlite::Result<FloorPlanConversion> {
    Ok(FloorPlanConversion {
        id: row.get(0)?,
        sketch_id: row.get(1)?,
        case_id: row.get(2)?,
        status: row.get(3)?,
        extracted_json: row.get(4)?,
        manual_edits_json: row.get(5)?,
        uncertainty_json: row.get(6)?,
        renderer_version: row.get(7)?,
        rendered_asset_id: row.get(8)?,
        approval_checklist_json: row.get(9)?,
        approved_by: row.get(10)?,
        approved_at: row.get(11)?,
        model_provider: row.get(12)?,
        model_id: row.get(13)?,
        prompt_template_version: row.get(14)?,
        response_fingerprint: row.get(15)?,
        created_at: row.get(16)?,
        updated_at: row.get(17)?,
    })
}

const COLS: &str = "id, case_id, original_asset_id, original_sha256, source_type, version, upload_note, uploaded_by, uploaded_at, created_at, updated_at";

const CONV_COLS: &str = "id, sketch_id, case_id, status, extracted_json, manual_edits_json, uncertainty_json, renderer_version, rendered_asset_id, approval_checklist_json, approved_by, approved_at, model_provider, model_id, prompt_template_version, response_fingerprint, created_at, updated_at";

pub fn next_sketch_version(conn: &Connection, case_id: &str) -> Result<i64, DbError> {
    let v: i64 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) + 1 FROM floor_plan_sketches WHERE case_id = ?1",
        [case_id],
        |row| row.get(0),
    )?;
    Ok(v)
}

pub fn insert_sketch(conn: &Connection, sketch: &FloorPlanSketch) -> Result<(), DbError> {
    conn.execute(
        &format!(
            "INSERT INTO floor_plan_sketches ({COLS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
        ),
        params![
            sketch.id,
            sketch.case_id,
            sketch.original_asset_id,
            sketch.original_sha256,
            sketch.source_type,
            sketch.version,
            sketch.upload_note,
            sketch.uploaded_by,
            sketch.uploaded_at,
            sketch.created_at,
            sketch.updated_at,
        ],
    )?;
    Ok(())
}

pub fn list_sketches(conn: &Connection, case_id: &str) -> Result<Vec<FloorPlanSketch>, DbError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM floor_plan_sketches WHERE case_id = ?1 ORDER BY version ASC"
    ))?;
    let rows = stmt.query_map([case_id], map_row)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(DbError::from)?);
    }
    Ok(out)
}

pub fn list_conversions_for_case(
    conn: &Connection,
    case_id: &str,
) -> Result<Vec<FloorPlanConversion>, DbError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {CONV_COLS} FROM floor_plan_conversions WHERE case_id = ?1 ORDER BY created_at ASC"
    ))?;
    let rows = stmt.query_map([case_id], map_conversion_row)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(DbError::from)?);
    }
    Ok(out)
}

/// Returns the conversion only if it is safe to render (status must be "approved").
///
/// This is a defense-in-depth guard to ensure AI-extracted illustrative images can never become
/// final rendered assets: only approved conversions are render-eligible.
pub fn get_conversion_by_id(
    conn: &Connection,
    conversion_id: &str,
) -> Result<FloorPlanConversion, DbError> {
    conn.query_row(
        &format!("SELECT {CONV_COLS} FROM floor_plan_conversions WHERE id=?1"),
        [conversion_id],
        |row| map_conversion_row(row),
    )
    .map_err(DbError::from)
}

pub fn get_conversion_for_render(
    conn: &Connection,
    conversion_id: &str,
) -> Result<FloorPlanConversion, String> {
    let conv = conn
        .query_row(
            &format!(
                "SELECT {CONV_COLS} FROM floor_plan_conversions WHERE id=?1"
            ),
            rusqlite::params![conversion_id],
            |row| map_conversion_row(row),
        )
        .map_err(|e| format!("db_error: {e}"))?;

    if conv.status != "approved" {
        return Err(format!(
            "render_blocked: conversion {} has status {} — only approved conversions can be rendered",
            conversion_id, conv.status
        ));
    }

    Ok(conv)
}

pub fn list_floor_plan_history(
    conn: &Connection,
    case_id: &str,
) -> Result<FloorPlanConversionHistory, DbError> {
    let sketches = list_sketches(conn, case_id)?;
    let conversions = list_conversions_for_case(conn, case_id)?;
    Ok(FloorPlanConversionHistory {
        sketches,
        conversions,
    })
}

pub fn insert_conversion(conn: &Connection, conv: &FloorPlanConversion) -> Result<(), DbError> {
    conn.execute(
        &format!(
            "INSERT INTO floor_plan_conversions ({CONV_COLS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)"
        ),
        params![
            conv.id,
            conv.sketch_id,
            conv.case_id,
            conv.status,
            conv.extracted_json,
            conv.manual_edits_json,
            conv.uncertainty_json,
            conv.renderer_version,
            conv.rendered_asset_id,
            conv.approval_checklist_json,
            conv.approved_by,
            conv.approved_at,
            conv.model_provider,
            conv.model_id,
            conv.prompt_template_version,
            conv.response_fingerprint,
            conv.created_at,
            conv.updated_at,
        ],
    )?;
    Ok(())
}

pub fn update_conversion_checklist(
    conn: &Connection,
    conversion_id: &str,
    checklist_json: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE floor_plan_conversions SET approval_checklist_json=?1, updated_at=?2 WHERE id=?3",
        rusqlite::params![checklist_json, current_taipei_ts(), conversion_id],
    )
    .map_err(|e| format!("db_error: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use tempfile::TempDir;

    fn insert_test_conversion(conn: &Connection, id: &str, sketch_id: &str, case_id: &str, status: &str) {
        let ts = "2026-01-01T00:00:00+08:00";
        conn.execute(
            "INSERT INTO floor_plan_conversions (id, sketch_id, case_id, status, extracted_json, manual_edits_json, uncertainty_json, approval_checklist_json, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)",
            rusqlite::params![id, sketch_id, case_id, status, "{}", "{}", "[]", "{}", ts],
        )
        .unwrap();
    }

    #[test]
    fn two_uploads_get_versions_1_and_2_and_list_is_asc() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();

        let v1 = next_sketch_version(&conn, "c1").unwrap();
        assert_eq!(v1, 1);
        let s1 = FloorPlanSketch {
            id: "s1".into(),
            case_id: "c1".into(),
            original_asset_id: "a1".into(),
            original_sha256: "h1".into(),
            source_type: "field_sketch".into(),
            version: v1,
            upload_note: None,
            uploaded_by: None,
            uploaded_at: ts.clone(),
            created_at: ts.clone(),
            updated_at: ts.clone(),
        };
        insert_sketch(&conn, &s1).unwrap();

        let v2 = next_sketch_version(&conn, "c1").unwrap();
        assert_eq!(v2, 2);
        let s2 = FloorPlanSketch {
            id: "s2".into(),
            case_id: "c1".into(),
            original_asset_id: "a2".into(),
            original_sha256: "h2".into(),
            source_type: "field_sketch".into(),
            version: v2,
            upload_note: Some("note".into()),
            uploaded_by: Some("tester".into()),
            uploaded_at: ts.clone(),
            created_at: ts.clone(),
            updated_at: ts.clone(),
        };
        insert_sketch(&conn, &s2).unwrap();

        let list = list_sketches(&conn, "c1").unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].version, 1);
        assert_eq!(list[1].version, 2);
        assert_eq!(list[0].id, "s1");
        assert_eq!(list[1].id, "s2");
    }

    #[test]
    fn list_floor_plan_history_one_sketch_no_conversions() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let s1 = FloorPlanSketch {
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
        insert_sketch(&conn, &s1).unwrap();

        let history = list_floor_plan_history(&conn, "c1").unwrap();
        assert_eq!(history.sketches.len(), 1);
        assert_eq!(history.conversions.len(), 0);
    }

    #[test]
    fn list_floor_plan_history_is_sorted() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        // Insert sketches out of order; query should return version ASC.
        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let s2 = FloorPlanSketch {
            id: "s2".into(),
            case_id: "c1".into(),
            original_asset_id: "a2".into(),
            original_sha256: "h2".into(),
            source_type: "field_sketch".into(),
            version: 2,
            upload_note: None,
            uploaded_by: None,
            uploaded_at: ts.clone(),
            created_at: ts.clone(),
            updated_at: ts.clone(),
        };
        insert_sketch(&conn, &s2).unwrap();

        let s1 = FloorPlanSketch {
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
        insert_sketch(&conn, &s1).unwrap();

        // Insert conversions out of order; query should return created_at ASC.
        conn.execute(
            "INSERT INTO floor_plan_conversions (id, sketch_id, case_id, status, extracted_json, manual_edits_json, uncertainty_json, renderer_version, rendered_asset_id, approval_checklist_json, approved_by, approved_at, model_provider, model_id, prompt_template_version, response_fingerprint, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
            params![
                "cv2",
                "s1",
                "c1",
                "draft",
                "{}",
                "{}",
                "[]",
                Option::<String>::None,
                Option::<String>::None,
                "{}",
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                "2026-01-02T00:00:00+08:00",
                "2026-01-02T00:00:00+08:00",
            ],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO floor_plan_conversions (id, sketch_id, case_id, status, extracted_json, manual_edits_json, uncertainty_json, renderer_version, rendered_asset_id, approval_checklist_json, approved_by, approved_at, model_provider, model_id, prompt_template_version, response_fingerprint, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
            params![
                "cv1",
                "s1",
                "c1",
                "draft",
                "{}",
                "{}",
                "[]",
                Option::<String>::None,
                Option::<String>::None,
                "{}",
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                Option::<String>::None,
                "2026-01-01T00:00:00+08:00",
                "2026-01-01T00:00:00+08:00",
            ],
        )
        .unwrap();

        let history = list_floor_plan_history(&conn, "c1").unwrap();
        assert_eq!(history.sketches.len(), 2);
        assert_eq!(history.sketches[0].version, 1);
        assert_eq!(history.sketches[1].version, 2);

        assert_eq!(history.conversions.len(), 2);
        assert_eq!(history.conversions[0].id, "cv1");
        assert_eq!(history.conversions[1].id, "cv2");
    }

    #[test]
    fn get_conversion_for_render_rejects_draft() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let s1 = FloorPlanSketch {
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
        insert_sketch(&conn, &s1).unwrap();

        insert_test_conversion(&conn, "cv1", "s1", "c1", "draft");

        let err = get_conversion_for_render(&conn, "cv1").unwrap_err();
        assert!(err.contains("render_blocked"), "err should contain render_blocked, got: {err}");
    }

    #[test]
    fn get_conversion_for_render_accepts_approved() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let s1 = FloorPlanSketch {
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
        insert_sketch(&conn, &s1).unwrap();

        insert_test_conversion(&conn, "cv1", "s1", "c1", "approved");

        let conv = get_conversion_for_render(&conn, "cv1").unwrap();
        assert_eq!(conv.status, "approved");
        assert_eq!(conv.id, "cv1");
    }

    #[test]
    fn update_conversion_checklist_persists_dimensions_source() {
        let dir = TempDir::new().unwrap();
        let db_path = dir.path().join("aire.db");
        let conn = crate::db::init_db(&db_path).unwrap();

        conn.execute(
            "INSERT INTO cases (id, property_type, land_lot_no, address, status, created_at, updated_at, land_lots) VALUES (?1,?2,?3,?4,?5,?6,?6,?7)",
            params!["c1", "residential", "", "", "draft", 0i64, "[]"],
        )
        .unwrap();

        let ts = "2026-01-01T00:00:00+08:00".to_string();
        let s1 = FloorPlanSketch {
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
        insert_sketch(&conn, &s1).unwrap();

        insert_test_conversion(&conn, "cv1", "s1", "c1", "draft");

        update_conversion_checklist(
            &conn,
            "cv1",
            r#"{"dimensions_source":"field_sketch","dimensions_source_confirmed":true}"#,
        )
        .unwrap();

        let stored: String = conn
            .query_row(
                "SELECT approval_checklist_json FROM floor_plan_conversions WHERE id=?1",
                ["cv1"],
                |row| row.get(0),
            )
            .unwrap();
        assert!(stored.contains("field_sketch"));

        update_conversion_checklist(
            &conn,
            "cv1",
            r#"{"dimensions_source":"manual_confirmation","dimensions_source_confirmed":true}"#,
        )
        .unwrap();

        let stored2: String = conn
            .query_row(
                "SELECT approval_checklist_json FROM floor_plan_conversions WHERE id=?1",
                ["cv1"],
                |row| row.get(0),
            )
            .unwrap();
        assert!(stored2.contains("manual_confirmation"));
    }

    fn all_confirmed_checklist() -> ApprovalChecklist {
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

    #[test]
    fn all_confirmed_passes_validation() {
        let checklist = all_confirmed_checklist();
        assert!(validate_approval_checklist(&checklist).is_ok());
    }

    #[test]
    fn missing_room_count_blocked() {
        let mut checklist = all_confirmed_checklist();
        checklist.room_count_confirmed = false;
        let err = validate_approval_checklist(&checklist).unwrap_err();
        assert!(
            err.contains("room_count_confirmed"),
            "err should contain room_count_confirmed, got: {err}"
        );
    }

    #[test]
    fn missing_kitchen_blocked() {
        let mut checklist = all_confirmed_checklist();
        checklist.kitchen_confirmed = false;
        let err = validate_approval_checklist(&checklist).unwrap_err();
        assert!(err.contains("kitchen_confirmed"), "got: {err}");
    }

    #[test]
    fn empty_statement_blocked() {
        let mut checklist = all_confirmed_checklist();
        checklist.approval_statement = "".to_string();
        let err = validate_approval_checklist(&checklist).unwrap_err();
        assert!(
            err.contains("approval_statement"),
            "err should contain approval_statement, got: {err}"
        );
    }

    #[test]
    fn missing_uncertainty_resolved_blocked() {
        let mut checklist = all_confirmed_checklist();
        checklist.uncertainty_resolved = false;
        let err = validate_approval_checklist(&checklist).unwrap_err();
        assert!(
            err.contains("uncertainty_resolved"),
            "err should contain uncertainty_resolved, got: {err}"
        );
    }
}
