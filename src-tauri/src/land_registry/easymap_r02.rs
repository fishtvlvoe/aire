use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::db::registry_query_runs::{insert_registry_query_run, NewRegistryQueryRun};

pub const R02_DESKTOP_ADAPTER: &str = "easymap_r02_desktop";
pub const R02_PARSER_VERSION: &str = "r02-text-v1";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02BuildingCandidate {
    pub administrative_district: Option<String>,
    pub land_office: Option<String>,
    pub section_code: Option<String>,
    pub section_name: Option<String>,
    pub land_no: Option<String>,
    pub building_no: Option<String>,
    pub building_area_sqm: Option<String>,
    pub total_floor_count: Option<String>,
    pub floor_label: Option<String>,
    pub completion_date_roc: Option<String>,
    pub age_years: Option<String>,
    pub main_use: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02DiscoveryRun {
    pub adapter: String,
    pub parser_version: String,
    pub input_address: String,
    pub status: String,
    pub total_cost_cents: i64,
    pub candidates: Vec<R02BuildingCandidate>,
    pub raw_summary: String,
    pub missing_fields: Vec<String>,
    pub error_code: Option<String>,
    pub next_action: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02ParseFailure {
    pub adapter: String,
    pub parser_version: String,
    pub status: String,
    pub error_code: String,
    pub missing_fields: Vec<String>,
    pub raw_summary: String,
    pub next_action: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct R02RecordedDiscoveryRun {
    pub run_id: String,
    pub ok: bool,
    pub discovery: Option<R02DiscoveryRun>,
    pub error: Option<R02ParseFailure>,
}

pub fn parse_r02_result_text(
    input_address: &str,
    text_or_html: &str,
) -> Result<R02DiscoveryRun, R02ParseFailure> {
    let normalized = normalize_text(text_or_html);
    let candidate = R02BuildingCandidate {
        administrative_district: extract_label(&normalized, "行政區"),
        land_office: extract_label(&normalized, "地政事務所"),
        section_code: extract_section_code(&normalized),
        section_name: extract_section_name(&normalized),
        land_no: extract_label(&normalized, "地號"),
        building_no: extract_label(&normalized, "建號").map(|value| digits_only_or_original(&value)),
        building_area_sqm: extract_label(&normalized, "建物面積")
            .map(|value| value.replace("平方公尺", "").trim().to_string()),
        total_floor_count: extract_label(&normalized, "樓層數"),
        floor_label: extract_label(&normalized, "樓層別"),
        completion_date_roc: extract_completion_date(&normalized),
        age_years: extract_age_years(&normalized),
        main_use: extract_label(&normalized, "主要用途"),
    };

    let missing_fields = required_missing_fields(&candidate);
    if !missing_fields.is_empty() {
        return Err(R02ParseFailure {
            adapter: R02_DESKTOP_ADAPTER.to_string(),
            parser_version: R02_PARSER_VERSION.to_string(),
            status: "r02_parse_failed".to_string(),
            error_code: "r02_required_fields_missing".to_string(),
            missing_fields,
            raw_summary: summarize_raw(&normalized),
            next_action: "manual_registry_key_required".to_string(),
        });
    }

    Ok(R02DiscoveryRun {
        adapter: R02_DESKTOP_ADAPTER.to_string(),
        parser_version: R02_PARSER_VERSION.to_string(),
        input_address: input_address.trim().to_string(),
        status: "candidate_unconfirmed".to_string(),
        total_cost_cents: 0,
        candidates: vec![candidate],
        raw_summary: summarize_raw(&normalized),
        missing_fields,
        error_code: None,
        next_action: None,
    })
}

#[tauri::command]
pub fn land_registry_parse_r02_result_text(
    input_address: String,
    text_or_html: String,
) -> Result<R02DiscoveryRun, R02ParseFailure> {
    parse_r02_result_text(&input_address, &text_or_html)
}

pub fn record_r02_result_text(
    conn: &rusqlite::Connection,
    case_id: Option<String>,
    input_address: &str,
    text_or_html: &str,
    created_at: i64,
) -> Result<R02RecordedDiscoveryRun, String> {
    let run_id = Uuid::new_v4().to_string();
    match parse_r02_result_text(input_address, text_or_html) {
        Ok(discovery) => {
            let candidate = discovery.candidates.first();
            let registry_key = build_registry_key(candidate);
            insert_registry_query_run(
                conn,
                &NewRegistryQueryRun {
                    id: run_id.clone(),
                    case_id,
                    registry_key,
                    input_kind: "address".to_string(),
                    input_address: Some(input_address.trim().to_string()),
                    normalized_address: Some(input_address.trim().replace('台', "臺")),
                    office_code: None,
                    office_name: candidate.and_then(|value| value.land_office.clone()),
                    section_code: candidate.and_then(|value| value.section_code.clone()),
                    section_name: candidate.and_then(|value| value.section_name.clone()),
                    land_no: candidate.and_then(|value| value.land_no.clone()),
                    building_no: candidate.and_then(|value| value.building_no.clone()),
                    confirmation_status: "candidate_unconfirmed".to_string(),
                    status: "candidate_unconfirmed".to_string(),
                    cache_hit: false,
                    source_run_id: None,
                    total_cost_cents: 0,
                    r02_payload_json: Some(serde_json::to_value(&discovery).map_err(|error| {
                        format!("serialize r02 discovery failed: {error}")
                    })?),
                    cop_payload_json: None,
                    generated_json: None,
                    error_summary_json: None,
                    created_at,
                },
            )
            .map_err(|error| error.to_string())?;
            Ok(R02RecordedDiscoveryRun {
                run_id,
                ok: true,
                discovery: Some(discovery),
                error: None,
            })
        }
        Err(error) => {
            insert_registry_query_run(
                conn,
                &NewRegistryQueryRun {
                    id: run_id.clone(),
                    case_id,
                    registry_key: format!("r02_parse_failed:{run_id}"),
                    input_kind: "address".to_string(),
                    input_address: Some(input_address.trim().to_string()),
                    normalized_address: Some(input_address.trim().replace('台', "臺")),
                    office_code: None,
                    office_name: None,
                    section_code: None,
                    section_name: None,
                    land_no: None,
                    building_no: None,
                    confirmation_status: "candidate_unconfirmed".to_string(),
                    status: "r02_parse_failed".to_string(),
                    cache_hit: false,
                    source_run_id: None,
                    total_cost_cents: 0,
                    r02_payload_json: None,
                    cop_payload_json: None,
                    generated_json: None,
                    error_summary_json: Some(json!({
                        "adapter": error.adapter,
                        "parserVersion": error.parser_version,
                        "errorCode": error.error_code,
                        "missingFields": error.missing_fields,
                        "rawSummary": error.raw_summary,
                        "nextAction": error.next_action,
                    })),
                    created_at,
                },
            )
            .map_err(|error| error.to_string())?;
            Ok(R02RecordedDiscoveryRun {
                run_id,
                ok: false,
                discovery: None,
                error: Some(error),
            })
        }
    }
}

#[tauri::command]
pub fn land_registry_record_r02_result_text(
    db: tauri::State<'_, crate::DbState>,
    case_id: Option<String>,
    input_address: String,
    text_or_html: String,
) -> Result<R02RecordedDiscoveryRun, String> {
    let conn = db.0.lock().map_err(|error| format!("db lock poisoned: {error}"))?;
    record_r02_result_text(
        &conn,
        case_id,
        &input_address,
        &text_or_html,
        chrono::Utc::now().timestamp(),
    )
}

fn normalize_text(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut in_tag = false;

    for ch in input.chars() {
        match ch {
            '<' => {
                in_tag = true;
                out.push('\n');
            }
            '>' => {
                in_tag = false;
                out.push('\n');
            }
            _ if in_tag => {}
            '\r' | '\t' | '\u{00a0}' => out.push(' '),
            _ => out.push(ch),
        }
    }

    out.lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn extract_label(text: &str, label: &str) -> Option<String> {
    let labels = [
        "行政區",
        "地政事務所",
        "地段",
        "地號",
        "建號",
        "建物面積",
        "樓層數",
        "樓層別",
        "建物完成日期",
        "主要用途",
    ];
    let lines: Vec<&str> = text.lines().collect();

    for (idx, line) in lines.iter().enumerate() {
        let compact = line.replace('：', ":");
        if compact == label {
            return lines.get(idx + 1).map(|value| clean_value(value));
        }

        if let Some(value) = compact.strip_prefix(label) {
            let value = value.trim_start_matches(':').trim();
            if !value.is_empty() {
                return Some(clean_value(value));
            }
        }

        if let Some(pos) = compact.find(label) {
            let after = compact[pos + label.len()..].trim_start_matches(':').trim();
            if !after.is_empty() {
                let next_label_pos = labels
                    .iter()
                    .filter(|candidate| **candidate != label)
                    .filter_map(|candidate| after.find(candidate))
                    .min()
                    .unwrap_or(after.len());
                return Some(clean_value(&after[..next_label_pos]));
            }
        }
    }

    None
}

fn extract_section_code(text: &str) -> Option<String> {
    extract_label(text, "地段").and_then(|value| value.split_whitespace().next().map(str::to_string))
}

fn extract_section_name(text: &str) -> Option<String> {
    extract_label(text, "地段").map(|value| {
        let mut parts = value.split_whitespace();
        let first = parts.next().unwrap_or_default();
        let rest = parts.collect::<Vec<_>>().join(" ");
        if rest.is_empty() {
            first.to_string()
        } else {
            rest
        }
    })
}

fn extract_completion_date(text: &str) -> Option<String> {
    extract_label(text, "建物完成日期").and_then(|value| value.split_whitespace().next().map(str::to_string))
}

fn extract_age_years(text: &str) -> Option<String> {
    let value = extract_label(text, "建物完成日期")?;
    let start = value.find("屋齡")?;
    Some(value[start..].trim_matches(|ch| ch == '(' || ch == ')' || ch == '（' || ch == '）').to_string())
}

fn clean_value(value: &str) -> String {
    value
        .trim()
        .trim_matches('|')
        .trim()
        .replace("　", " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn digits_only_or_original(value: &str) -> String {
    let digits = value.chars().filter(|ch| ch.is_ascii_digit()).collect::<String>();
    if digits.is_empty() {
        value.trim().to_string()
    } else {
        digits
    }
}

fn required_missing_fields(candidate: &R02BuildingCandidate) -> Vec<String> {
    let mut missing = Vec::new();
    if candidate.section_code.as_deref().unwrap_or_default().is_empty() {
        missing.push("section_code".to_string());
    }
    if candidate.section_name.as_deref().unwrap_or_default().is_empty() {
        missing.push("section_name".to_string());
    }
    if candidate.building_no.as_deref().unwrap_or_default().is_empty() {
        missing.push("building_no".to_string());
    }
    missing
}

fn summarize_raw(text: &str) -> String {
    const MAX_CHARS: usize = 1200;
    text.chars().take(MAX_CHARS).collect()
}

fn build_registry_key(candidate: Option<&R02BuildingCandidate>) -> String {
    let section = candidate
        .and_then(|value| value.section_code.as_deref())
        .unwrap_or("unknown-section");
    let land = candidate
        .and_then(|value| value.land_no.as_deref())
        .unwrap_or("unknown-land");
    let building = candidate
        .and_then(|value| value.building_no.as_deref())
        .unwrap_or("unknown-building");
    format!("r02:{section}:{land}:{building}")
}

#[cfg(test)]
mod tests {
    use super::{parse_r02_result_text, record_r02_result_text};
    use crate::db::registry_query_runs::get_registry_query_run_row;
    use crate::db::tests::open_in_memory;

    #[test]
    fn parses_old_r02_building_result_dialog_text() {
        let text = r#"
            查詢結果
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            建號 00204000
            建物面積 83.61 平方公尺
            樓層數 012
            樓層別 八層
            建物完成日期 0800829 (屋齡:約 34年)
            主要用途 住家用
        "#;

        let run = parse_r02_result_text("台南市東區裕農路288巷17號8樓之1", text).unwrap();
        let candidate = &run.candidates[0];

        assert_eq!(run.adapter, "easymap_r02_desktop");
        assert_eq!(run.parser_version, "r02-text-v1");
        assert_eq!(run.status, "candidate_unconfirmed");
        assert_eq!(run.total_cost_cents, 0);
        assert_eq!(candidate.administrative_district.as_deref(), Some("臺南市 東區"));
        assert_eq!(candidate.land_office.as_deref(), Some("東南地政事務所"));
        assert_eq!(candidate.section_code.as_deref(), Some("1556"));
        assert_eq!(candidate.section_name.as_deref(), Some("富強段"));
        assert_eq!(candidate.building_no.as_deref(), Some("00204000"));
        assert_eq!(candidate.building_area_sqm.as_deref(), Some("83.61"));
        assert_eq!(candidate.total_floor_count.as_deref(), Some("012"));
        assert_eq!(candidate.floor_label.as_deref(), Some("八層"));
        assert_eq!(candidate.completion_date_roc.as_deref(), Some("0800829"));
        assert_eq!(candidate.age_years.as_deref(), Some("屋齡:約 34年"));
        assert_eq!(candidate.main_use.as_deref(), Some("住家用"));
    }

    #[test]
    fn records_parse_failed_diagnostics_when_required_fields_missing() {
        let error = parse_r02_result_text(
            "台南市永康區勝利街 2 巷 92 弄 13 號",
            "查詢結果\n行政區 臺南市 永康區\n地政事務所 永康地政事務所",
        )
        .unwrap_err();

        assert_eq!(error.status, "r02_parse_failed");
        assert_eq!(error.error_code, "r02_required_fields_missing");
        assert_eq!(error.next_action, "manual_registry_key_required");
        assert!(error.missing_fields.contains(&"section_code".to_string()));
        assert!(error.missing_fields.contains(&"section_name".to_string()));
        assert!(error.missing_fields.contains(&"building_no".to_string()));
        assert!(error.raw_summary.contains("行政區"));
    }

    #[test]
    fn records_successful_r02_parse_to_query_run_table() {
        let conn = open_in_memory();
        let text = r#"
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            建號 00204000
            主要用途 住家用
        "#;

        let recorded = record_r02_result_text(
            &conn,
            Some("case-r02-001".to_string()),
            "台南市東區裕農路288巷17號8樓之1",
            text,
            1_779_648_000,
        )
        .unwrap();

        assert!(recorded.ok);
        let row = get_registry_query_run_row(&conn, &recorded.run_id).unwrap();
        assert_eq!(row.case_id.as_deref(), Some("case-r02-001"));
        assert_eq!(row.status, "candidate_unconfirmed");
        assert_eq!(row.total_cost_cents, 0);
        assert_eq!(row.section_code.as_deref(), Some("1556"));
        assert_eq!(row.building_no.as_deref(), Some("00204000"));
        assert!(row.r02_payload_json.is_some());
    }

    #[test]
    fn records_failed_r02_parse_to_query_run_table() {
        let conn = open_in_memory();

        let recorded = record_r02_result_text(
            &conn,
            None,
            "台南市永康區勝利街 2 巷 92 弄 13 號",
            "查詢結果\n行政區 臺南市 永康區",
            1_779_648_000,
        )
        .unwrap();

        assert!(!recorded.ok);
        let row = get_registry_query_run_row(&conn, &recorded.run_id).unwrap();
        assert_eq!(row.status, "r02_parse_failed");
        assert_eq!(row.total_cost_cents, 0);
        assert!(row.error_summary_json.is_some());
    }
}
