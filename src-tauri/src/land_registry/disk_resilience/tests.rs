/// Phase 2 紅燈測試 — land-registry-disk-resilience
/// 對應 spec: land-registry-disk-resilience，失敗點 LDR-001 ~ LDR-007
/// import 尚未實作的 disk_resilience 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::disk_resilience::{
        DiskGuard, check_writable, get_free_bytes, DiskResilienceConfig,
    };
    use crate::land_registry::errors::LandRegistryError;

    // LDR-001: macOS 和 Windows 上回傳準確的磁碟可用 bytes
    // 使用平台正確的 syscall（statvfs on macOS, GetDiskFreeSpaceEx on Windows）
    #[test]
    fn should_report_accurate_free_bytes_on_macos_and_windows() {
        let path = std::env::temp_dir();
        let free_bytes = get_free_bytes(&path).expect("Must get free bytes for temp dir");
        // 磁碟可用空間 > 0（測試環境不可能磁碟完全為 0）
        assert!(free_bytes > 0, "Free bytes must be positive: got {}", free_bytes);
        // 合理上限：不超過 100TB（防止 API 回傳亂數）
        assert!(
            free_bytes < 100 * 1024u64.pow(4),
            "Free bytes must be reasonable (< 100TB): got {}",
            free_bytes
        );
    }

    // LDR-002: symlink 目標的磁碟空間檢查必須用實際掛載點（不是 symlink source）
    #[test]
    fn should_check_disk_space_for_actual_write_volume_not_symlink_source() {
        #[cfg(unix)]
        {
            use std::os::unix::fs::symlink;
            let tmp = std::env::temp_dir();
            let real_target = tmp.join("disk_test_real");
            let link_path = tmp.join("disk_test_link");
            std::fs::create_dir_all(&real_target).unwrap();
            let _ = std::fs::remove_file(&link_path);
            symlink(&real_target, &link_path).expect("Symlink creation must succeed");

            let free_via_real = get_free_bytes(&real_target).expect("Get free via real path");
            let free_via_link = get_free_bytes(&link_path).expect("Get free via symlink");

            // 通過 symlink 和通過真實路徑取到的 free bytes 必須相同
            assert_eq!(
                free_via_real, free_via_link,
                "Disk check via symlink must resolve to actual mount point"
            );
            let _ = std::fs::remove_file(&link_path);
            let _ = std::fs::remove_dir(&real_target);
        }
        #[cfg(windows)]
        {
            // Windows 無 symlink 測試，驗證基本路徑解析
            let path = std::env::temp_dir();
            assert!(get_free_bytes(&path).is_ok());
        }
    }

    // LDR-003: VACUUM INTO 備份前必須先確認磁碟空間足夠存放備份（不在備份中途失敗）
    #[test]
    fn should_check_sufficient_space_for_backup_before_vacuum_into() {
        use crate::land_registry::migration_rollback::MigrationManager;
        let manager = MigrationManager::new_with_tight_disk(100); // 只有 100 bytes 可用
        // 嘗試 VACUUM INTO 備份（需要 > 100 bytes）
        let result = manager.create_backup();
        // 必須在 VACUUM 開始前失敗，不是到一半才失敗
        assert!(
            matches!(result, Err(LandRegistryError::DiskFull { .. })),
            "Insufficient space check must happen BEFORE VACUUM INTO starts"
        );
    }

    // LDR-004: SQLite SQLITE_FULL error 必須被轉換為 DiskFull variant
    #[test]
    fn should_convert_sqlite_full_error_to_disk_full_variant() {
        use rusqlite::ffi::SQLITE_FULL;
        let sqlite_full_code = SQLITE_FULL;
        let err = LandRegistryError::from_sqlite_error_code(sqlite_full_code, 0);
        assert!(
            matches!(err, LandRegistryError::DiskFull { .. }),
            "SQLITE_FULL error code must be converted to DiskFull variant, got {:?}",
            err
        );
    }

    // LDR-005: 備份過程中磁碟滿（cleanup 階段）必須 graceful 處理（不 crash app）
    #[test]
    fn should_handle_disk_full_during_backup_cleanup_gracefully() {
        use crate::land_registry::migration_rollback::MigrationManager;
        // 模擬：備份成功，但 cleanup 舊備份時磁碟已滿
        let manager = MigrationManager::new_with_disk_full_during_cleanup();
        let result = manager.cleanup_old_backups();
        // cleanup 失敗必須回 Err（DiskFull 或 Internal），不能 panic
        assert!(
            result.is_err(),
            "Disk full during backup cleanup must return Err, not panic"
        );
        match result.unwrap_err() {
            LandRegistryError::DiskFull { .. } | LandRegistryError::Internal { .. } => { /* ok */ }
            other => panic!("Expected DiskFull or Internal, got {:?}", other),
        }
    }

    // LDR-006: check_writable 的 min_bytes 參數 = 0 必須被拒絕（無意義的檢查）
    #[test]
    fn should_reject_zero_min_bytes_in_check_writable() {
        let path = std::env::temp_dir();
        let result = check_writable(&path, 0);
        assert!(
            result.is_err(),
            "min_bytes = 0 must be rejected as invalid argument"
        );
    }

    // LDR-007: 所有寫入路徑（cache、billing_log、backup）使用相同的預設 min_bytes
    #[test]
    fn should_use_consistent_default_min_bytes_across_all_write_paths() {
        let config = DiskResilienceConfig::default();
        let cache_min = config.min_bytes_for_cache_write();
        let billing_min = config.min_bytes_for_billing_log_write();
        let backup_min = config.min_bytes_for_backup_write();

        // 三個預設值必須來自同一個 config 常數（不各自 hardcode）
        // 注意：backup_min 可以 > cache_min（備份更大），但必須都 > 0
        assert!(cache_min > 0, "cache min_bytes must be > 0");
        assert!(billing_min > 0, "billing_log min_bytes must be > 0");
        assert!(backup_min > 0, "backup min_bytes must be > 0");
        // cache 和 billing_log 使用相同的基礎 min_bytes（不各自 hardcode）
        assert_eq!(
            cache_min, billing_min,
            "Cache and billing_log must use the same default min_bytes (from config, not hardcoded)"
        );
    }
}
