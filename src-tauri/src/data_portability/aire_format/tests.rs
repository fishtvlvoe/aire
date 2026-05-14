/// Phase 2 紅燈測試 — aire_format (ZIP 容器 / checksum)
///
/// 涵蓋失敗點：DEI-001, DEI-002, DEI-003, DEI-004, DEI-005, DEI-019
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈
/// Phase 3 實作 data_portability::aire_format 後才會轉綠燈

#[cfg(test)]
mod tests {
    use super::super::{
        AireArchive,
        AireMeta,
        AireFormatError,
        create_archive,
        open_archive,
        verify_checksum,
        ARCHIVE_DB_FILENAME,
        ARCHIVE_META_FILENAME,
        ARCHIVE_CHECKSUM_FILENAME,
    };

    // DEI-001: ZIP 容器必須包含 db.sqlite
    #[test]
    fn test_archive_contains_db_sqlite() {
        let archive = AireArchive::new_empty().expect("建立空 archive 失敗");
        let filenames: Vec<String> = archive.file_names().collect();
        assert!(
            filenames.contains(&ARCHIVE_DB_FILENAME.to_string()),
            "archive 缺少 db.sqlite，實際內容：{:?}",
            filenames
        );
    }

    // DEI-002: ZIP 容器必須包含 meta.json
    #[test]
    fn test_archive_contains_meta_json() {
        let archive = AireArchive::new_empty().expect("建立空 archive 失敗");
        let filenames: Vec<String> = archive.file_names().collect();
        assert!(
            filenames.contains(&ARCHIVE_META_FILENAME.to_string()),
            "archive 缺少 meta.json，實際內容：{:?}",
            filenames
        );
    }

    // DEI-003: ZIP 容器必須包含 checksum.sha256
    #[test]
    fn test_archive_contains_checksum_sha256() {
        let archive = AireArchive::new_empty().expect("建立空 archive 失敗");
        let filenames: Vec<String> = archive.file_names().collect();
        assert!(
            filenames.contains(&ARCHIVE_CHECKSUM_FILENAME.to_string()),
            "archive 缺少 checksum.sha256，實際內容：{:?}",
            filenames
        );
    }

    // DEI-004: meta.json case_count 必須等於 db 內的真實案件數量
    #[test]
    fn test_meta_case_count_matches_db() {
        // 建立含 3 個案件的測試 archive
        let mut archive = AireArchive::with_test_cases(3).expect("建立測試 archive 失敗");
        let meta: AireMeta = archive.read_meta().expect("讀取 meta 失敗");
        assert_eq!(
            meta.case_count, 3,
            "meta.case_count 應為 3，實際為 {}",
            meta.case_count
        );
    }

    // DEI-005: checksum 必須涵蓋 db.sqlite + meta.json（不只 db）
    #[test]
    fn test_checksum_covers_db_and_meta() {
        let archive = AireArchive::with_test_cases(1).expect("建立測試 archive 失敗");
        let checksum_content = archive.read_checksum_file().expect("讀取 checksum 失敗");

        // checksum 檔案應包含兩筆記錄（db + meta）
        let lines: Vec<&str> = checksum_content.lines().collect();
        assert!(
            lines.len() >= 2,
            "checksum.sha256 應包含至少 2 行（db + meta），實際行數：{}",
            lines.len()
        );

        let has_db = lines.iter().any(|l| l.contains("db.sqlite"));
        let has_meta = lines.iter().any(|l| l.contains("meta.json"));
        assert!(has_db, "checksum.sha256 缺少 db.sqlite 的雜湊");
        assert!(has_meta, "checksum.sha256 缺少 meta.json 的雜湊");
    }

    // DEI-019: 磁碟空間不足 64 KiB headroom 時應拒絕匯出
    #[test]
    fn test_export_requires_64kib_headroom() {
        // 模擬剩餘空間 = 0 bytes
        let result = AireArchive::check_disk_space_headroom(0);
        assert!(
            result.is_err(),
            "磁碟空間 0 bytes 時應回傳 Err，但回傳 Ok"
        );

        // 磁碟空間剛好 64 KiB 時允許
        let result = AireArchive::check_disk_space_headroom(64 * 1024);
        assert!(
            result.is_ok(),
            "磁碟空間 64 KiB 時應允許，但回傳 Err：{:?}",
            result
        );

        // 磁碟空間 64 KiB - 1 時拒絕
        let result = AireArchive::check_disk_space_headroom(64 * 1024 - 1);
        assert!(
            result.is_err(),
            "磁碟空間 64 KiB - 1 bytes 時應拒絕，但回傳 Ok"
        );
    }

    // DEI-020: verify_checksum 失敗時回傳 ChecksumMismatch 錯誤
    #[test]
    fn test_verify_checksum_detects_tampering() {
        let archive_bytes = b"fake archive content";
        let wrong_checksum = "0000000000000000000000000000000000000000000000000000000000000000  db.sqlite";
        let result = verify_checksum(archive_bytes, wrong_checksum);
        assert!(
            matches!(result, Err(AireFormatError::ChecksumMismatch { .. })),
            "竄改後的 archive 應回傳 ChecksumMismatch，實際：{:?}",
            result
        );
    }
}
