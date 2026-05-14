/// Phase 2 紅燈測試 — data_portability::import
///
/// 涵蓋失敗點：DEI-009 (checksum 驗證), DEI-010 (schema_version 拒絕),
///             DEI-011 (衝突偵測), DEI-012 (磁碟空間)
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        ImportOptions,
        ImportError,
        ImportResult,
        start_import,
        validate_archive_checksum,
        check_schema_version_compatibility,
        detect_conflicts,
        ConflictStrategy,
    };

    // DEI-009: 匯入前必須驗證 checksum，checksum 不符應拒絕
    #[test]
    fn test_import_rejects_bad_checksum() {
        // 建立一個 checksum 被竄改的 archive bytes
        let tampered_bytes = b"tampered archive data";
        let wrong_checksum = "deadbeef00000000000000000000000000000000000000000000000000000000  db.sqlite\ndeadbeef00000000000000000000000000000000000000000000000000000000  meta.json";

        let result = validate_archive_checksum(tampered_bytes, wrong_checksum);
        assert!(
            result.is_err(),
            "checksum 不符時應回傳 Err，但回傳 Ok"
        );

        match result {
            Err(ImportError::CorruptedFile) => {}
            Err(other) => panic!("期望 CorruptedFile，實際：{:?}", other),
            Ok(_) => panic!("checksum 不符時不應回傳 Ok"),
        }
    }

    // DEI-010: schema_version 不相容時應拒絕匯入並提供清楚說明
    #[test]
    fn test_import_rejects_incompatible_schema_version() {
        // 模擬一個來自未來版本的 archive（schema_version = 99）
        let result = check_schema_version_compatibility(99);
        assert!(
            result.is_err(),
            "schema_version=99 應被拒絕，但回傳 Ok"
        );

        match result {
            Err(ImportError::IncompatibleSchema) => {}
            Err(other) => panic!("期望 IncompatibleSchema，實際：{:?}", other),
            Ok(_) => panic!("不相容版本不應回傳 Ok"),
        }
    }

    // DEI-010b: schema_version 相容時應允許匯入
    #[test]
    fn test_import_accepts_compatible_schema_version() {
        // schema_version = 1 應被接受（當前版本）
        let result = check_schema_version_compatibility(1);
        assert!(
            result.is_ok(),
            "schema_version=1 應被允許，但回傳 Err：{:?}",
            result
        );
    }

    // DEI-011: 匯入前必須偵測案件衝突（ID 相同）
    #[test]
    fn test_import_detects_case_id_conflicts() {
        // 現有案件 ID 列表
        let existing_ids: Vec<u64> = vec![1, 2, 3];
        // 匯入檔案含 ID 2, 3, 4（2 和 3 衝突）
        let incoming_ids: Vec<u64> = vec![2, 3, 4];

        let conflicts = detect_conflicts(&existing_ids, &incoming_ids)
            .expect("detect_conflicts 失敗");

        assert_eq!(conflicts.len(), 2, "應偵測到 2 個衝突，實際 {}", conflicts.len());
        assert!(conflicts.contains(&2), "ID 2 應在衝突列表中");
        assert!(conflicts.contains(&3), "ID 3 應在衝突列表中");
        assert!(!conflicts.contains(&4), "ID 4 不應在衝突列表中（無衝突）");
    }

    // DEI-011b: 無衝突時 detect_conflicts 回傳空列表
    #[test]
    fn test_import_no_conflicts_when_ids_disjoint() {
        let existing_ids: Vec<u64> = vec![1, 2, 3];
        let incoming_ids: Vec<u64> = vec![4, 5, 6];

        let conflicts = detect_conflicts(&existing_ids, &incoming_ids)
            .expect("detect_conflicts 失敗");

        assert!(
            conflicts.is_empty(),
            "ID 不重疊時不應有衝突，實際：{:?}",
            conflicts
        );
    }

    // DEI-012: 匯入目標磁碟空間不足時應提前拒絕
    #[test]
    fn test_import_rejects_insufficient_disk_space() {
        let opts = ImportOptions {
            archive_path: "/tmp/test.aire".into(),
            conflict_strategy: ConflictStrategy::Overwrite,
            #[cfg(test)]
            mock_available_bytes: Some(0),
            #[cfg(test)]
            mock_archive_size: Some(1024 * 1024), // 1 MiB
        };

        let result = start_import(opts);
        assert!(
            matches!(result, Err(ImportError::InsufficientDiskSpace { .. })),
            "磁碟空間不足時應回傳 InsufficientDiskSpace，實際：{:?}",
            result
        );
    }
}
