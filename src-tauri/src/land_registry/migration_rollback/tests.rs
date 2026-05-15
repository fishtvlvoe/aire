/// Phase 2 紅燈測試 — land-registry-migration-rollback
/// 對應 spec: land-registry-migration-rollback，失敗點 LMR-001 ~ LMR-009
/// import 尚未實作的 migration_rollback 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::errors::LandRegistryError;
    use crate::land_registry::migration_rollback::{
        BackupPolicy, MigrationManager, MigrationState,
    };

    // LMR-001: VACUUM INTO 備份失敗時，migration 必須 abort（不繼續執行）
    #[test]
    fn should_abort_migration_when_vacuum_into_backup_fails() {
        let manager = MigrationManager::new_with_failing_vacuum_into();
        let result = manager.run_migration_002();
        assert!(
            matches!(result, Err(LandRegistryError::MigrationFailed { .. })),
            "VACUUM INTO failure must abort migration and return MigrationFailed"
        );
        // 確認 migration 002 沒有被標記為 applied
        assert!(
            !manager.is_migration_applied("002"),
            "Migration 002 must not be marked as applied after VACUUM INTO failure"
        );
    }

    // LMR-002: 空的 database 的 VACUUM INTO 備份也是合法的（不應被拒絕）
    #[test]
    fn should_accept_backup_of_empty_database_as_valid() {
        let manager = MigrationManager::new_with_empty_db();
        let result = manager.create_backup();
        assert!(
            result.is_ok(),
            "VACUUM INTO of empty DB must succeed (schema overhead produces non-zero backup)"
        );
        let backup_size = manager.last_backup_size_bytes();
        assert!(
            backup_size > 0,
            "Empty DB backup must be non-zero (schema pages exist): got {} bytes",
            backup_size
        );
    }

    // LMR-003: rollback 執行期間必須鎖定 DB，阻止並行讀取
    #[test]
    fn should_lock_db_during_rollback_to_prevent_concurrent_reads() {
        use std::sync::{
            atomic::{AtomicBool, Ordering},
            Arc,
        };
        let manager = Arc::new(MigrationManager::new_in_memory());
        let read_attempted_during_rollback = Arc::new(AtomicBool::new(false));

        let m = Arc::clone(&manager);
        let flag = Arc::clone(&read_attempted_during_rollback);

        // 在背景執行 rollback（會持有鎖）
        let rollback_handle = std::thread::spawn(move || {
            m.rollback_with_long_delay() // 模擬 rollback 花 100ms
        });

        // 嘗試並行讀取，應該被鎖定（不能成功）
        std::thread::sleep(std::time::Duration::from_millis(10)); // 確保 rollback 已開始
        let read_result = manager.try_read_during_rollback();
        flag.store(read_result.is_ok(), Ordering::SeqCst);

        rollback_handle
            .join()
            .expect("Rollback thread must not panic");

        assert!(
            !read_attempted_during_rollback.load(Ordering::SeqCst),
            "Concurrent reads must be blocked during rollback"
        );
    }

    // LMR-004: rollback restore 後必須執行 WAL checkpoint（讓 DB 可直接開啟）
    #[test]
    fn should_checkpoint_wal_after_rollback_restore() {
        let manager = MigrationManager::new_with_wal_mode();
        // 執行 rollback
        manager.perform_rollback().expect("Rollback must succeed");
        // rollback 後 DB 必須能在不做 WAL recovery 的情況下直接開啟
        let open_result = manager.open_db_without_wal_recovery();
        assert!(
            open_result.is_ok(),
            "After rollback, DB must be openable without WAL recovery (checkpoint must have run)"
        );
    }

    // LMR-005: 備份清理必須用檔名中的 timestamp，不能用檔案 mtime
    // （因為 mtime 在某些 OS 操作後會改變）
    #[test]
    fn should_use_backup_filename_timestamp_not_mtime_for_cleanup() {
        let manager = MigrationManager::new_with_backup_policy(BackupPolicy::KeepLast7Days);
        // 建立一個檔名含舊 timestamp 但 mtime 是今天的備份
        let backup_name = "backup_2026-04-01T00-00-00Z.sqlite";
        manager.simulate_backup_with_future_mtime(backup_name);

        manager
            .cleanup_old_backups()
            .expect("Cleanup must not fail");

        // 此備份的 mtime 是今天，但檔名 timestamp 是 43 天前 → 必須被清除
        let exists = manager.backup_exists(backup_name);
        assert!(
            !exists,
            "Old backup must be deleted based on filename timestamp, not mtime"
        );
    }

    // LMR-006: 失敗的 migration 備份保留時間比成功的 migration 備份更長
    #[test]
    fn should_retain_failed_migration_backups_longer_than_successful_ones() {
        let policy = BackupPolicy::default();
        let success_retention = policy.retention_days_for_successful();
        let failed_retention = policy.retention_days_for_failed();
        assert!(
            failed_retention > success_retention,
            "Failed migration backups must be retained longer ({} days) than successful ones ({} days)",
            failed_retention,
            success_retention
        );
    }

    // LMR-007: 備份必須使用與主 DB 相同的加密 key
    #[test]
    fn should_create_encrypted_backup_with_same_key() {
        let manager =
            MigrationManager::new_with_encrypted_db("test_hex_key_64chars_00000000000000");
        let backup_path = manager.create_backup().expect("Backup must succeed");
        // 嘗試用正確的 key 開啟備份
        let open_with_key =
            manager.open_backup_with_key(&backup_path, "test_hex_key_64chars_00000000000000");
        assert!(
            open_with_key.is_ok(),
            "Backup must be openable with correct encryption key"
        );
        // 嘗試用錯誤的 key 開啟備份（必須失敗）
        let open_with_wrong_key = manager.open_backup_with_key(&backup_path, "wrong_key");
        assert!(
            open_with_wrong_key.is_err(),
            "Backup must NOT be openable without correct encryption key"
        );
    }

    // LMR-008: migration 002 rollback 後，app 必須 surface MigrationFailed（不 crash）
    #[test]
    fn should_degrade_gracefully_when_migration_002_rolled_back() {
        let manager = MigrationManager::new_after_failed_002_rollback();
        // App 嘗試正常操作（需要 migration 002 的 schema）
        let result = manager.perform_operation_requiring_002_schema();
        assert!(
            matches!(result, Err(LandRegistryError::MigrationFailed { .. })),
            "After 002 rollback, app must surface MigrationFailed, not crash on missing table"
        );
    }

    // LMR-009: migration 001 必須在 migration 002 嘗試前被標記為 applied
    // 若 002 失敗 rollback，下次啟動 001 不應被重新跑
    #[test]
    fn should_mark_migration_001_as_applied_before_attempting_002() {
        let manager = MigrationManager::new_fresh();
        // 執行 001（成功）+ 002（失敗）
        manager
            .run_migration_001()
            .expect("Migration 001 must succeed");
        let _ = manager.run_migration_002_that_fails(); // 故意失敗

        // rollback 002 後，001 必須仍被標記為 applied
        assert!(
            manager.is_migration_applied("001"),
            "Migration 001 must remain applied after 002 failure and rollback"
        );
        assert!(
            !manager.is_migration_applied("002"),
            "Migration 002 must NOT be marked as applied after rollback"
        );
    }
}
