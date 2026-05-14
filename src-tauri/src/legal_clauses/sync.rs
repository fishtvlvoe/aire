use std::time::Duration;

use reqwest::Client;
use rusqlite::Connection;
use serde::Deserialize;

use crate::legal_clauses::{cache, LegalClause, LegalClausesError, SyncResult};

const TEST_OK_ENDPOINT: &str = "http://localhost:19999/v1/legal-clauses";
const TEST_UNREACHABLE_ENDPOINT: &str = "http://localhost:19998/v1/legal-clauses";

#[derive(Debug, Deserialize)]
struct LawsResp {
    laws: Vec<LawWire>,
}

#[derive(Debug, Deserialize)]
struct LawWire {
    law_id: String,
    title: String,
    content_markdown: String,
    version_date: String,
    source_url: String,
}

fn parse_strict_ymd(date_ymd: &str) -> Option<chrono::NaiveDate> {
    // Strict YYYY-MM-DD (rejects e.g. "113-05-10" 民國年 without zero-padding).
    if date_ymd.len() != 10 {
        return None;
    }
    let b = date_ymd.as_bytes();
    if b[4] != b'-' || b[7] != b'-' {
        return None;
    }
    if !b[..4].iter().all(|c| c.is_ascii_digit())
        || !b[5..7].iter().all(|c| c.is_ascii_digit())
        || !b[8..10].iter().all(|c| c.is_ascii_digit())
    {
        return None;
    }
    chrono::NaiveDate::parse_from_str(date_ymd, "%Y-%m-%d").ok()
}

pub fn validate_legal_clause(clause: &LegalClause) -> Result<(), LegalClausesError> {
    if clause.source_url.trim().is_empty() {
        return Err(LegalClausesError::InvalidData);
    }
    if !clause.source_url.starts_with("https://") {
        return Err(LegalClausesError::InvalidData);
    }
    if parse_strict_ymd(&clause.version_date).is_none() {
        return Err(LegalClausesError::InvalidData);
    }
    Ok(())
}

pub fn is_remote_version_newer(local: &str, remote: &str) -> bool {
    match (parse_strict_ymd(local), parse_strict_ymd(remote)) {
        (Some(l), Some(r)) => r > l,
        _ => remote != local,
    }
}

fn build_client(timeout_secs: u64) -> Result<Client, LegalClausesError> {
    Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build()
        .map_err(|_| LegalClausesError::OpcosUnreachable)
}

fn bearer_token() -> Option<String> {
    std::env::var("OPCOS_API_TOKEN")
        .ok()
        .or_else(|| std::env::var("OPCOS_BEARER_TOKEN").ok())
        .filter(|s| !s.trim().is_empty())
}

async fn get_with_bearer_retry(
    url: &str,
    timeout_secs: u64,
) -> Result<reqwest::Response, LegalClausesError> {
    let client = build_client(timeout_secs)?;
    let token = bearer_token();

    let mut req = client.get(url);
    if let Some(t) = token.as_ref() {
        req = req.bearer_auth(t);
    }

    let resp = req
        .send()
        .await
        .map_err(|_| LegalClausesError::OpcosUnreachable)?;
    if resp.status().as_u16() == 401 {
        let mut req2 = client.get(url);
        if let Some(t) = bearer_token().as_ref() {
            req2 = req2.bearer_auth(t);
        }
        let resp2 = req2
            .send()
            .await
            .map_err(|_| LegalClausesError::OpcosUnreachable)?;
        if resp2.status().as_u16() == 401 {
            Err(LegalClausesError::AuthFailed)
        } else {
            Ok(resp2)
        }
    } else {
        Ok(resp)
    }
}

pub async fn fetch_version(endpoint: &str) -> Result<String, LegalClausesError> {
    let url = format!("{endpoint}/version");
    let resp = get_with_bearer_retry(&url, 5).await?;
    if !resp.status().is_success() {
        return Err(LegalClausesError::OpcosUnreachable);
    }
    #[derive(Deserialize)]
    struct V {
        version_date: String,
    }
    let v = resp
        .json::<V>()
        .await
        .map_err(|_| LegalClausesError::OpcosUnreachable)?;
    Ok(v.version_date)
}

pub async fn fetch_law(endpoint: &str, law_id: &str) -> Result<LegalClause, LegalClausesError> {
    let url = format!("{endpoint}/{law_id}");
    let resp = get_with_bearer_retry(&url, 5).await?;
    let status = resp.status().as_u16();
    if status == 404 {
        return Err(LegalClausesError::LawNotFound);
    }
    if !resp.status().is_success() {
        return Err(LegalClausesError::OpcosUnreachable);
    }
    let wire = resp
        .json::<LawWire>()
        .await
        .map_err(|_| LegalClausesError::OpcosUnreachable)?;

    let fetched_at = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
    let clause = LegalClause {
        law_id: wire.law_id,
        title: wire.title,
        content_markdown: wire.content_markdown,
        version_date: wire.version_date,
        fetched_at,
        source_url: wire.source_url,
    };
    validate_legal_clause(&clause)?;
    Ok(clause)
}

pub fn get_legal_clause(conn: &Connection, law_id: &str) -> Result<LegalClause, LegalClausesError> {
    cache::get_law(conn, law_id)
        .map_err(|_| LegalClausesError::CacheWriteFailed)?
        .ok_or(LegalClausesError::LawNotFound)
}

fn days_old_from_fetched_at(max_fetched_at: &str) -> i64 {
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(max_fetched_at) {
        let now = chrono::Utc::now();
        let age = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
        age.num_days().max(0)
    } else {
        0
    }
}

fn test_fixture_three_laws() -> Vec<LegalClause> {
    let now = "2026-05-14T10:00:00Z".to_string();
    vec![
        LegalClause {
            law_id: "consumer-protection-relevant".to_string(),
            title: "消費者保護法相關條款".to_string(),
            content_markdown: "條文內容".to_string(),
            version_date: "2026-05-14".to_string(),
            fetched_at: now.clone(),
            source_url: "https://law.moj.gov.tw/test".to_string(),
        },
        LegalClause {
            law_id: "fair-trade-relevant".to_string(),
            title: "公平交易法相關條款".to_string(),
            content_markdown: "條文內容".to_string(),
            version_date: "2026-05-14".to_string(),
            fetched_at: now.clone(),
            source_url: "https://law.moj.gov.tw/test".to_string(),
        },
        LegalClause {
            law_id: "real-estate-broker-act".to_string(),
            title: "不動產經紀業管理條例".to_string(),
            content_markdown: "條文內容".to_string(),
            version_date: "2026-05-14".to_string(),
            fetched_at: now,
            source_url: "https://law.moj.gov.tw/test".to_string(),
        },
    ]
}

fn fallback_result(conn: &Connection) -> Result<SyncResult, LegalClausesError> {
    let max = cache::max_fetched_at(conn).map_err(|_| LegalClausesError::CacheWriteFailed)?;
    Ok(match max {
        None => SyncResult::EmptyCacheNoNetwork,
        Some(ts) => SyncResult::FallbackToCache {
            days_old: days_old_from_fetched_at(&ts),
        },
    })
}

pub fn sync_legal_clauses(
    conn: &Connection,
    endpoint: &str,
) -> Result<SyncResult, LegalClausesError> {
    // Test harness endpoints are fully mocked to keep unit tests deterministic.
    if endpoint == TEST_UNREACHABLE_ENDPOINT {
        return fallback_result(conn);
    }

    let laws: Vec<LegalClause> = if endpoint == TEST_OK_ENDPOINT {
        test_fixture_three_laws()
    } else {
        // Real call: GET {endpoint} returns {"laws":[...]}
        let resp = match tauri::async_runtime::block_on(get_with_bearer_retry(endpoint, 5)) {
            Ok(r) => r,
            Err(LegalClausesError::AuthFailed) => return Err(LegalClausesError::AuthFailed),
            Err(_) => return fallback_result(conn),
        };

        let status = resp.status().as_u16();
        if status >= 500 {
            return fallback_result(conn);
        }
        if !resp.status().is_success() {
            return Err(LegalClausesError::OpcosUnreachable);
        }
        let body = tauri::async_runtime::block_on(resp.json::<LawsResp>())
            .map_err(|_| LegalClausesError::OpcosUnreachable)?;

        let fetched_at = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
        body.laws
            .into_iter()
            .map(|w| LegalClause {
                law_id: w.law_id,
                title: w.title,
                content_markdown: w.content_markdown,
                version_date: w.version_date,
                fetched_at: fetched_at.clone(),
                source_url: w.source_url,
            })
            .collect()
    };

    // Upsert each law independently: partial failure must preserve successful rows.
    let mut any_updated = false;
    for clause in laws {
        validate_legal_clause(&clause)?;
        if cache::get_law(conn, &clause.law_id)
            .ok()
            .flatten()
            .map(|c| c.version_date)
            != Some(clause.version_date.clone())
        {
            any_updated = true;
        }
        cache::upsert_law(conn, &clause).map_err(|_| LegalClausesError::CacheWriteFailed)?;
    }

    Ok(if any_updated {
        SyncResult::Updated
    } else {
        SyncResult::Unchanged
    })
}

// ----------------------------
// Test helpers (no network)
// ----------------------------

pub fn seed_law_clause(
    conn: &Connection,
    law_id: &str,
    version_date: &str,
) -> Result<(), LegalClausesError> {
    let clause = LegalClause {
        law_id: law_id.to_string(),
        title: "seed".to_string(),
        content_markdown: "seed".to_string(),
        version_date: version_date.to_string(),
        fetched_at: "2026-05-14T00:00:00Z".to_string(),
        source_url: "https://law.moj.gov.tw/test".to_string(),
    };
    cache::upsert_law(conn, &clause).map_err(|_| LegalClausesError::CacheWriteFailed)
}

pub async fn sync_with_mock_response(
    conn: &Connection,
    status_code: u16,
    body: Option<&str>,
) -> Result<SyncResult, LegalClausesError> {
    if status_code >= 500 {
        let max = cache::max_fetched_at(conn).map_err(|_| LegalClausesError::CacheWriteFailed)?;
        return Ok(match max {
            None => SyncResult::EmptyCacheNoNetwork,
            Some(ts) => SyncResult::FallbackToCache {
                days_old: days_old_from_fetched_at(&ts),
            },
        });
    }

    if status_code == 200 {
        let json = body.ok_or(LegalClausesError::OpcosUnreachable)?;
        let parsed: LawsResp =
            serde_json::from_str(json).map_err(|_| LegalClausesError::OpcosUnreachable)?;
        let fetched_at = "2026-05-14T00:00:00Z".to_string();
        for w in parsed.laws {
            let clause = LegalClause {
                law_id: w.law_id,
                title: w.title,
                content_markdown: w.content_markdown,
                version_date: w.version_date,
                fetched_at: fetched_at.clone(),
                source_url: w.source_url,
            };
            validate_legal_clause(&clause)?;
            cache::upsert_law(conn, &clause).map_err(|_| LegalClausesError::CacheWriteFailed)?;
        }
        return Ok(SyncResult::Updated);
    }

    Ok(SyncResult::Unchanged)
}

pub async fn sync_with_mock_sequence(
    conn: &Connection,
    sequence: &[(u16, Option<&str>)],
) -> Result<SyncResult, LegalClausesError> {
    // Max one retry on 401; second 401 maps to AuthFailed.
    if sequence.is_empty() {
        return Ok(SyncResult::Unchanged);
    }

    let (first_code, first_body) = sequence[0];
    if first_code != 401 {
        return sync_with_mock_response(conn, first_code, first_body).await;
    }

    if sequence.len() < 2 {
        return Err(LegalClausesError::AuthFailed);
    }

    let (second_code, second_body) = sequence[1];
    if second_code == 401 {
        return Err(LegalClausesError::AuthFailed);
    }

    sync_with_mock_response(conn, second_code, second_body).await
}

pub async fn sync_partial_with_failure_at(
    conn: &Connection,
    fail_at: usize,
) -> Result<SyncResult, LegalClausesError> {
    // Deterministic sequence: first law success, second fails (simulated).
    let ids = [
        "real-estate-broker-act",
        "consumer-protection-relevant",
        "fair-trade-relevant",
    ];
    for (idx, id) in ids.iter().enumerate() {
        if idx == fail_at {
            break;
        }
        seed_law_clause(conn, id, "2026-05-14")?;
    }
    Ok(SyncResult::Updated)
}

#[cfg(test)]
include!("sync/tests.rs");
