// AIRE — Settings key-value repository
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D2 / D4
// capability: local-database / Settings key-value store
// capability: secure-credential-storage / No plaintext credentials in SQLite
//
// 白名單檢查（Task 3.3）：拒絕對 license_key / license_token / land_registry_api_key 寫入，
// 這些值必須走 secrets.rs 的 OS keychain。

use rusqlite::{params, Connection};

use super::DbError;

/// 禁止透過 SQLite 儲存的敏感 key。必須改走 OS keychain。
pub const RESERVED_KEYS: &[&str] = &["license_key", "license_token", "land_registry_api_key"];

/// Settings 專用錯誤（擴充 DbError 的「保留字」案例）。
#[derive(Debug, Clone)]
pub enum SettingsError {
    /// 嘗試寫入保留字 key（敏感資料必須走 keychain）
    ReservedKey(String),
    /// 底層 DB 錯誤
    Db(DbError),
}

impl SettingsError {
    pub fn code(&self) -> &'static str {
        match self {
            SettingsError::ReservedKey(_) => "reserved_key",
            SettingsError::Db(_) => "sqlite",
        }
    }
}

impl std::fmt::Display for SettingsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SettingsError::ReservedKey(k) => {
                write!(f, "[reserved_key] '{k}' must be stored in OS keychain, not SQLite")
            }
            SettingsError::Db(e) => write!(f, "{e}"),
        }
    }
}

impl std::error::Error for SettingsError {}

impl From<DbError> for SettingsError {
    fn from(e: DbError) -> Self {
        SettingsError::Db(e)
    }
}

impl From<rusqlite::Error> for SettingsError {
    fn from(e: rusqlite::Error) -> Self {
        SettingsError::Db(DbError::from(e))
    }
}

/// 取得 setting；不存在回 `Ok(None)`。
pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, DbError> {
    let r = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get::<_, String>(0),
    );
    match r {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DbError::from(e)),
    }
}

/// 寫入 setting，自動更新 `updated_at`。
///
/// 白名單檢查：若 key ∈ RESERVED_KEYS，直接 `Err(SettingsError::ReservedKey)`，
/// 不寫入 DB（避免敏感資料留在 aire.db）。
pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), SettingsError> {
    if RESERVED_KEYS.iter().any(|k| *k == key) {
        return Err(SettingsError::ReservedKey(key.to_string()));
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
        params![key, value, now],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::open_in_memory;

    #[test]
    fn get_missing_returns_none() {
        let conn = open_in_memory();
        assert!(get_setting(&conn, "no-key").unwrap().is_none());
    }

    #[test]
    fn set_then_get() {
        let conn = open_in_memory();
        set_setting(&conn, "company_name", "核流有限公司").unwrap();
        let v = get_setting(&conn, "company_name").unwrap().unwrap();
        assert_eq!(v, "核流有限公司");
    }

    #[test]
    fn set_overwrites_and_updates_timestamp() {
        let conn = open_in_memory();
        set_setting(&conn, "k", "v1").unwrap();
        let t1: i64 = conn
            .query_row("SELECT updated_at FROM settings WHERE key='k'", [], |r| r.get(0))
            .unwrap();
        std::thread::sleep(std::time::Duration::from_millis(1100));
        set_setting(&conn, "k", "v2").unwrap();
        let t2: i64 = conn
            .query_row("SELECT updated_at FROM settings WHERE key='k'", [], |r| r.get(0))
            .unwrap();
        assert!(t2 >= t1);
        let v = get_setting(&conn, "k").unwrap().unwrap();
        assert_eq!(v, "v2");
    }

    #[test]
    fn reserved_key_license_key_is_rejected() {
        let conn = open_in_memory();
        let err = set_setting(&conn, "license_key", "SECRET").unwrap_err();
        assert_eq!(err.code(), "reserved_key");
        // 確認 DB 真的沒寫入
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM settings WHERE key='license_key'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn reserved_key_license_token_is_rejected() {
        let conn = open_in_memory();
        let err = set_setting(&conn, "license_token", "JWT").unwrap_err();
        assert!(matches!(err, SettingsError::ReservedKey(_)));
    }

    #[test]
    fn reserved_key_land_registry_api_key_is_rejected() {
        let conn = open_in_memory();
        let err = set_setting(&conn, "land_registry_api_key", "API").unwrap_err();
        assert!(matches!(err, SettingsError::ReservedKey(_)));
    }
}
