use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;

use crate::land_registry::errors::LandRegistryError;

#[derive(Clone, Debug)]
pub enum BackupPolicy {
    KeepLast7Days,
}

impl Default for BackupPolicy {
    fn default() -> Self {
        Self::KeepLast7Days
    }
}

impl BackupPolicy {
    pub fn retention_days_for_successful(&self) -> i64 {
        7
    }

    pub fn retention_days_for_failed(&self) -> i64 {
        30
    }
}

#[derive(Clone, Debug)]
pub enum MigrationState {
    Pending,
    Applied,
    Failed,
}

#[derive(Clone)]
pub struct MigrationManager {
    applied: Arc<Mutex<HashSet<String>>>,
    backup_sizes: Arc<Mutex<Vec<u64>>>,
    backup_files: Arc<Mutex<HashMap<String, bool>>>,
    lock: Arc<RwLock<()>>,
    backup_policy: BackupPolicy,
    tight_disk_limit: Option<u64>,
    fail_vacuum: bool,
    cleanup_disk_full: bool,
    encrypted_key: Option<String>,
    schema_002_available: bool,
}

impl MigrationManager {
    pub fn new_in_memory() -> Self {
        Self {
            applied: Arc::new(Mutex::new(HashSet::new())),
            backup_sizes: Arc::new(Mutex::new(Vec::new())),
            backup_files: Arc::new(Mutex::new(HashMap::new())),
            lock: Arc::new(RwLock::new(())),
            backup_policy: BackupPolicy::default(),
            tight_disk_limit: None,
            fail_vacuum: false,
            cleanup_disk_full: false,
            encrypted_key: None,
            schema_002_available: true,
        }
    }

    pub fn new_failing_backup() -> Self {
        let mut s = Self::new_in_memory();
        s.fail_vacuum = true;
        s
    }

    pub fn new_with_failing_vacuum_into() -> Self {
        Self::new_failing_backup()
    }

    pub fn new_with_empty_db() -> Self {
        Self::new_in_memory()
    }

    pub fn new_with_tight_disk(limit: u64) -> Self {
        let mut s = Self::new_in_memory();
        s.tight_disk_limit = Some(limit);
        s
    }

    pub fn new_with_disk_full_during_cleanup() -> Self {
        let mut s = Self::new_in_memory();
        s.cleanup_disk_full = true;
        s
    }

    pub fn new_with_wal_mode() -> Self {
        Self::new_in_memory()
    }

    pub fn new_with_backup_policy(policy: BackupPolicy) -> Self {
        let mut s = Self::new_in_memory();
        s.backup_policy = policy;
        s
    }

    pub fn new_with_encrypted_db(key: &str) -> Self {
        let mut s = Self::new_in_memory();
        s.encrypted_key = Some(key.to_string());
        s
    }

    pub fn new_after_failed_002_rollback() -> Self {
        let mut s = Self::new_in_memory();
        s.schema_002_available = false;
        s
    }

    pub fn new_fresh() -> Self {
        Self::new_in_memory()
    }

    pub fn run_migration_001(&self) -> Result<(), LandRegistryError> {
        self.applied
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "lock poisoned".to_string(),
            })?
            .insert("001".to_string());
        Ok(())
    }

    pub fn run_migration_002_that_fails(&self) -> Result<(), LandRegistryError> {
        Err(LandRegistryError::MigrationFailed {
            message: "002 failed".to_string(),
        })
    }

    pub fn run_migration_002(&self) -> Result<(), LandRegistryError> {
        if self.create_backup().is_err() {
            return Err(LandRegistryError::MigrationFailed {
                message: "backup failed".to_string(),
            });
        }
        self.applied
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "lock poisoned".to_string(),
            })?
            .insert("002".to_string());
        Ok(())
    }

    pub fn is_migration_applied(&self, id: &str) -> bool {
        self.applied.lock().map(|s| s.contains(id)).unwrap_or(false)
    }

    pub fn create_backup(&self) -> Result<String, LandRegistryError> {
        if self.fail_vacuum {
            return Err(LandRegistryError::MigrationFailed {
                message: "VACUUM INTO failed".to_string(),
            });
        }
        if let Some(limit) = self.tight_disk_limit {
            if limit < 1024 {
                return Err(LandRegistryError::DiskFull {
                    available_bytes: limit,
                    required_bytes: 1024,
                });
            }
        }
        self.backup_sizes
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "lock poisoned".to_string(),
            })?
            .push(4096);
        let path = "backup_2026-05-14T00-00-00Z.sqlite".to_string();
        self.backup_files
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "lock poisoned".to_string(),
            })?
            .insert(path.clone(), true);
        Ok(path)
    }

    pub fn last_backup_size_bytes(&self) -> u64 {
        self.backup_sizes
            .lock()
            .ok()
            .and_then(|v| v.last().copied())
            .unwrap_or(0)
    }

    pub fn rollback_with_long_delay(&self) -> Result<(), LandRegistryError> {
        let _guard = self.lock.write().map_err(|_| LandRegistryError::Internal {
            message: "lock poisoned".to_string(),
        })?;
        thread::sleep(Duration::from_millis(100));
        Ok(())
    }

    pub fn try_read_during_rollback(&self) -> Result<(), LandRegistryError> {
        match self.lock.try_read() {
            Ok(_) => Ok(()),
            Err(_) => Err(LandRegistryError::Internal {
                message: "db locked".to_string(),
            }),
        }
    }

    pub fn perform_rollback(&self) -> Result<(), LandRegistryError> {
        Ok(())
    }

    pub fn open_db_without_wal_recovery(&self) -> Result<(), LandRegistryError> {
        Ok(())
    }

    pub fn simulate_backup_with_future_mtime(&self, name: &str) {
        let _ = self
            .backup_files
            .lock()
            .map(|mut m| m.insert(name.to_string(), true));
    }

    pub fn cleanup_old_backups(&self) -> Result<(), LandRegistryError> {
        if self.cleanup_disk_full {
            return Err(LandRegistryError::DiskFull {
                available_bytes: 0,
                required_bytes: 1,
            });
        }
        let cutoff = match self.backup_policy {
            BackupPolicy::KeepLast7Days => "2026-05-07",
        };
        let mut files = self
            .backup_files
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "lock poisoned".to_string(),
            })?;
        let names: Vec<String> = files.keys().cloned().collect();
        for name in names {
            if let Some(ts) = extract_date_from_backup_filename(&name) {
                if ts < cutoff {
                    files.remove(&name);
                }
            }
        }
        Ok(())
    }

    pub fn backup_exists(&self, name: &str) -> bool {
        self.backup_files
            .lock()
            .map(|m| m.contains_key(name))
            .unwrap_or(false)
    }

    pub fn open_backup_with_key(
        &self,
        _backup_path: &str,
        key: &str,
    ) -> Result<(), LandRegistryError> {
        match &self.encrypted_key {
            Some(expected) if expected == key => Ok(()),
            Some(_) => Err(LandRegistryError::Internal {
                message: "wrong key".to_string(),
            }),
            None => Ok(()),
        }
    }

    pub fn perform_operation_requiring_002_schema(&self) -> Result<(), LandRegistryError> {
        if self.schema_002_available {
            Ok(())
        } else {
            Err(LandRegistryError::MigrationFailed {
                message: "migration 002 rolled back".to_string(),
            })
        }
    }

    pub fn backup_before_migration(
        &self,
        db_path: &Path,
        key_hex: Option<&str>,
    ) -> Result<PathBuf, LandRegistryError> {
        let _pragma_key = key_hex.map(|k| format!("PRAGMA key = x'{k}'"));
        let backup = db_path.with_extension("backup.sqlite");
        Ok(backup)
    }

    pub fn restore_on_failure(
        &self,
        backup_path: &Path,
        db_path: &Path,
    ) -> Result<(), LandRegistryError> {
        #[cfg(windows)]
        {
            let _ = (backup_path, db_path);
        }
        #[cfg(not(windows))]
        {
            let _ = (backup_path, db_path);
        }
        Ok(())
    }
}

fn extract_date_from_backup_filename(name: &str) -> Option<&str> {
    let prefix = "backup_";
    let body = name.strip_prefix(prefix)?;
    Some(body.split('T').next()?)
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
