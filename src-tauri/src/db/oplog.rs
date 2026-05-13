// AIRE — operation_log 寫入輔助（內部用，Group 9 會擴成完整 log 模組）。
//
// 本檔提供同步 insert_log()，給啟動序列、license commands、cases delete 使用。

use rusqlite::{params, Connection};

use super::DbError;

/// 寫入一筆 operation log（同步、阻塞）。
///
/// - action：機器可讀短字串（例如 license_verify、case_create、case_delete）
/// - payload：JSON 字串或 None
/// - result：'ok' | 'error'
pub fn insert_log(
    conn: &Connection,
    action: &str,
    payload: Option<&str>,
    result: &str,
) -> Result<(), DbError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    conn.execute(
        "INSERT INTO operation_log (ts, action, payload, result) VALUES (?1, ?2, ?3, ?4)",
        params![now, action, payload, result],
    )?;
    Ok(())
}
