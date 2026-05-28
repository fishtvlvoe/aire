use serde::{Deserialize, Serialize};

use crate::land_registry::easymap_r02::{R02BuildingCandidate, R02DiscoveryRun};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiscoveryStatus {
    CandidateFound,
    ManualRequired,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiscoverySource {
    EasymapR02,
    LocalDiscovery,
    TauriDesktop,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryCandidate {
    pub registry_key: String,
    pub section_name: Option<String>,
    pub land_number: Option<String>,
    pub building_number: Option<String>,
    pub source: DiscoverySource,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryError {
    pub source: String,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryResult {
    pub status: DiscoveryStatus,
    pub source: DiscoverySource,
    pub normalized_address: String,
    pub candidates: Vec<DiscoveryCandidate>,
    pub errors: Vec<DiscoveryError>,
    pub trusted_for_pdf: bool,
    pub total_cost_cents: i64,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
}

pub fn discovery_result_from_r02_run(
    run: &R02DiscoveryRun,
    cache_hit: bool,
    source_run_id: Option<String>,
) -> DiscoveryResult {
    DiscoveryResult {
        status: if run.candidates.is_empty() {
            DiscoveryStatus::ManualRequired
        } else {
            DiscoveryStatus::CandidateFound
        },
        source: DiscoverySource::EasymapR02,
        normalized_address: run.input_address.trim().to_string(),
        candidates: run
            .candidates
            .iter()
            .map(discovery_candidate_from_r02_candidate)
            .collect(),
        errors: vec![],
        trusted_for_pdf: false,
        total_cost_cents: 0,
        cache_hit,
        source_run_id,
    }
}

fn discovery_candidate_from_r02_candidate(candidate: &R02BuildingCandidate) -> DiscoveryCandidate {
    DiscoveryCandidate {
        registry_key: r02_registry_key(candidate),
        section_name: candidate.section_name.clone(),
        land_number: candidate.land_no.clone(),
        building_number: candidate.building_no.clone(),
        source: DiscoverySource::EasymapR02,
    }
}

fn r02_registry_key(candidate: &R02BuildingCandidate) -> String {
    let section = candidate.section_code.as_deref().unwrap_or("unknown-section");
    let land = candidate.land_no.as_deref().unwrap_or("unknown-land");
    let building = candidate.building_no.as_deref().unwrap_or("unknown-building");
    format!("r02:{section}:{land}:{building}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::land_registry::easymap_r02::{parse_r02_result_text, R02BuildingCandidate, R02DiscoveryRun};

    #[test]
    fn discovery_result_serializes_to_shared_camel_case_contract() {
        let result = DiscoveryResult {
            status: DiscoveryStatus::ManualRequired,
            source: DiscoverySource::LocalDiscovery,
            normalized_address: "台南市永康區勝利街58巷4號".to_string(),
            candidates: vec![],
            errors: vec![DiscoveryError {
                source: "local_discovery".to_string(),
                code: "address_discovery_unavailable".to_string(),
                message: "需要人工確認".to_string(),
            }],
            trusted_for_pdf: false,
            total_cost_cents: 0,
            cache_hit: false,
            source_run_id: None,
        };

        let payload = serde_json::to_value(result).expect("serialize discovery result");

        assert_eq!(payload["status"], "manual_required");
        assert_eq!(payload["source"], "local_discovery");
        assert_eq!(payload["normalizedAddress"], "台南市永康區勝利街58巷4號");
        assert_eq!(payload["trustedForPdf"], false);
        assert_eq!(payload["totalCostCents"], 0);
        assert_eq!(payload["cacheHit"], false);
        assert!(payload["sourceRunId"].is_null());
    }

    #[test]
    fn desktop_r02_run_normalizes_to_shared_discovery_contract() {
        let run = R02DiscoveryRun {
            adapter: "easymap_r02_desktop".to_string(),
            parser_version: "r02-text-v1".to_string(),
            input_address: "台南市東區裕農路288巷17號8樓之1".to_string(),
            status: "candidate_unconfirmed".to_string(),
            total_cost_cents: 0,
            candidates: vec![R02BuildingCandidate {
                administrative_district: Some("臺南市 東區".to_string()),
                land_office: Some("東南地政事務所".to_string()),
                section_code: Some("1556".to_string()),
                section_name: Some("富強段".to_string()),
                land_no: Some("00700000".to_string()),
                building_no: Some("00204000".to_string()),
                building_area_sqm: None,
                total_floor_count: None,
                floor_label: None,
                completion_date_roc: None,
                age_years: None,
                main_use: Some("住家用".to_string()),
            }],
            raw_summary: "查詢結果".to_string(),
            missing_fields: vec![],
            error_code: None,
            next_action: None,
        };

        let result = discovery_result_from_r02_run(&run, true, Some("run-r02-001".to_string()));
        let payload = serde_json::to_value(result).expect("serialize discovery result");

        assert_eq!(payload["status"], "candidate_found");
        assert_eq!(payload["source"], "easymap_r02");
        assert_eq!(payload["normalizedAddress"], "台南市東區裕農路288巷17號8樓之1");
        assert_eq!(payload["trustedForPdf"], false);
        assert_eq!(payload["totalCostCents"], 0);
        assert_eq!(payload["cacheHit"], true);
        assert_eq!(payload["sourceRunId"], "run-r02-001");
        assert_eq!(payload["candidates"][0]["registryKey"], "r02:1556:00700000:00204000");
    }

    #[test]
    fn r02_parser_fixture_handles_multiple_candidates_and_empty_result() {
        let multi = r#"
            查詢結果
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            地號 00700000
            建號 00204000
            主要用途 住家用

            查詢結果
            行政區 臺南市 東區
            地政事務所 東南地政事務所
            地段 1556 富強段
            地號 00700001
            建號 00204001
            主要用途 住家用
        "#;

        let parsed = parse_r02_result_text("台南市東區裕農路288巷17號", multi).unwrap();
        assert_eq!(parsed.candidates.len(), 2);
        assert_eq!(parsed.candidates[0].land_no.as_deref(), Some("00700000"));
        assert_eq!(parsed.candidates[1].building_no.as_deref(), Some("00204001"));

        let empty = parse_r02_result_text("台南市永康區勝利街58巷4號", "查無資料").unwrap_err();
        assert_eq!(empty.error_code, "r02_no_usable_candidate");
        assert_eq!(empty.next_action, "manual_registry_key_required");
    }
}
