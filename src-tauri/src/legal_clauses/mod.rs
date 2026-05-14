use serde::{Deserialize, Serialize};

pub mod cache;
pub mod scheduler;
pub mod sync;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LegalClause {
    pub law_id: String,
    pub title: String,
    pub content_markdown: String,
    pub version_date: String,
    pub fetched_at: String,
    pub source_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum LegalClausesError {
    CacheWriteFailed,
    OpcosUnreachable,
    AuthFailed,
    LawNotFound,
    EmptyCacheNoNetwork,
    InvalidData,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SyncResult {
    Updated,
    Unchanged,
    FallbackToCache { days_old: i64 },
    EmptyCacheNoNetwork,
}

pub use scheduler::{
    should_trigger_sync_now, start_sync_scheduler, ClockSource, SchedulerConfig, SchedulerHandle,
};
pub use sync::{
    fetch_law, fetch_version, get_legal_clause, is_remote_version_newer, seed_law_clause,
    sync_legal_clauses, sync_partial_with_failure_at, sync_with_mock_response,
    sync_with_mock_sequence, validate_legal_clause,
};

// IPC wrappers (avoid holding UI code in tests)
use crate::DbState;
use tauri::State;

#[tauri::command(rename = "sync_legal_clauses")]
pub async fn sync_ipc(db: State<'_, DbState>) -> Result<SyncResult, LegalClausesError> {
    let endpoint = std::env::var("OPCOS_LEGAL_CLAUSES_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:19999/v1/legal-clauses".to_string());
    let conn =
        db.0.lock()
            .map_err(|_| LegalClausesError::CacheWriteFailed)?
            .try_clone()
            .map_err(|_| LegalClausesError::CacheWriteFailed)?;

    tauri::async_runtime::spawn_blocking(move || sync_legal_clauses(&conn, &endpoint))
        .await
        .map_err(|_| LegalClausesError::CacheWriteFailed)?
}

#[tauri::command(rename = "get_legal_clause")]
pub fn get_legal_clause_ipc(
    law_id: String,
    db: State<'_, DbState>,
) -> Result<LegalClause, LegalClausesError> {
    let conn =
        db.0.lock()
            .map_err(|_| LegalClausesError::CacheWriteFailed)?;
    get_legal_clause(&*conn, &law_id)
}
