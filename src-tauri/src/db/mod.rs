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
pub mod migrations {
    pub mod rekey {
        include!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/migrations/004_master_password_rekey.rs"
        ));
    }
}

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

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(&mut s, "{:02x}", b);
    }
    s
}

/// Stage 6: 直接從 master password 用 argon2id derive sqlcipher key 並開啟 DB。
///
/// 適用場景：DB 本身已用 argon2id-derived key 加密（非 keystore.json 間接路徑）。
/// 與 `open_encrypted_connection` 的差異：
/// - 本函數從 password 直接 derive key，不讀 keystore.json
/// - salt 從 keystore.json 讀取（確保每次 derive 結果一致）
/// - 適合「master password = DB 鑰匙」的對稱加密模型
pub fn open_with_master_password(path: &Path, password: &str) -> Result<Connection, DbError> {
    use crate::crypto::master_password::derive_master_key;

    // 讀 keystore.json 取得 salt（salt 必須持久化，否則每次 derive 結果不同）
    let keystore_path = path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join("keystore.json");

    let salt = read_salt_from_keystore(&keystore_path)
        .map_err(|e| DbError::new("keystore_read_failed", e.to_string()))?;

    // argon2id 從 password + salt derive 32-byte sqlcipher key
    let derived_key = derive_master_key(password, &salt)
        .map_err(|e| DbError::new("key_derive_failed", e.to_string()))?;

    let conn = Connection::open(path)?;
    let key_spec = format!("x'{}'", hex_encode(&derived_key));
    conn.pragma_update(None, "key", key_spec.as_str())
        .map_err(|e| DbError::new("sqlite_unlock_failed", e.to_string()))?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    // 驗證 key 是否正確（讀 user_version 是最輕量的探針）
    conn.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
        .map_err(|_| DbError::new("wrong_password", "wrong master password or corrupted db"))?;

    Ok(conn)
}

/// 從 keystore.json 讀取 salt（hex 格式）。
///
/// keystore.json 結構：`{"salt_hex": "<hex>", ...}`
fn read_salt_from_keystore(keystore_path: &Path) -> Result<Vec<u8>, String> {
    let raw = std::fs::read_to_string(keystore_path)
        .map_err(|e| format!("keystore.json read failed: {e}"))?;
    let val: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("keystore.json parse failed: {e}"))?;
    let salt_hex = val["salt_hex"]
        .as_str()
        .ok_or_else(|| "keystore.json missing salt_hex".to_string())?;
    hex_decode_simple(salt_hex).map_err(|e| format!("salt_hex decode failed: {e}"))
}

/// 簡易 hex decode（僅供內部 keystore 讀取用）。
fn hex_decode_simple(s: &str) -> Result<Vec<u8>, String> {
    if s.len() % 2 != 0 {
        return Err("odd length hex string".to_string());
    }
    let mut out = Vec::with_capacity(s.len() / 2);
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        let h = (bytes[i] as char)
            .to_digit(16)
            .ok_or_else(|| format!("invalid hex char at {i}"))?;
        let l = (bytes[i + 1] as char)
            .to_digit(16)
            .ok_or_else(|| format!("invalid hex char at {}", i + 1))?;
        out.push(((h << 4) | l) as u8);
        i += 2;
    }
    Ok(out)
}

/// Stage 4: 以主密碼解鎖 keystore 取得 sqlcipher key，再開啟 DB 並套用 PRAGMA key。
pub fn open_encrypted_connection(path: &Path, password: &str) -> Result<Connection, DbError> {
    let keystore_path = path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join("keystore.json");
    let sqlcipher_key = migrations::rekey::unlock_with_master(password, &keystore_path)
        .map_err(|e| DbError::new("vault_unlock_failed", e.to_string()))?;

    let conn = Connection::open(path)?;
    let key_spec = format!("x'{}'", hex_encode(&sqlcipher_key));
    let _ = conn.pragma_update(None, "key", key_spec.as_str());
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
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

    /// Stage 6.1 測試：open_with_master_password 正確密碼可讀取資料。
    #[test]
    fn open_with_master_password_succeeds() {
        use crate::crypto::master_password::derive_master_key;

        let path = tmp_db_path("stage6-open");
        let _ = std::fs::remove_file(&path);
        let keystore_path = path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(format!(
                "keystore-stage6-{}.json",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
        let _ = std::fs::remove_file(&keystore_path);

        // 準備：用 argon2id 從 password derive key，建立 encrypted db
        let password = "correct-horse-battery-staple";
        let salt = [0xB3u8; 16];
        let derived_key = derive_master_key(password, &salt).expect("derive key");

        // 寫入 keystore.json（只需要 salt_hex，open_with_master_password 只讀 salt）
        let keystore_content = serde_json::json!({
            "salt_hex": hex_encode(&salt),
            "vault_master_ciphertext_hex": "",
            "vault_master_nonce_hex": ""
        });
        std::fs::write(
            &keystore_path,
            serde_json::to_string_pretty(&keystore_content).unwrap(),
        )
        .expect("write keystore");

        // 建立用 derived_key 加密的 DB
        {
            let conn = Connection::open(&path).expect("create db");
            let key_spec = format!("x'{}'", hex_encode(&derived_key));
            conn.pragma_update(None, "key", key_spec.as_str()).unwrap();
            conn.execute_batch("CREATE TABLE probe (v INTEGER);").unwrap();
            conn.execute("INSERT INTO probe VALUES (99)", []).unwrap();
        }

        // 實際用 open_with_master_password 開啟，keystore_path 與 db path 同目錄
        // 為了讓函數找到正確的 keystore.json，建立一個 symlink 或直接用同目錄測試
        // 這裡我們繞過：把 keystore_path 的 parent 對齊到 db 的 parent，
        // 因為 open_with_master_password 固定找 parent/keystore.json，
        // 所以用標準的 keystore.json 路徑（db 同目錄）
        let std_keystore = path
            .parent()
            .unwrap()
            .join("keystore.json");
        std::fs::write(
            &std_keystore,
            serde_json::to_string_pretty(&keystore_content).unwrap(),
        )
        .expect("write std keystore");

        let conn = open_with_master_password(&path, password).expect("open with master password");
        let v: i64 = conn
            .query_row("SELECT v FROM probe", [], |r| r.get(0))
            .expect("read probe");
        assert_eq!(v, 99, "應該讀到剛寫入的資料");

        drop(conn);
        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(&keystore_path);
        let _ = std::fs::remove_file(&std_keystore);
    }

    /// Stage 6.1 測試：用錯誤密碼開啟加密 DB 應回傳 error。
    #[test]
    fn open_without_unlock_returns_locked_error() {
        use crate::crypto::master_password::derive_master_key;

        let path = tmp_db_path("stage6-wrong-pw");
        let _ = std::fs::remove_file(&path);

        let correct_password = "correct-password-123";
        let wrong_password = "wrong-password-456";
        let salt = [0xC7u8; 16];
        let derived_key = derive_master_key(correct_password, &salt).expect("derive key");

        // 建立 keystore.json（salt 對應 correct_password）
        let std_keystore = path.parent().unwrap().join("keystore.json");
        let keystore_content = serde_json::json!({
            "salt_hex": hex_encode(&salt),
            "vault_master_ciphertext_hex": "",
            "vault_master_nonce_hex": ""
        });
        std::fs::write(
            &std_keystore,
            serde_json::to_string_pretty(&keystore_content).unwrap(),
        )
        .expect("write keystore");

        // 建立用 correct_password 加密的 DB
        {
            let conn = Connection::open(&path).expect("create db");
            let key_spec = format!("x'{}'", hex_encode(&derived_key));
            conn.pragma_update(None, "key", key_spec.as_str()).unwrap();
            conn.execute_batch("CREATE TABLE t (id INTEGER);").unwrap();
        }

        // 用 wrong_password 開啟應失敗
        let result = open_with_master_password(&path, wrong_password);
        assert!(result.is_err(), "錯誤密碼應回傳 error");
        let err = result.unwrap_err();
        assert!(
            err.code == "wrong_password" || err.code == "key_derive_failed" || err.code == "sqlite_unlock_failed",
            "error code 應為 wrong_password 或相關加密錯誤，實際：{}",
            err.code
        );

        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(&std_keystore);
    }

    #[test]
    fn open_with_master_password_via_keystore() {
        let path = tmp_db_path("master-open");
        let _ = std::fs::remove_file(&path);
        let keystore_path = path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join("keystore.json");
        let _ = std::fs::remove_file(&keystore_path);

        let sqlcipher_key = [0x7bu8; 32];
        migrations::rekey::write_keystore_for_test(
            &keystore_path,
            "correct-horse-battery-staple",
            &sqlcipher_key,
        )
        .expect("write keystore");

        let conn = open_encrypted_connection(&path, "correct-horse-battery-staple")
            .expect("open with master password");
        let probe: i64 = conn.query_row("SELECT 42", [], |r| r.get(0)).unwrap();
        assert_eq!(probe, 42);

        drop(conn);
        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(&keystore_path);
    }
}
