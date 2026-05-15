// AIRE — Operation log writer（Group 9.1）
//
// 非同步寫入 operation_log；payload redaction 用白名單；
// 失敗只印 stderr 不 propagate。
//
// 由其他 IPC commands 呼叫：
//   crate::log::write_log("pdf_export", Some(json!({"case_id": id})), LogResult::Ok);

use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use serde_json::{Map, Value};

#[derive(Debug, Clone, Copy)]
pub enum LogResult {
    Ok,
    Error,
}

impl LogResult {
    fn as_str(&self) -> &'static str {
        match self {
            LogResult::Ok => "ok",
            LogResult::Error => "error",
        }
    }
}

/// 白名單：只允許這些 key 進 payload。其他一律丟棄。
const PAYLOAD_WHITELIST: &[&str] = &["case_id", "device_id", "output_path", "reason"];

/// 對 payload 做 redaction：只保留白名單內的 key。
///
/// 不是物件的 payload（如 string、array、number）→ 一律拋棄回 None。
pub fn redact_payload(payload: Option<Value>) -> Option<String> {
    let v = payload?;
    let obj = match v {
        Value::Object(m) => m,
        _ => return None,
    };
    let mut out: Map<String, Value> = Map::new();
    for (k, val) in obj {
        if PAYLOAD_WHITELIST.contains(&k.as_str()) {
            out.insert(k, val);
        }
    }
    if out.is_empty() {
        return None;
    }
    serde_json::to_string(&Value::Object(out)).ok()
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// 非同步寫一筆 log。失敗只印 stderr 不 propagate。
///
/// 需傳入共享的 DB connection（包在 Arc<Mutex<>>），呼叫端通常從
/// `tauri::AppHandle.state::<DbState>()` 取 Arc clone 出來餵進來。
pub fn write_log(
    db: Arc<Mutex<Connection>>,
    action: String,
    payload: Option<Value>,
    result: LogResult,
) {
    let redacted = redact_payload(payload);
    let res_str = result.as_str();
    tokio::spawn(async move {
        let ts = now_secs();
        let guard = match db.lock() {
            Ok(g) => g,
            Err(e) => {
                eprintln!("[log] db lock poisoned: {e}");
                return;
            }
        };
        if let Err(e) = guard.execute(
            "INSERT INTO operation_log (ts, action, payload, result) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![ts, action, redacted, res_str],
        ) {
            eprintln!("[log] insert failed: {e}");
        }
    });
}

/// 同步版本（測試 / 啟動序列用）。失敗只印 stderr 不 propagate。
pub fn write_log_sync(conn: &Connection, action: &str, payload: Option<Value>, result: LogResult) {
    let redacted = redact_payload(payload);
    let ts = now_secs();
    if let Err(e) = conn.execute(
        "INSERT INTO operation_log (ts, action, payload, result) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![ts, action, redacted, result.as_str()],
    ) {
        eprintln!("[log] insert failed: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn redact_keeps_whitelist_only() {
        let p = json!({
            "case_id": "abc",
            "owner_name": "張三",        // 應被丟棄
            "device_id": "uuid",
            "credit_card": "4111-...",   // 應被丟棄
            "output_path": "/tmp/x.pdf",
        });
        let r = redact_payload(Some(p)).unwrap();
        assert!(r.contains("case_id"));
        assert!(r.contains("device_id"));
        assert!(r.contains("output_path"));
        assert!(!r.contains("owner_name"));
        assert!(!r.contains("credit_card"));
    }

    #[test]
    fn redact_returns_none_for_non_object() {
        assert!(redact_payload(Some(json!("just a string"))).is_none());
        assert!(redact_payload(Some(json!([1, 2, 3]))).is_none());
        assert!(redact_payload(None).is_none());
    }

    #[test]
    fn redact_returns_none_when_all_keys_filtered() {
        let p = json!({ "secret": "xxx", "name": "yyy" });
        assert!(redact_payload(Some(p)).is_none());
    }
}
