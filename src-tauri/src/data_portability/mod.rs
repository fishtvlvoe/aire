pub mod aire_format;
pub mod conflict;
pub mod export;
pub mod import;

// Re-export API expected by tests (Phase 2/3 contract).
pub use aire_format::{
    create_archive, open_archive, verify_checksum, AireArchive, AireFormatError, AireMeta,
    ARCHIVE_CHECKSUM_FILENAME, ARCHIVE_DB_FILENAME, ARCHIVE_META_FILENAME,
};

pub use export::{count_cases_in_db, start_export, ExportError, ExportLock, ExportOptions, ExportResult};

pub use import::{
    check_schema_version_compatibility, detect_conflicts, start_import, validate_archive_checksum,
    ImportError, ImportOptions, ImportResult, CURRENT_SCHEMA_VERSION,
};

pub use conflict::{
    apply_strategy_to_all, resolve_single_conflict, ApplyToAllState, ConflictItem,
    ConflictResolver, ConflictStrategy,
};
