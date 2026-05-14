/// land_registry 主模組（Phase 2 結構佔位符）
/// Phase 3 實作時在各子模組加入實際代碼
pub mod client;
pub mod cache;
pub mod errors;
pub mod batch;
pub mod field_mapping;
pub mod billing_log;
pub mod time_sync;
pub mod disk_resilience;
pub mod migration_rollback;
pub mod opcos_offline_grace;
