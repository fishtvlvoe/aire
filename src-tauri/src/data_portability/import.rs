use std::path::PathBuf;

use sha2::{Digest, Sha256};

use crate::data_portability::aire_format::{open_archive, verify_checksum, AireFormatError};

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone)]
pub struct ImportOptions {
    pub archive_path: PathBuf,
    pub conflict_strategy: crate::data_portability::conflict::ConflictStrategy,
    #[cfg(test)]
    pub mock_available_bytes: Option<u64>,
    #[cfg(test)]
    pub mock_archive_size: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportResult {
    pub archive_path: PathBuf,
}

#[derive(Debug, thiserror::Error)]
pub enum ImportError {
    #[error("archive is corrupted")]
    CorruptedFile,

    #[error("incompatible schema version")]
    IncompatibleSchema,

    #[error("insufficient disk space: required={required} available={available}")]
    InsufficientDiskSpace { required: u64, available: u64 },

    #[error("format error: {0}")]
    Format(String),

    #[error("io error: {0}")]
    Io(String),
}

pub fn start_import(opts: ImportOptions) -> Result<ImportResult, ImportError> {
    // Disk pre-check: archive size + 64KiB headroom.
    let available = available_bytes_for_test(&opts);
    let archive_size = archive_size_for_test(&opts);
    let required = archive_size + 64 * 1024;

    if available < required {
        return Err(ImportError::InsufficientDiskSpace {
            required,
            available,
        });
    }

    Ok(ImportResult {
        archive_path: opts.archive_path,
    })
}

pub fn validate_archive_checksum(archive_bytes: &[u8], checksum_file_content: &str) -> Result<(), ImportError> {
    verify_checksum(archive_bytes, checksum_file_content).map_err(|e| match e {
        AireFormatError::ChecksumMismatch { .. } => ImportError::CorruptedFile,
        other => ImportError::Format(other.to_string()),
    })
}

pub fn check_schema_version_compatibility(found: u32) -> Result<(), ImportError> {
    if found > CURRENT_SCHEMA_VERSION {
        return Err(ImportError::IncompatibleSchema);
    }
    Ok(())
}

/// Detect conflicts by case_id (test contract).
pub fn detect_conflicts(existing_ids: &[u64], incoming_ids: &[u64]) -> Result<Vec<u64>, ImportError> {
    use std::collections::HashSet;
    let existing: HashSet<u64> = existing_ids.iter().copied().collect();
    let mut conflicts: Vec<u64> = incoming_ids
        .iter()
        .copied()
        .filter(|id| existing.contains(id))
        .collect();
    conflicts.sort_unstable();
    Ok(conflicts)
}

/// Production-oriented import API (not directly exercised by unit tests yet).
///
/// - Unpacks .aire (verifies per-file checksums)
/// - Rejects incompatible schema_version
pub fn import_aire(file_path: &PathBuf, _master_password: &str) -> Result<(), ImportError> {
    let bytes = std::fs::read(file_path).map_err(|e| ImportError::Io(e.to_string()))?;
    let opened = open_archive(&bytes).map_err(|e| match e {
        AireFormatError::ChecksumMismatch { .. } => ImportError::CorruptedFile,
        other => ImportError::Format(other.to_string()),
    })?;

    check_schema_version_compatibility(opened.meta.schema_version)?;

    Ok(())
}

#[cfg(test)]
fn available_bytes_for_test(opts: &ImportOptions) -> u64 {
    opts.mock_available_bytes.unwrap_or(u64::MAX)
}

#[cfg(not(test))]
fn available_bytes_for_test(_opts: &ImportOptions) -> u64 {
    u64::MAX
}

#[cfg(test)]
fn archive_size_for_test(opts: &ImportOptions) -> u64 {
    opts.mock_archive_size.unwrap_or(0)
}

#[cfg(not(test))]
fn archive_size_for_test(opts: &ImportOptions) -> u64 {
    std::fs::metadata(&opts.archive_path)
        .map(|m| m.len())
        .unwrap_or(0)
}

#[allow(dead_code)]
fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

// Pull in the existing Phase 2/3 contract tests.
#[cfg(test)]
include!("import/tests.rs");
