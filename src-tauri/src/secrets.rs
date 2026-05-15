// AIRE — OS keychain 憑證儲存封裝
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D4
// capability: secure-credential-storage
//
// 設計重點：
// - service name 寫死為 "aire"
// - get_credential：缺值 → Ok(None)；keychain 鎖定 → Err(CredError { code: "LOCKED" })
// - set_credential：失敗 → Err，由上層判斷是否回傳 CREDENTIAL_STORE_UNAVAILABLE
// - 為了單元測試可注入 mock，把實際 keyring crate 包在 trait KeyringBackend 後面

use std::sync::Mutex;

pub const SERVICE_NAME: &str = "aire";

/// 憑證儲存錯誤。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CredError {
    pub code: String,
    pub message: String,
}

impl CredError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }
}

impl std::fmt::Display for CredError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for CredError {}

/// Keyring backend trait — 真實實作呼叫 OS keychain，測試實作放 in-memory。
pub trait KeyringBackend: Send + Sync {
    fn get(&self, service: &str, name: &str) -> Result<Option<String>, CredError>;
    fn set(&self, service: &str, name: &str, value: &str) -> Result<(), CredError>;
    fn delete(&self, service: &str, name: &str) -> Result<(), CredError>;
}

/// 真實 keyring 實作（OS 原生 keychain）。
pub struct OsKeyring;

impl KeyringBackend for OsKeyring {
    fn get(&self, service: &str, name: &str) -> Result<Option<String>, CredError> {
        let entry = keyring::Entry::new(service, name).map_err(|e| classify(e))?;
        match entry.get_password() {
            Ok(v) => Ok(Some(v)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(classify(e)),
        }
    }

    fn set(&self, service: &str, name: &str, value: &str) -> Result<(), CredError> {
        let entry = keyring::Entry::new(service, name).map_err(|e| classify(e))?;
        entry.set_password(value).map_err(|e| classify(e))
    }

    fn delete(&self, service: &str, name: &str) -> Result<(), CredError> {
        let entry = keyring::Entry::new(service, name).map_err(|e| classify(e))?;
        match entry.delete_password() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(classify(e)),
        }
    }
}

fn classify(e: keyring::Error) -> CredError {
    // keyring crate v2 沒有明確的 "locked" variant，
    // PlatformFailure / NoStorageAccess 視為 LOCKED；其他視為 STORE_ERROR。
    match e {
        keyring::Error::PlatformFailure(inner) => {
            let msg = inner.to_string();
            // macOS Keychain 鎖定錯誤訊息含 "User interaction is not allowed" 或 errSecAuthFailed
            if msg.contains("locked") || msg.contains("not allowed") || msg.contains("-25308") {
                CredError::new("LOCKED", format!("keychain locked: {msg}"))
            } else {
                CredError::new("STORE_ERROR", format!("keyring platform failure: {msg}"))
            }
        }
        keyring::Error::NoStorageAccess(inner) => {
            CredError::new("LOCKED", format!("keychain not accessible: {inner}"))
        }
        other => CredError::new("STORE_ERROR", other.to_string()),
    }
}

/// 取得憑證（service 寫死為 "aire"）。
pub fn get_credential(
    backend: &dyn KeyringBackend,
    name: &str,
) -> Result<Option<String>, CredError> {
    backend.get(SERVICE_NAME, name)
}

/// 寫入憑證。
pub fn set_credential(
    backend: &dyn KeyringBackend,
    name: &str,
    value: &str,
) -> Result<(), CredError> {
    backend.set(SERVICE_NAME, name, value)
}

/// 刪除憑證；不存在視為成功。
pub fn delete_credential(backend: &dyn KeyringBackend, name: &str) -> Result<(), CredError> {
    backend.delete(SERVICE_NAME, name)
}

// ----------------------------------------------------------------------------
// 測試用 mock backend
// ----------------------------------------------------------------------------

/// In-memory 模擬 keychain，附 fail mode 設定。供單元測試使用。
pub struct MockKeyring {
    inner: Mutex<std::collections::HashMap<(String, String), String>>,
    fail_mode: Mutex<FailMode>,
}

#[derive(Clone, Copy, Debug)]
pub enum FailMode {
    None,
    LockedOnGet,
    StoreUnavailableOnSet,
}

impl Default for MockKeyring {
    fn default() -> Self {
        Self::new()
    }
}

impl MockKeyring {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(std::collections::HashMap::new()),
            fail_mode: Mutex::new(FailMode::None),
        }
    }

    pub fn set_fail_mode(&self, mode: FailMode) {
        *self.fail_mode.lock().unwrap() = mode;
    }
}

impl KeyringBackend for MockKeyring {
    fn get(&self, service: &str, name: &str) -> Result<Option<String>, CredError> {
        if matches!(*self.fail_mode.lock().unwrap(), FailMode::LockedOnGet) {
            return Err(CredError::new("LOCKED", "mock keychain locked"));
        }
        Ok(self
            .inner
            .lock()
            .unwrap()
            .get(&(service.to_string(), name.to_string()))
            .cloned())
    }

    fn set(&self, service: &str, name: &str, value: &str) -> Result<(), CredError> {
        if matches!(
            *self.fail_mode.lock().unwrap(),
            FailMode::StoreUnavailableOnSet
        ) {
            return Err(CredError::new("STORE_ERROR", "mock keychain unavailable"));
        }
        self.inner
            .lock()
            .unwrap()
            .insert((service.to_string(), name.to_string()), value.to_string());
        Ok(())
    }

    fn delete(&self, service: &str, name: &str) -> Result<(), CredError> {
        self.inner
            .lock()
            .unwrap()
            .remove(&(service.to_string(), name.to_string()));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_missing_returns_none() {
        let mk = MockKeyring::new();
        assert!(get_credential(&mk, "license_key").unwrap().is_none());
    }

    #[test]
    fn set_then_get_roundtrip() {
        let mk = MockKeyring::new();
        set_credential(&mk, "license_key", "SECRET-123").unwrap();
        let v = get_credential(&mk, "license_key").unwrap().unwrap();
        assert_eq!(v, "SECRET-123");
    }

    #[test]
    fn delete_clears_value() {
        let mk = MockKeyring::new();
        set_credential(&mk, "license_token", "tok").unwrap();
        delete_credential(&mk, "license_token").unwrap();
        assert!(get_credential(&mk, "license_token").unwrap().is_none());
    }

    #[test]
    fn locked_get_returns_locked_error() {
        let mk = MockKeyring::new();
        mk.set_fail_mode(FailMode::LockedOnGet);
        let err = get_credential(&mk, "license_key").unwrap_err();
        assert_eq!(err.code, "LOCKED");
    }

    #[test]
    fn set_failure_surfaces_store_error() {
        let mk = MockKeyring::new();
        mk.set_fail_mode(FailMode::StoreUnavailableOnSet);
        let err = set_credential(&mk, "license_key", "x").unwrap_err();
        assert_eq!(err.code, "STORE_ERROR");
    }
}
