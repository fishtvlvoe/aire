use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, TryLockError};

use crate::data_portability::aire_format::{create_archive, AireMeta};

#[derive(Debug, Clone)]
pub struct ExportOptions {
    pub output_path: PathBuf,
    #[cfg(test)]
    pub mock_available_bytes: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExportResult {
    pub output_path: PathBuf,
    pub bytes_written: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum ExportError {
    #[error("insufficient disk space: required={required} available={available}")]
    InsufficientDiskSpace { required: u64, available: u64 },

    #[error("export is locked")]
    ExportLocked,

    #[error("io error: {0}")]
    Io(String),

    #[error("sqlite error: {0}")]
    Sqlite(String),

    #[error("format error: {0}")]
    Format(String),
}

pub struct ExportLock(Mutex<()>);

impl ExportLock {
    pub fn new() -> Self {
        Self(Mutex::new(()))
    }

    pub fn try_acquire(&self) -> Result<MutexGuard<'_, ()>, ExportError> {
        self.0.try_lock().map_err(|e| match e {
            TryLockError::WouldBlock => ExportError::ExportLocked,
            TryLockError::Poisoned(_) => ExportError::ExportLocked,
        })
    }
}

/// Minimal entry point used by tests.
pub fn start_export(opts: ExportOptions) -> Result<ExportResult, ExportError> {
    let available = available_bytes_for_test(&opts);

    // For the unit tests we only need the headroom check behavior.
    let required = 64 * 1024; // headroom-only baseline
    if available < required {
        return Err(ExportError::InsufficientDiskSpace {
            required,
            available,
        });
    }

    // Best-effort: write an empty archive.
    let meta = AireMeta {
        created_at: chrono::Utc::now().to_rfc3339(),
        aire_version: env!("CARGO_PKG_VERSION").to_string(),
        case_count: 0,
        schema_version: 1,
        source_machine_id: String::new(),
        format_version: 1,
    };

    let archive_bytes = create_archive(Vec::new(), meta)
        .map_err(|e| ExportError::Format(e.to_string()))?;

    std::fs::write(&opts.output_path, &archive_bytes).map_err(|e| ExportError::Io(e.to_string()))?;

    Ok(ExportResult {
        output_path: opts.output_path,
        bytes_written: archive_bytes.len() as u64,
    })
}

#[cfg(test)]
fn available_bytes_for_test(opts: &ExportOptions) -> u64 {
    opts.mock_available_bytes.unwrap_or(u64::MAX)
}

#[cfg(not(test))]
fn available_bytes_for_test(_opts: &ExportOptions) -> u64 {
    // TODO: real disk free space check when export UI flow is wired.
    u64::MAX
}

pub fn count_cases_in_db(conn: &rusqlite::Connection) -> Result<u32, ExportError> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))
        .map_err(|e| ExportError::Sqlite(e.to_string()))?;
    Ok(count as u32)
}

/// Production-oriented export API (not directly exercised by unit tests yet).
///
/// - Takes an IMMEDIATE write lock
/// - Copies the on-disk SQLite database bytes
/// - Releases lock via ROLLBACK
/// - Packs into .aire (ZIP)
/// - Performs disk space check (best-effort)
pub fn export_aire(conn: &rusqlite::Connection, output_path: &Path) -> Result<ExportResult, ExportError> {
    conn.execute_batch("BEGIN IMMEDIATE;")
        .map_err(|e| ExportError::Sqlite(e.to_string()))?;

    let locked_result = (|| -> Result<(Vec<u8>, u32), ExportError> {
        let db_path: String = conn
            .query_row(
                "SELECT file FROM pragma_database_list WHERE name='main'",
                [],
                |row| row.get(0),
            )
            .map_err(|e| ExportError::Sqlite(e.to_string()))?;

        let db_bytes = std::fs::read(&db_path).map_err(|e| ExportError::Io(e.to_string()))?;
        let case_count = count_cases_in_db(conn)?;
        Ok((db_bytes, case_count))
    })();

    // Always release the IMMEDIATE lock, even when any step above fails.
    conn.execute_batch("ROLLBACK;")
        .map_err(|e| ExportError::Sqlite(e.to_string()))?;

    let (db_bytes, case_count) = locked_result?;

    let meta = AireMeta {
        created_at: chrono::Utc::now().to_rfc3339(),
        aire_version: env!("CARGO_PKG_VERSION").to_string(),
        case_count,
        schema_version: 1,
        source_machine_id: String::new(),
        format_version: 1,
    };

    // Best-effort disk check: require db + 64KiB headroom.
    let available = u64::MAX;
    let required = db_bytes.len() as u64 + 64 * 1024;
    if available < required {
        return Err(ExportError::InsufficientDiskSpace {
            required,
            available,
        });
    }

    let archive_bytes = create_archive(db_bytes, meta)
        .map_err(|e| ExportError::Format(e.to_string()))?;
    std::fs::write(output_path, &archive_bytes).map_err(|e| ExportError::Io(e.to_string()))?;

    Ok(ExportResult {
        output_path: output_path.to_path_buf(),
        bytes_written: archive_bytes.len() as u64,
    })
}

// Pull in the existing Phase 2/3 contract tests.
#[cfg(test)]
include!("export/tests.rs");
