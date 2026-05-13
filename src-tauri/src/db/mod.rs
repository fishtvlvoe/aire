// AIRE 桌面 App — SQLite 資料庫模組
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D2
//
// 對外暴露：
// - `init_db(path)`：開啟（或建立）DB、依序套用未套用的 migrations，回傳 Connection
// - `DbError`：所有 repository 統一的錯誤型別
// - submodules: cases, drafts, settings

use rusqlite::Connection;
use std::path::Path;

pub mod cases;
pub mod drafts;
pub mod oplog;
pub mod settings;

/// 內嵌的 migration 腳本。
///
/// 列表必須依 `user_version` 由低到高排序：第 N 筆（index = N）會在現有
/// `user_version < N+1` 時被套用，套用成功後 `user_version` 更新為 `N+1`。
///
/// 採 `include_str!` 而非執行期掃資料夾，避免：
/// 1. 打包後 migrations/ 不在工作目錄旁邊
/// 2. 客戶端跑時路徑解析錯誤
const MIGRATIONS: &[&str] = &[
    include_str!("../../migrations/001_initial.sql"),
];

/// AIRE 資料庫統一錯誤型別。
///
/// `code` 為機器可讀短字串（如 `"not_found"`、`"sqlite"`），
/// `message` 為人類可讀訊息（log/UI 用）。
#[derive(Debug, Clone)]
pub struct DbError {
    pub code: String,
    pub message: String,
}

impl DbError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn not_found(what: &str) -> Self {
        Self::new("not_found", format!("{what} not found"))
    }
}

impl std::fmt::Display for DbError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for DbError {}

impl From<rusqlite::Error> for DbError {
    fn from(err: rusqlite::Error) -> Self {
        match err {
            rusqlite::Error::QueryReturnedNoRows => DbError::not_found("row"),
            other => DbError::new("sqlite", other.to_string()),
        }
    }
}

/// 開啟 SQLite 連線並套用所有未套用的 migration。
///
/// 行為：
/// 1. 開啟 / 建立 `path` 指定的 DB 檔案
/// 2. 啟用 `PRAGMA foreign_keys = ON`（disclosure_drafts CASCADE 需要）
/// 3. 讀取目前 `user_version`
/// 4. 從第 `user_version` 筆開始套用 `MIGRATIONS`，每套用一筆即 `PRAGMA user_version = N`
/// 5. 回傳 Connection
pub fn init_db(path: &Path) -> Result<Connection, DbError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| DbError::new("io", format!("create db dir failed: {e}")))?;
    }

    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    let mut current: i64 =
        conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;

    let target = MIGRATIONS.len() as i64;
    while current < target {
        let idx = current as usize;
        let sql = MIGRATIONS[idx];
        // 注意：migration SQL 內已含 `PRAGMA user_version = N`，但為了確保
        // 在多筆 migration 串接時版本號正確，我們也在這層顯式更新。
        conn.execute_batch(sql)?;
        let next = current + 1;
        conn.execute_batch(&format!("PRAGMA user_version = {next};"))?;
        current = next;
    }

    Ok(conn)
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;

    /// 取得記憶體型 Connection 並套用所有 migration（測試用）。
    pub(crate) fn open_in_memory() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        for (idx, sql) in MIGRATIONS.iter().enumerate() {
            conn.execute_batch(sql).expect("apply migration");
            let next = (idx + 1) as i64;
            conn.execute_batch(&format!("PRAGMA user_version = {next};"))
                .unwrap();
        }
        conn
    }

    fn tmp_db_path(name: &str) -> std::path::PathBuf {
        let mut p = std::env::temp_dir();
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        p.push(format!("aire-test-{name}-{nanos}.db"));
        p
    }

    #[test]
    fn init_db_applies_to_v1_on_fresh_db() {
        let path = tmp_db_path("fresh");
        let _ = std::fs::remove_file(&path);

        let conn = init_db(&path).expect("init_db ok");
        let v: i64 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, 1, "fresh DB should be at user_version = 1");

        // 表存在性檢查
        for table in ["cases", "disclosure_drafts", "settings", "operation_log"] {
            let count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                    [table],
                    |r| r.get(0),
                )
                .unwrap();
            assert_eq!(count, 1, "table {table} should exist");
        }

        drop(conn);
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn init_db_does_not_reapply_when_already_v1() {
        let path = tmp_db_path("noop");
        let _ = std::fs::remove_file(&path);

        // 第一次套用
        let conn = init_db(&path).expect("first init ok");
        // 插一筆資料以證明第二次 init 不會 drop / 重建
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            rusqlite::params!["probe", "v1", 1234_i64],
        )
        .unwrap();
        drop(conn);

        // 第二次套用 — 應為 no-op
        let conn2 = init_db(&path).expect("second init ok");
        let v: i64 = conn2
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, 1);
        let val: String = conn2
            .query_row(
                "SELECT value FROM settings WHERE key=?1",
                ["probe"],
                |r| r.get(0),
            )
            .expect("probe row should still exist");
        assert_eq!(val, "v1");

        drop(conn2);
        let _ = std::fs::remove_file(&path);
    }
}
