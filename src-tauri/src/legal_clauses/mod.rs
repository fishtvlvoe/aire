// legal_clauses/mod.rs — 法條快取模組
//
// 架構：
//   sync.rs   — HTTP fetch（reqwest，async）
//   cache.rs  — SQLite 讀寫（rusqlite，同步）
//   scheduler.rs — 背景排程（std::thread + Arc<Mutex<Connection>>）
//
// 注意：rusqlite::Connection 不實作 Send + Sync。
// async fn 不得持有 &Connection 跨 .await。
// 需要跨 await 時，改在 spawn_blocking 內開新連線。

pub mod cache;
pub mod scheduler;
pub mod sync;

use chrono::{DateTime, Utc};
use reqwest::Client;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

// ── 公開型別 ─────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LegalClause {
    pub law_id: String,
    pub title: String,
    pub content_markdown: String,
    pub version_date: String,
    pub fetched_at: String,
    pub source_url: String,
}

#[derive(Debug)]
pub enum LegalClausesError {
    CacheWriteFailed(String),
    OpcosUnreachable,
    LawNotFound(String),
    EmptyCacheNoNetwork,
}

impl std::fmt::Display for LegalClausesError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::CacheWriteFailed(msg) => write!(f, "cache write failed: {msg}"),
            Self::OpcosUnreachable => write!(f, "opcos unreachable"),
            Self::LawNotFound(law_id) => write!(f, "law not found: {law_id}"),
            Self::EmptyCacheNoNetwork => write!(f, "empty cache and no network"),
        }
    }
}

impl std::error::Error for LegalClausesError {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum SyncResult {
    Success { updated: Vec<String> },
    FallbackToCache { stale_days: u32 },
    EmptyCacheNoNetwork,
}

// ── 核心 async sync 函式 ──────────────────────────────────────────────
//
// 警告：這個函式持有 &Connection 跨多個 .await。
// 只能在以下情境呼叫：
//   1. tokio::task::spawn_blocking 內的同步 context（用 block_on）
//   2. 不需要 Send 的 local task（tokio::task::LocalSet）
//   3. scheduler::spawn_scheduler（用 std::thread，有自己的 tokio runtime）
// 不可直接從 tauri::command async fn 呼叫（會違反 Send bound）。

const LAW_IDS: [&str; 3] = ["civil_code", "land_act", "consumer_protection_act"];

pub async fn sync_legal_clauses(
    conn: &Connection,
    client: &Client,
    base_url: &str,
    token: &str,
) -> Result<SyncResult, LegalClausesError> {
    let remote_version = match sync::fetch_version(client, base_url, token).await {
        Ok(v) => v,
        Err(LegalClausesError::OpcosUnreachable) => return fallback_result(conn),
        Err(err) => return Err(err),
    };

    let local_version = cache::max_fetched_at(conn).map_err(LegalClausesError::CacheWriteFailed)?;
    if local_version.as_deref() == Some(remote_version.as_str()) {
        return Ok(SyncResult::Success { updated: Vec::new() });
    }

    let mut updated = Vec::new();
    let (c1, c2, c3) = tokio::join!(
        sync::fetch_law(client, base_url, token, LAW_IDS[0]),
        sync::fetch_law(client, base_url, token, LAW_IDS[1]),
        sync::fetch_law(client, base_url, token, LAW_IDS[2]),
    );
    for result in [c1, c2, c3] {
        match result {
            Ok(clause) => {
                updated.push(clause.law_id.clone());
                cache::upsert_law(conn, &clause).map_err(LegalClausesError::CacheWriteFailed)?;
            }
            Err(LegalClausesError::OpcosUnreachable) => return fallback_result(conn),
            Err(err) => return Err(err),
        }
    }

    Ok(SyncResult::Success { updated })
}

fn fallback_result(conn: &Connection) -> Result<SyncResult, LegalClausesError> {
    let laws = cache::list_laws(conn).map_err(LegalClausesError::CacheWriteFailed)?;
    if laws.is_empty() {
        return Ok(SyncResult::EmptyCacheNoNetwork);
    }

    let max = cache::max_fetched_at(conn).map_err(LegalClausesError::CacheWriteFailed)?;
    let stale_days = max
        .as_deref()
        .and_then(|ts| DateTime::parse_from_rfc3339(ts).ok())
        .map(|dt| (Utc::now() - dt.with_timezone(&Utc)).num_days().max(0) as u32)
        .unwrap_or(0);
    Ok(SyncResult::FallbackToCache { stale_days })
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("open in memory");
        conn.execute_batch(
            r#"
            CREATE TABLE legal_clauses (
              law_id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              content_markdown TEXT NOT NULL,
              version_date TEXT NOT NULL,
              fetched_at TEXT NOT NULL,
              source_url TEXT NOT NULL
            );
        "#,
        )
        .expect("create table");
        conn
    }

    #[test]
    fn fallback_without_cache_returns_empty() {
        let conn = setup_conn();
        let result = fallback_result(&conn).expect("fallback result");
        assert_eq!(result, SyncResult::EmptyCacheNoNetwork);
    }
}
