use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::DbError;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RegistryQueryRunRow {
    pub id: String,
    pub case_id: Option<String>,
    pub registry_key: String,
    pub input_kind: String,
    pub input_address: Option<String>,
    pub section_code: Option<String>,
    pub section_name: Option<String>,
    pub land_no: Option<String>,
    pub building_no: Option<String>,
    pub confirmation_status: String,
    pub status: String,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
    pub total_cost_cents: i64,
    pub r02_payload_json: Option<Value>,
    pub cop_payload_json: Option<Value>,
    pub error_summary_json: Option<Value>,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct NewRegistryQueryRun {
    pub id: String,
    pub case_id: Option<String>,
    pub registry_key: String,
    pub input_kind: String,
    pub input_address: Option<String>,
    pub normalized_address: Option<String>,
    pub office_code: Option<String>,
    pub office_name: Option<String>,
    pub section_code: Option<String>,
    pub section_name: Option<String>,
    pub land_no: Option<String>,
    pub building_no: Option<String>,
    pub confirmation_status: String,
    pub status: String,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
    pub total_cost_cents: i64,
    pub r02_payload_json: Option<Value>,
    pub cop_payload_json: Option<Value>,
    pub generated_json: Option<Value>,
    pub error_summary_json: Option<Value>,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct NewRegistryQueryApiCall {
    pub id: String,
    pub run_id: String,
    pub api_id: String,
    pub service_name: Option<String>,
    pub method: String,
    pub endpoint: String,
    pub http_status: Option<i64>,
    pub cop_code: Option<String>,
    pub cop_message: Option<String>,
    pub transaction_id: Option<String>,
    pub cost_cents: i64,
    pub request_summary_json: Option<Value>,
    pub response_summary_json: Option<Value>,
    pub created_at: i64,
}

pub fn insert_registry_query_run(
    conn: &Connection,
    run: &NewRegistryQueryRun,
) -> Result<(), DbError> {
    conn.execute(
        "INSERT INTO registry_query_runs (
            id, case_id, registry_key, input_kind, input_address, normalized_address,
            office_code, office_name, section_code, section_name, land_no, building_no,
            confirmation_status, status, cache_hit, source_run_id, total_cost_cents,
            r02_payload_json, cop_payload_json, generated_json, error_summary_json, created_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6,
            ?7, ?8, ?9, ?10, ?11, ?12,
            ?13, ?14, ?15, ?16, ?17,
            ?18, ?19, ?20, ?21, ?22
        )",
        params![
            run.id,
            run.case_id,
            run.registry_key,
            run.input_kind,
            run.input_address,
            run.normalized_address,
            run.office_code,
            run.office_name,
            run.section_code,
            run.section_name,
            run.land_no,
            run.building_no,
            run.confirmation_status,
            run.status,
            if run.cache_hit { 1 } else { 0 },
            run.source_run_id,
            run.total_cost_cents,
            json_to_text(&run.r02_payload_json)?,
            json_to_text(&run.cop_payload_json)?,
            json_to_text(&run.generated_json)?,
            json_to_text(&run.error_summary_json)?,
            run.created_at,
        ],
    )?;
    Ok(())
}

pub fn insert_registry_query_api_call(
    conn: &Connection,
    call: &NewRegistryQueryApiCall,
) -> Result<(), DbError> {
    conn.execute(
        "INSERT INTO registry_query_api_calls (
            id, run_id, api_id, service_name, method, endpoint, http_status,
            cop_code, cop_message, transaction_id, cost_cents,
            request_summary_json, response_summary_json, created_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7,
            ?8, ?9, ?10, ?11,
            ?12, ?13, ?14
        )",
        params![
            call.id,
            call.run_id,
            call.api_id,
            call.service_name,
            call.method,
            call.endpoint,
            call.http_status,
            call.cop_code,
            call.cop_message,
            call.transaction_id,
            call.cost_cents,
            json_to_text(&call.request_summary_json)?,
            json_to_text(&call.response_summary_json)?,
            call.created_at,
        ],
    )?;
    Ok(())
}

pub fn get_registry_query_run_row(
    conn: &Connection,
    id: &str,
) -> Result<RegistryQueryRunRow, DbError> {
    conn.query_row(
        "SELECT id, case_id, registry_key, input_kind, input_address, section_code,
            section_name, land_no, building_no, confirmation_status, status, cache_hit,
            source_run_id, total_cost_cents, r02_payload_json, cop_payload_json,
            error_summary_json, created_at
         FROM registry_query_runs WHERE id = ?1",
        [id],
        map_registry_query_run,
    )
    .map_err(|error| match error {
        rusqlite::Error::QueryReturnedNoRows => DbError::not_found("registry_query_run"),
        other => DbError::from(other),
    })
}

pub fn list_registry_query_run_rows(
    conn: &Connection,
    keyword: Option<&str>,
) -> Result<Vec<RegistryQueryRunRow>, DbError> {
    let like = keyword
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| format!("%{value}%"));

    let sql = if like.is_some() {
        "SELECT id, case_id, registry_key, input_kind, input_address, section_code,
            section_name, land_no, building_no, confirmation_status, status, cache_hit,
            source_run_id, total_cost_cents, r02_payload_json, cop_payload_json,
            error_summary_json, created_at
         FROM registry_query_runs
         WHERE registry_key LIKE ?1 OR input_address LIKE ?1 OR section_name LIKE ?1
            OR land_no LIKE ?1 OR building_no LIKE ?1 OR status LIKE ?1
         ORDER BY created_at DESC"
    } else {
        "SELECT id, case_id, registry_key, input_kind, input_address, section_code,
            section_name, land_no, building_no, confirmation_status, status, cache_hit,
            source_run_id, total_cost_cents, r02_payload_json, cop_payload_json,
            error_summary_json, created_at
         FROM registry_query_runs
         ORDER BY created_at DESC"
    };

    let mut stmt = conn.prepare(sql)?;
    let rows = if let Some(like) = like {
        stmt.query_map([like], map_registry_query_run)?
            .collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map([], map_registry_query_run)?
            .collect::<Result<Vec<_>, _>>()?
    };
    Ok(rows)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryQueryApiCallIpc {
    pub id: String,
    pub service_code: String,
    pub transaction_id: Option<String>,
    pub http_status: i64,
    pub moi_code: Option<String>,
    pub moi_message: Option<String>,
    pub return_rows: i64,
    pub cost_cents: i64,
    pub started_at: String,
    pub finished_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryQueryRunIpc {
    pub id: String,
    pub organization_id: String,
    pub case_id: Option<String>,
    pub input_type: String,
    pub source_input: String,
    pub match_status: String,
    pub candidate_json: Option<Value>,
    pub cop_response_json: Option<Value>,
    pub raw_response_json: Option<Value>,
    pub total_cost_cents: i64,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub api_calls: Vec<RegistryQueryApiCallIpc>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn list_registry_query_runs(
    db: tauri::State<'_, crate::DbState>,
    keyword: Option<String>,
) -> Result<Vec<RegistryQueryRunIpc>, String> {
    let conn = db.0.lock().map_err(|error| format!("db lock poisoned: {error}"))?;
    let rows = list_registry_query_run_rows(&conn, keyword.as_deref())
        .map_err(|error| error.to_string())?;
    rows.into_iter().map(|row| row_to_ipc(&conn, row)).collect()
}

#[tauri::command]
pub fn get_registry_query_run_detail(
    db: tauri::State<'_, crate::DbState>,
    run_id: String,
) -> Result<RegistryQueryRunIpc, String> {
    let conn = db.0.lock().map_err(|error| format!("db lock poisoned: {error}"))?;
    let row = get_registry_query_run_row(&conn, &run_id).map_err(|error| error.to_string())?;
    row_to_ipc(&conn, row)
}

fn row_to_ipc(conn: &Connection, row: RegistryQueryRunRow) -> Result<RegistryQueryRunIpc, String> {
    let api_calls = list_api_calls_for_run(conn, &row.id)?;
    let created_at = unix_to_utc_string(row.created_at);
    let error_code = row
        .error_summary_json
        .as_ref()
        .and_then(|value| value.get("errorCode"))
        .and_then(Value::as_str)
        .map(str::to_string);
    let error_message = row
        .error_summary_json
        .as_ref()
        .and_then(|value| {
            value
                .get("nextAction")
                .or_else(|| value.get("message"))
                .or_else(|| value.get("rawSummary"))
        })
        .and_then(Value::as_str)
        .map(str::to_string);

    Ok(RegistryQueryRunIpc {
        id: row.id,
        organization_id: "local-device".to_string(),
        case_id: row.case_id,
        input_type: row.input_kind,
        source_input: row.input_address.unwrap_or_else(|| row.registry_key.clone()),
        match_status: if row.confirmation_status == "confirmed" {
            "confirmed".to_string()
        } else {
            "candidate".to_string()
        },
        candidate_json: row.r02_payload_json.clone(),
        cop_response_json: row.cop_payload_json.clone(),
        raw_response_json: row.r02_payload_json.or(row.error_summary_json.clone()),
        total_cost_cents: row.total_cost_cents,
        cache_hit: row.cache_hit,
        source_run_id: row.source_run_id,
        error_code,
        error_message,
        api_calls,
        created_at: created_at.clone(),
        updated_at: created_at,
    })
}

fn list_api_calls_for_run(
    conn: &Connection,
    run_id: &str,
) -> Result<Vec<RegistryQueryApiCallIpc>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, api_id, transaction_id, http_status, cop_code, cop_message,
                cost_cents, created_at
             FROM registry_query_api_calls
             WHERE run_id = ?1
             ORDER BY created_at ASC",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([run_id], |row| {
            let created_at_ts = row.get::<_, i64>(7)?;
            let created_at = unix_to_utc_string(created_at_ts);
            Ok(RegistryQueryApiCallIpc {
                id: row.get(0)?,
                service_code: row.get(1)?,
                transaction_id: row.get(2)?,
                http_status: row.get::<_, Option<i64>>(3)?.unwrap_or(0),
                moi_code: row.get(4)?,
                moi_message: row.get(5)?,
                return_rows: 0,
                cost_cents: row.get(6)?,
                started_at: created_at.clone(),
                finished_at: created_at,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn unix_to_utc_string(value: i64) -> String {
    chrono::DateTime::<chrono::Utc>::from_timestamp(value, 0)
        .map(|dt| dt.to_rfc3339())
        .unwrap_or_else(|| value.to_string())
}

fn map_registry_query_run(row: &rusqlite::Row<'_>) -> rusqlite::Result<RegistryQueryRunRow> {
    Ok(RegistryQueryRunRow {
        id: row.get(0)?,
        case_id: row.get(1)?,
        registry_key: row.get(2)?,
        input_kind: row.get(3)?,
        input_address: row.get(4)?,
        section_code: row.get(5)?,
        section_name: row.get(6)?,
        land_no: row.get(7)?,
        building_no: row.get(8)?,
        confirmation_status: row.get(9)?,
        status: row.get(10)?,
        cache_hit: row.get::<_, i64>(11)? != 0,
        source_run_id: row.get(12)?,
        total_cost_cents: row.get(13)?,
        r02_payload_json: text_to_json(row.get::<_, Option<String>>(14)?),
        cop_payload_json: text_to_json(row.get::<_, Option<String>>(15)?),
        error_summary_json: text_to_json(row.get::<_, Option<String>>(16)?),
        created_at: row.get(17)?,
    })
}

fn json_to_text(value: &Option<Value>) -> Result<Option<String>, DbError> {
    value
        .as_ref()
        .map(serde_json::to_string)
        .transpose()
        .map_err(|error| DbError::new("json_serialize", error.to_string()))
}

fn text_to_json(raw: Option<String>) -> Option<Value> {
    raw.and_then(|value| serde_json::from_str(&value).ok())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::open_in_memory;

    #[test]
    fn migration_creates_query_run_tables_and_indexes() {
        let conn = open_in_memory();
        for table in ["registry_query_runs", "registry_query_api_calls"] {
            let count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                    [table],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(count, 1, "table {table} should exist");
        }
    }

    #[test]
    fn insert_get_and_search_r02_zero_cost_run() {
        let conn = open_in_memory();
        let payload = serde_json::json!({
            "adapter": "easymap_r02_desktop",
            "parserVersion": "r02-text-v1",
            "candidates": [{
                "sectionCode": "1556",
                "sectionName": "富強段",
                "buildingNo": "00204000"
            }]
        });
        let run = NewRegistryQueryRun {
            id: "run-r02-001".to_string(),
            case_id: Some("case-001".to_string()),
            registry_key: "DC:1556:00700000:00204000".to_string(),
            input_kind: "address".to_string(),
            input_address: Some("台南市東區裕農路288巷17號8樓之1".to_string()),
            normalized_address: Some("臺南市東區裕農路288巷17號8樓之1".to_string()),
            office_code: Some("DC".to_string()),
            office_name: Some("東南地政事務所".to_string()),
            section_code: Some("1556".to_string()),
            section_name: Some("富強段".to_string()),
            land_no: Some("00700000".to_string()),
            building_no: Some("00204000".to_string()),
            confirmation_status: "candidate_unconfirmed".to_string(),
            status: "candidate_unconfirmed".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: Some(payload.clone()),
            cop_payload_json: None,
            generated_json: None,
            error_summary_json: None,
            created_at: 1_779_648_000,
        };

        insert_registry_query_run(&conn, &run).unwrap();

        let got = get_registry_query_run_row(&conn, "run-r02-001").unwrap();
        assert_eq!(got.total_cost_cents, 0);
        assert_eq!(got.confirmation_status, "candidate_unconfirmed");
        assert_eq!(got.r02_payload_json, Some(payload));

        let search = list_registry_query_run_rows(&conn, Some("富強段")).unwrap();
        assert_eq!(search.len(), 1);
        assert_eq!(search[0].id, "run-r02-001");
    }

    #[test]
    fn ipc_shape_matches_settings_query_record_contract() {
        let conn = open_in_memory();
        insert_registry_query_run(
            &conn,
            &NewRegistryQueryRun {
                id: "run-ipc-001".to_string(),
                case_id: Some("case-ipc".to_string()),
                registry_key: "r02:1556:unknown-land:00204000".to_string(),
                input_kind: "address".to_string(),
                input_address: Some("台南市東區裕農路288巷17號8樓之1".to_string()),
                normalized_address: None,
                office_code: None,
                office_name: Some("東南地政事務所".to_string()),
                section_code: Some("1556".to_string()),
                section_name: Some("富強段".to_string()),
                land_no: None,
                building_no: Some("00204000".to_string()),
                confirmation_status: "candidate_unconfirmed".to_string(),
                status: "candidate_unconfirmed".to_string(),
                cache_hit: false,
                source_run_id: None,
                total_cost_cents: 0,
                r02_payload_json: Some(serde_json::json!({"adapter": "easymap_r02_desktop"})),
                cop_payload_json: None,
                generated_json: None,
                error_summary_json: None,
                created_at: 1_779_648_000,
            },
        )
        .unwrap();

        let row = get_registry_query_run_row(&conn, "run-ipc-001").unwrap();
        let ipc = row_to_ipc(&conn, row).unwrap();
        assert_eq!(ipc.organization_id, "local-device");
        assert_eq!(ipc.input_type, "address");
        assert_eq!(ipc.source_input, "台南市東區裕農路288巷17號8樓之1");
        assert_eq!(ipc.match_status, "candidate");
        assert_eq!(ipc.total_cost_cents, 0);
        assert_eq!(ipc.api_calls.len(), 0);
        assert!(ipc.created_at.starts_with("2026-"));
    }
}
