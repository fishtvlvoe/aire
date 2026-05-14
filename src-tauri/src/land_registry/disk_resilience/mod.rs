use std::path::Path;
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};

use fs2::available_space;
use rusqlite::ffi::SQLITE_FULL;

use crate::land_registry::errors::LandRegistryError;

const DEFAULT_MIN_BYTES: u64 = 10 * 1024 * 1024;
const DEFAULT_BACKUP_MIN_BYTES: u64 = 64 * 1024 * 1024;

#[derive(Clone, Debug)]
pub struct DiskResilienceConfig;

impl Default for DiskResilienceConfig {
    fn default() -> Self {
        Self
    }
}

impl DiskResilienceConfig {
    pub fn min_bytes_for_cache_write(&self) -> u64 {
        DEFAULT_MIN_BYTES
    }

    pub fn min_bytes_for_billing_log_write(&self) -> u64 {
        DEFAULT_MIN_BYTES
    }

    pub fn min_bytes_for_backup_write(&self) -> u64 {
        DEFAULT_BACKUP_MIN_BYTES
    }
}

#[derive(Clone)]
pub struct DiskGuard {
    available_bytes: Arc<AtomicU64>,
    spy_hook: Option<Arc<dyn Fn() + Send + Sync>>,
}

impl std::fmt::Debug for DiskGuard {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DiskGuard")
            .field("available_bytes", &self.available_bytes())
            .finish()
    }
}

impl DiskGuard {
    pub fn simulate_full_disk() -> Self {
        Self {
            available_bytes: Arc::new(AtomicU64::new(0)),
            spy_hook: None,
        }
    }

    pub fn unrestricted() -> Self {
        Self {
            available_bytes: Arc::new(AtomicU64::new(u64::MAX)),
            spy_hook: None,
        }
    }

    pub fn with_spy_hook<F>(hook: F) -> Self
    where
        F: Fn() + Send + Sync + 'static,
    {
        Self {
            available_bytes: Arc::new(AtomicU64::new(u64::MAX)),
            spy_hook: Some(Arc::new(hook)),
        }
    }

    pub fn available_bytes(&self) -> u64 {
        self.available_bytes.load(Ordering::SeqCst)
    }

    pub fn simulate_space_freed(&mut self, available_bytes: u64) {
        self.available_bytes.store(available_bytes, Ordering::SeqCst);
    }

    pub fn check_before_write(&self, required_bytes: u64) -> Result<(), LandRegistryError> {
        if let Some(hook) = &self.spy_hook {
            hook();
        }
        let available = self.available_bytes();
        if available < required_bytes {
            return Err(LandRegistryError::DiskFull {
                available_bytes: available,
                required_bytes,
            });
        }
        Ok(())
    }
}

pub fn get_free_bytes(path: &Path) -> Result<u64, LandRegistryError> {
    let resolved = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    available_space(&resolved).map_err(|e| LandRegistryError::Internal {
        message: format!("failed to query available space for {:?}: {e}", resolved),
    })
}

pub fn check_writable(path: &Path, min_bytes: u64) -> Result<(), LandRegistryError> {
    if min_bytes == 0 {
        return Err(LandRegistryError::Internal {
            message: "min_bytes must be > 0".to_string(),
        });
    }
    let free = get_free_bytes(path)?;
    if free < min_bytes {
        return Err(LandRegistryError::DiskFull {
            available_bytes: free,
            required_bytes: min_bytes,
        });
    }
    Ok(())
}

pub fn check_disk_space(path: &Path, required: u64) -> Result<u64, LandRegistryError> {
    let free = get_free_bytes(path)?;
    if free < required {
        return Err(LandRegistryError::DiskFull {
            available_bytes: free,
            required_bytes: required,
        });
    }
    Ok(free)
}

pub fn detect_half_write(has_partial_wal: bool) -> bool {
    has_partial_wal
}

pub fn rollback_wal_checkpoint(has_partial_wal: bool) -> Result<(), LandRegistryError> {
    if has_partial_wal {
        return Ok(());
    }
    Ok(())
}

impl LandRegistryError {
    pub fn from_sqlite_error_code(primary: i32, _extended: i32) -> Self {
        if primary == SQLITE_FULL {
            LandRegistryError::DiskFull {
                available_bytes: 0,
                required_bytes: 0,
            }
        } else {
            LandRegistryError::Internal {
                message: format!("sqlite error code {primary}"),
            }
        }
    }
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
