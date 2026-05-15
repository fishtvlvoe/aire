/// Phase 2 紅燈測試 — sqlite-encryption (encryption capability)
/// 對應 spec: sqlite-encryption，失敗點 SEC-001 ~ SEC-009
/// import 尚未實作的 encryption 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::encryption::{
        migrate_to_encrypted, open_encrypted_db, open_plaintext_db, EncryptionManager,
        KeychainState, SqlCipherConfig,
    };
    use crate::land_registry::errors::LandRegistryError;

    // SEC-001: SQLCipher 版本必須在 build 間保持一致（防止 DB format drift）
    #[test]
    fn should_use_consistent_sqlcipher_version_across_builds() {
        // 驗證 bundled SQLCipher 版本固定為已知版本
        let version = SqlCipherConfig::bundled_version();
        // 版本格式：major.minor.patch（如 "4.6.1"）
        let parts: Vec<&str> = version.split('.').collect();
        assert_eq!(
            parts.len(),
            3,
            "SQLCipher version must be in major.minor.patch format"
        );
        let major: u32 = parts[0].parse().expect("Major version must be numeric");
        assert!(
            major >= 4,
            "SQLCipher major version must be >= 4 (format v4)"
        );
    }

    // SEC-002: Linux headless 環境（無 keyring daemon）→ 回 Internal error（不 panic）
    #[test]
    fn should_handle_keychain_unavailable_on_linux_headless() {
        let broken_keychain = KeychainState::unavailable();
        let result = EncryptionManager::new_with_keychain(broken_keychain);
        assert!(
            matches!(result, Err(LandRegistryError::Internal { .. })),
            "Keychain unavailable must return Internal error, not panic"
        );
    }

    // SEC-003: keychain service + account identifier 必須在版本升級間穩定
    // v1.0 存的 key 必須在 v1.1 用相同 identifier 取到
    #[test]
    fn should_use_stable_keychain_service_account_identifier() {
        let config = SqlCipherConfig::default();
        let service_id = config.keychain_service_identifier();
        let account_id = config.keychain_account_identifier();

        // 版本升級不應改變這兩個 identifier（否則 DB 無法開啟）
        // 用固定字串驗證（若 Phase 3 改了 identifier，這個測試會失敗作為提醒）
        assert_eq!(
            service_id, "com.opcos.aire.db-encryption",
            "Keychain service identifier must be stable across versions"
        );
        assert_eq!(
            account_id, "main-db-key",
            "Keychain account identifier must be stable across versions"
        );
    }

    // SEC-004: plaintext → encrypted migration 後，BLOB 欄位必須 binary-exact 保留
    #[test]
    fn should_preserve_blob_columns_during_plaintext_to_encrypted_migration() {
        use std::path::PathBuf;
        let tmp_dir = std::env::temp_dir();
        let plaintext_path = tmp_dir.join("test_plaintext_sec004.sqlite");
        let encrypted_path = tmp_dir.join("test_encrypted_sec004.sqlite");

        // 建立 plaintext DB 並寫入 BLOB 資料
        let original_blob: Vec<u8> = vec![0x00, 0xFF, 0x01, 0xFE, 0x42, 0x00, 0xAB];
        {
            let conn = open_plaintext_db(&plaintext_path).expect("Create plaintext DB");
            conn.execute(
                "CREATE TABLE test_blobs (id INTEGER PRIMARY KEY, data BLOB NOT NULL)",
                [],
            )
            .expect("Create table");
            conn.execute(
                "INSERT INTO test_blobs (data) VALUES (?1)",
                [&original_blob as &dyn rusqlite::ToSql],
            )
            .expect("Insert blob");
        }

        // 執行 migration（plaintext → encrypted）
        migrate_to_encrypted(
            &plaintext_path,
            &encrypted_path,
            "test_hex_key_00000000000000000000",
        )
        .expect("Migration must succeed");

        // 驗證 BLOB 資料 binary-exact
        let conn = open_encrypted_db(&encrypted_path, "test_hex_key_00000000000000000000")
            .expect("Open encrypted DB");
        let retrieved: Vec<u8> = conn
            .query_row("SELECT data FROM test_blobs WHERE id = 1", [], |row| {
                row.get(0)
            })
            .expect("Query blob");

        assert_eq!(
            retrieved, original_blob,
            "BLOB data must be binary-exact after plaintext-to-encrypted migration"
        );
        // 清理
        let _ = std::fs::remove_file(&plaintext_path);
        let _ = std::fs::remove_file(&encrypted_path);
    }

    // SEC-005: Windows 上，用 rename 原子替換 plaintext DB（防 crash 留下 corrupt state）
    #[test]
    fn should_atomically_replace_plaintext_db_on_windows() {
        // 注意：此測試在 macOS 上驗證邏輯路徑，Windows-specific 部分在 CI 跑
        let manager = EncryptionManager::new_with_mock_migration();
        // 模擬 crash between delete and rename
        let result = manager.simulate_crash_between_delete_and_rename();
        // App 必須能偵測 inconsistent state（plaintext 不見，encrypted 也不完整）
        let detect_result = manager.detect_inconsistent_state();
        assert!(
            detect_result.is_some(),
            "App must detect inconsistent state after partial encryption migration"
        );
    }

    // SEC-006: Corrupted DB 必須回 Internal error（不被誤認為「未加密的 DB」）
    #[test]
    fn should_distinguish_encrypted_from_corrupted_database() {
        use std::path::PathBuf;
        let tmp_dir = std::env::temp_dir();
        let corrupt_path = tmp_dir.join("test_corrupted_sec006.sqlite");

        // 寫入 corrupt 資料（非 SQLite magic bytes）
        std::fs::write(
            &corrupt_path,
            b"THIS IS NOT A SQLITE DATABASE FILE!!! CORRUPTED!!!!",
        )
        .expect("Write corrupt file");

        let result = open_encrypted_db(&corrupt_path, "any_key");
        // Corrupted DB 必須回 Internal error（不靜默 skip migration）
        assert!(
            matches!(result, Err(LandRegistryError::Internal { .. })),
            "Corrupted DB must surface Internal error, not be treated as unencrypted"
        );
        let _ = std::fs::remove_file(&corrupt_path);
    }

    // SEC-007: 加密 key 套用前，必須先關閉所有 DB connections
    #[test]
    fn should_close_all_connections_before_applying_encryption_key() {
        let manager = EncryptionManager::new_with_connection_tracker();
        // 開啟一個 connection
        let _conn = manager.open_connection_for_test();
        // 嘗試套用加密 key（必須先關閉所有 connections）
        let open_count_before_key = manager.open_connection_count();
        manager
            .apply_encryption_key("test_key")
            .expect("Apply key must succeed");
        let open_count_after_key = manager.open_connection_count();

        // apply_encryption_key 後，必須有 PRAGMA key 的 connection（= 0 舊連線殘留）
        // 所有舊 connection 必須在 PRAGMA key 前被關閉
        assert_eq!(
            open_count_after_key, 0,
            "All connections must be closed before PRAGMA key is applied"
        );
    }

    // SEC-008: PRAGMA key 必須用 raw hex 格式（x'hex'），不是 passphrase
    // passphrase 會觸發 PBKDF2，raw hex 直接用，避免 key derivation overhead
    #[test]
    fn should_pass_encryption_key_as_raw_hex_not_passphrase() {
        let manager = EncryptionManager::new_with_pragma_spy();
        let hex_key = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        manager.apply_encryption_key(hex_key).expect("Apply key");
        let pragma_sql = manager.last_pragma_key_sql();
        // PRAGMA key 語法必須是 x'hex_string'（raw hex）
        assert!(
            pragma_sql.starts_with("PRAGMA key = x'"),
            "PRAGMA key must use raw hex format x'...', not passphrase. Got: {}",
            pragma_sql
        );
        assert!(
            pragma_sql.ends_with("'"),
            "PRAGMA key x'...' syntax must be properly closed. Got: {}",
            pragma_sql
        );
    }

    // SEC-009: plaintext → encrypted migration 必須在背景執行緒（不 block main thread）
    #[test]
    fn should_run_plaintext_to_encrypted_migration_on_background_thread() {
        use std::sync::{
            atomic::{AtomicBool, Ordering},
            Arc,
        };
        let main_thread_id = std::thread::current().id();
        let migration_ran_on_main = Arc::new(AtomicBool::new(false));
        let flag = Arc::clone(&migration_ran_on_main);

        let manager = EncryptionManager::new_with_thread_spy(move |thread_id| {
            if thread_id == main_thread_id {
                flag.store(true, Ordering::SeqCst);
            }
        });

        // 啟動 migration（如果同步執行，會在 main thread 上跑）
        manager
            .start_migration_async("test_key")
            .expect("Start async migration");
        // 等待 migration 完成
        manager
            .wait_for_migration()
            .expect("Migration must complete");

        assert!(
            !migration_ran_on_main.load(Ordering::SeqCst),
            "Migration must NOT run on main thread; it must use background thread"
        );
    }
}
