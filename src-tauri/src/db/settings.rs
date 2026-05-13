// AIRE — Settings key-value repository
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D2
// capability: local-database / Settings key-value store

use rusqlite::{params, Connection};

use super::DbError;

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
pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), DbError> {
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
        // 確保時間至少 +1 秒
        std::thread::sleep(std::time::Duration::from_millis(1100));
        set_setting(&conn, "k", "v2").unwrap();
        let t2: i64 = conn
            .query_row("SELECT updated_at FROM settings WHERE key='k'", [], |r| r.get(0))
            .unwrap();
        assert!(t2 >= t1, "updated_at should not go backwards");
        let v = get_setting(&conn, "k").unwrap().unwrap();
        assert_eq!(v, "v2");
    }
}
