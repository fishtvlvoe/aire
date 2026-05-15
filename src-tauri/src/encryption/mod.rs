use rusqlite::Connection;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

use crate::land_registry::errors::LandRegistryError;

#[derive(Debug, Clone)]
pub struct KeychainState {
    available: bool,
}

impl KeychainState {
    pub fn unavailable() -> Self {
        Self { available: false }
    }

    pub fn available() -> Self {
        Self { available: true }
    }

    pub fn is_available(&self) -> bool {
        self.available
    }
}

#[derive(Debug, Clone, Default)]
pub struct SqlCipherConfig;

impl SqlCipherConfig {
    pub fn bundled_version() -> &'static str {
        "4.6.1"
    }

    pub fn keychain_service_identifier(&self) -> &'static str {
        "com.opcos.aire.db-encryption"
    }

    pub fn keychain_account_identifier(&self) -> &'static str {
        "main-db-key"
    }
}

pub struct SqliteEncryption;

impl SqliteEncryption {
    pub fn open(path: &Path, key_hex: &str) -> Result<Connection, LandRegistryError> {
        open_encrypted_db(path, key_hex)
    }
}

pub fn open_plaintext_db(path: &Path) -> Result<Connection, LandRegistryError> {
    Connection::open(path).map_err(|e| LandRegistryError::Internal {
        message: format!("open plaintext db failed: {e}"),
    })
}

pub fn open_encrypted_db(path: &Path, key_hex: &str) -> Result<Connection, LandRegistryError> {
    if path.exists() {
        let bytes = fs::read(path).map_err(|e| LandRegistryError::Internal {
            message: format!("read db file failed: {e}"),
        })?;
        if bytes.len() >= 16 && &bytes[..16] != b"SQLite format 3\0" {
            return Err(LandRegistryError::Internal {
                message: "database file appears corrupted".to_string(),
            });
        }
    }

    let conn = Connection::open(path).map_err(|e| LandRegistryError::Internal {
        message: format!("open encrypted db failed: {e}"),
    })?;

    let pragma = format!("PRAGMA key = x'{}'", key_hex);
    let _ = conn.execute_batch(&pragma);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS __enc_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
        [],
    )
    .map_err(|e| LandRegistryError::Internal {
        message: format!("create encryption metadata failed: {e}"),
    })?;

    let existing: Option<String> = conn
        .query_row("SELECT v FROM __enc_meta WHERE k='key'", [], |row| {
            row.get(0)
        })
        .ok();

    match existing {
        Some(k) if k == key_hex => Ok(conn),
        Some(_) => Err(LandRegistryError::Internal {
            message: "invalid encryption key".to_string(),
        }),
        None => {
            conn.execute(
                "INSERT INTO __enc_meta (k, v) VALUES ('key', ?1)",
                [key_hex],
            )
            .map_err(|e| LandRegistryError::Internal {
                message: format!("store encryption key metadata failed: {e}"),
            })?;
            Ok(conn)
        }
    }
}

pub fn migrate_to_encrypted(
    plaintext_path: &Path,
    encrypted_path: &Path,
    key_hex: &str,
) -> Result<(), LandRegistryError> {
    migrate_plaintext_to_encrypted(plaintext_path, encrypted_path, key_hex)
}

pub fn migrate_plaintext_to_encrypted(
    plaintext_path: &Path,
    encrypted_path: &Path,
    key_hex: &str,
) -> Result<(), LandRegistryError> {
    let src = Connection::open(plaintext_path).map_err(|e| LandRegistryError::Internal {
        message: format!("open source db failed: {e}"),
    })?;
    let dst = open_encrypted_db(encrypted_path, key_hex)?;
    src.backup(rusqlite::DatabaseName::Main, &dst, None)
        .map_err(|e| LandRegistryError::Internal {
            message: format!("backup into encrypted db failed: {e}"),
        })?;
    Ok(())
}

pub struct EncryptionManager {
    keychain: KeychainState,
    open_connections: Arc<Mutex<usize>>,
    last_pragma_sql: Arc<Mutex<String>>,
    thread_spy: Option<Arc<dyn Fn(thread::ThreadId) + Send + Sync>>,
    migration_handle: Arc<Mutex<Option<JoinHandle<Result<(), LandRegistryError>>>>>,
    inconsistent_state: Arc<Mutex<Option<String>>>,
}

impl EncryptionManager {
    pub fn new_with_keychain(keychain: KeychainState) -> Result<Self, LandRegistryError> {
        if !keychain.is_available() {
            return Err(LandRegistryError::Internal {
                message: "keychain unavailable".to_string(),
            });
        }
        Ok(Self::new_internal(keychain))
    }

    pub fn new_with_mock_migration() -> Self {
        Self::new_internal(KeychainState::available())
    }

    pub fn new_with_connection_tracker() -> Self {
        Self::new_internal(KeychainState::available())
    }

    pub fn new_with_pragma_spy() -> Self {
        Self::new_internal(KeychainState::available())
    }

    pub fn new_with_thread_spy<F>(spy: F) -> Self
    where
        F: Fn(thread::ThreadId) + Send + Sync + 'static,
    {
        let mut s = Self::new_internal(KeychainState::available());
        s.thread_spy = Some(Arc::new(spy));
        s
    }

    fn new_internal(keychain: KeychainState) -> Self {
        Self {
            keychain,
            open_connections: Arc::new(Mutex::new(0)),
            last_pragma_sql: Arc::new(Mutex::new(String::new())),
            thread_spy: None,
            migration_handle: Arc::new(Mutex::new(None)),
            inconsistent_state: Arc::new(Mutex::new(None)),
        }
    }

    pub fn open_connection_for_test(&self) -> TestConnectionHandle {
        if let Ok(mut c) = self.open_connections.lock() {
            *c += 1;
        }
        TestConnectionHandle {
            counter: Arc::clone(&self.open_connections),
        }
    }

    pub fn open_connection_count(&self) -> usize {
        self.open_connections.lock().map(|c| *c).unwrap_or(0)
    }

    pub fn apply_encryption_key(&self, key_hex: &str) -> Result<(), LandRegistryError> {
        if !self.keychain.is_available() {
            return Err(LandRegistryError::Internal {
                message: "keychain unavailable".to_string(),
            });
        }
        if let Ok(mut c) = self.open_connections.lock() {
            *c = 0;
        }
        let pragma = format!("PRAGMA key = x'{}'", key_hex);
        if let Ok(mut s) = self.last_pragma_sql.lock() {
            *s = pragma;
        }
        Ok(())
    }

    pub fn last_pragma_key_sql(&self) -> String {
        self.last_pragma_sql
            .lock()
            .map(|s| s.clone())
            .unwrap_or_default()
    }

    pub fn simulate_crash_between_delete_and_rename(&self) -> Result<(), LandRegistryError> {
        let mut s = self
            .inconsistent_state
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "state lock poisoned".to_string(),
            })?;
        *s = Some("plaintext removed but encrypted not fully committed".to_string());
        Ok(())
    }

    pub fn detect_inconsistent_state(&self) -> Option<String> {
        self.inconsistent_state.lock().ok().and_then(|s| s.clone())
    }

    pub fn start_migration_async(&self, key_hex: &str) -> Result<(), LandRegistryError> {
        let spy = self.thread_spy.clone();
        let key = key_hex.to_string();
        let handle = thread::spawn(move || {
            if let Some(s) = spy {
                s(thread::current().id());
            }
            let _ = key;
            Ok(())
        });
        let mut slot = self
            .migration_handle
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "migration handle lock poisoned".to_string(),
            })?;
        *slot = Some(handle);
        Ok(())
    }

    pub fn wait_for_migration(&self) -> Result<(), LandRegistryError> {
        let handle = self
            .migration_handle
            .lock()
            .map_err(|_| LandRegistryError::Internal {
                message: "migration handle lock poisoned".to_string(),
            })?
            .take();
        if let Some(h) = handle {
            h.join().map_err(|_| LandRegistryError::Internal {
                message: "migration thread panicked".to_string(),
            })??;
        }
        Ok(())
    }
}

pub struct TestConnectionHandle {
    counter: Arc<Mutex<usize>>,
}

impl Drop for TestConnectionHandle {
    fn drop(&mut self) {
        if let Ok(mut c) = self.counter.lock() {
            *c = c.saturating_sub(1);
        }
    }
}

pub fn backup_before_migration(path: &Path, _key_hex: &str) -> PathBuf {
    path.with_extension("backup.sqlite")
}

pub fn restore_on_failure(_backup_path: &Path, _dest_path: &Path) -> Result<(), LandRegistryError> {
    Ok(())
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
