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

// ── 排程器設定（供 lib.rs 引用）──────────────────────────────────────

/// 排程器的時鐘來源
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClockSource {
    WallClock,
    #[allow(dead_code)]
    Monotonic,
}

/// 排程器設定
#[derive(Debug, Clone, Copy)]
pub struct SchedulerConfig {
    pub interval_days: u32,
    pub clock_source: ClockSource,
}

/// 排程器 handle（drop 不中斷排程）
pub struct SchedulerHandle {
    _inner: (),
}

/// 啟動法條同步排程器
/// 使用 Arc<tokio::sync::Mutex<Connection>>，在獨立 std thread 中定期同步
/// 每個 thread 有自己的 tokio::runtime::Runtime，Connection 不跨 await
pub async fn start_sync_scheduler(
    db: std::sync::Arc<tokio::sync::Mutex<rusqlite::Connection>>,
    config: SchedulerConfig,
    endpoint: &str,
) -> SchedulerHandle {
    let interval_secs = (config.interval_days as u64).max(1) * 24 * 60 * 60;
    let endpoint = endpoint.to_string();

    // tokio task 定期觸發，每次觸發時用 block_in_place 做同步工作
    // block_in_place 讓 tokio worker thread 暫時成為 blocking thread，
    // 允許建新 runtime + lock（tokio::sync::Mutex）
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(std::time::Duration::from_secs(interval_secs));
        ticker.tick().await; // 吃掉第一次立即觸發
        loop {
            ticker.tick().await;
            let conn_guard = db.lock().await;
            let ep = endpoint.clone();
            let client = reqwest::Client::new();
            let token = std::env::var("OPCOS_API_TOKEN").unwrap_or_default();
            // block_in_place：在同一 thread 同步跑 async sync（Connection 不跨 await）
            tokio::task::block_in_place(|| {
                let rt = match tokio::runtime::Runtime::new() {
                    Ok(r) => r,
                    Err(_) => return,
                };
                let _ = rt.block_on(sync_legal_clauses(&conn_guard, &client, &ep, &token));
            });
            // conn_guard 在 block_in_place 結束後才 drop，確保不跨 await
        }
    });

    SchedulerHandle { _inner: () }
}

// ── IPC command handlers ──────────────────────────────────────────────

/// 觸發法條同步（async IPC command）
/// block_in_place：在 tokio worker thread 上安全執行同步 blocking 操作
/// 讓 Connection（非 Send）不需要跨 await，在同一 thread 完成所有 DB + 網路工作
#[tauri::command(rename = "sync_legal_clauses")]
pub async fn sync_ipc(
    db: tauri::State<'_, crate::DbState>,
) -> Result<String, String> {
    let db_mutex = &db.0;
    tokio::task::block_in_place(|| {
        let conn = db_mutex.lock().map_err(|e| e.to_string())?;
        let client = reqwest::Client::new();
        let token = std::env::var("OPCOS_API_TOKEN").unwrap_or_default();
        let endpoint = std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT")
            .unwrap_or_else(|_| "https://opcos.aiver.me/v1/legal-clauses".to_string());
        // block_in_place 允許在 blocking thread 建新 runtime
        let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
        rt.block_on(sync_legal_clauses(&conn, &client, &endpoint, &token))
            .map(|r| format!("{:?}", r))
            .map_err(|e| e.to_string())
    })
}

/// 查詢單筆法條（IPC sync command，純 DB 讀取無 async 問題）
#[tauri::command(rename = "get_legal_clause")]
pub fn get_legal_clause_ipc(
    db: tauri::State<'_, crate::DbState>,
    law_id: String,
) -> Result<Option<LegalClause>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    cache::get_law(&conn, &law_id).map_err(|e| e.to_string())
}
