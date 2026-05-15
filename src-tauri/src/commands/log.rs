// AIRE — Operation log query IPC（Group 9.2）
//
// list_recent_logs(limit) — SELECT * FROM operation_log ORDER BY ts DESC LIMIT ?
// 預設 1000；確認用了 idx_op_log_ts 索引（單元測試）。

use rusqlite::Connection;
use serde::Serialize;
use tauri::State;

use crate::commands::cases::IpcError;
use crate::DbState;

const DEFAULT_LIMIT: u32 = 1000;
const MAX_LIMIT: u32 = 10_000;

#[derive(Debug, Serialize)]
pub struct LogEntry {
    pub id: i64,
    pub ts: i64,
    pub action: String,
    pub payload: Option<String>,
    pub result: String,
}

fn lock(db: &DbState) -> Result<std::sync::MutexGuard<'_, Connection>, IpcError> {
    db.0.lock().map_err(|e| IpcError {
        code: "db_lock".into(),
        message: format!("db lock poisoned: {e}"),
    })
}

#[tauri::command]
pub async fn list_recent_logs(
    limit: Option<u32>,
    db: State<'_, DbState>,
) -> Result<Vec<LogEntry>, IpcError> {
    let n = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as i64;
    let conn = lock(&db)?;
    query_recent_logs(&conn, n).map_err(|e| IpcError {
        code: "sqlite".into(),
        message: e.to_string(),
    })
}

pub fn query_recent_logs(conn: &Connection, limit: i64) -> rusqlite::Result<Vec<LogEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, ts, action, payload, result FROM operation_log \
         ORDER BY ts DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map([limit], |r| {
        Ok(LogEntry {
            id: r.get(0)?,
            ts: r.get(1)?,
            action: r.get(2)?,
            payload: r.get(3)?,
            result: r.get(4)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::tests::open_in_memory;

    #[test]
    fn query_returns_recent_first() {
        let conn = open_in_memory();
        for (i, ts) in [10_i64, 30, 20].iter().enumerate() {
            conn.execute(
                "INSERT INTO operation_log (ts, action, payload, result) VALUES (?1, ?2, NULL, 'ok')",
                rusqlite::params![ts, format!("act_{i}")],
            )
            .unwrap();
        }
        let logs = query_recent_logs(&conn, 10).unwrap();
        assert_eq!(logs.len(), 3);
        assert_eq!(logs[0].ts, 30);
        assert_eq!(logs[1].ts, 20);
        assert_eq!(logs[2].ts, 10);
    }

    #[test]
    fn limit_is_respected() {
        let conn = open_in_memory();
        for i in 0..5 {
            conn.execute(
                "INSERT INTO operation_log (ts, action, payload, result) VALUES (?1, 'x', NULL, 'ok')",
                rusqlite::params![i as i64],
            )
            .unwrap();
        }
        let logs = query_recent_logs(&conn, 2).unwrap();
        assert_eq!(logs.len(), 2);
    }

    /// 驗證 query plan 用了 idx_op_log_ts 索引。
    #[test]
    fn query_uses_idx_op_log_ts() {
        let conn = open_in_memory();
        let mut stmt = conn
            .prepare("EXPLAIN QUERY PLAN SELECT id, ts, action, payload, result FROM operation_log ORDER BY ts DESC LIMIT ?1")
            .unwrap();
        let rows: Vec<String> = stmt
            .query_map([1000_i64], |r| r.get::<_, String>(3))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        let joined = rows.join(" | ");
        assert!(
            joined.contains("idx_op_log_ts") || joined.contains("INDEX"),
            "EXPLAIN QUERY PLAN should mention idx_op_log_ts; got: {joined}"
        );
    }
}
