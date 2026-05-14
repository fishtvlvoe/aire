/// Phase 2 紅燈測試 — data_portability::export
///
/// 涵蓋失敗點：DEI-006 (IMMEDIATE 寫鎖), DEI-007 (磁碟空間), DEI-008 (meta 完整性)
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        ExportOptions,
        ExportResult,
        ExportError,
        start_export,
        ExportLock,
    };
    use std::sync::Arc;

    // DEI-006: 匯出開始後必須立即取得寫鎖，阻擋其他寫入操作
    #[test]
    fn test_export_acquires_immediate_write_lock() {
        let lock = ExportLock::new();

        // 第一個匯出應成功取鎖
        let guard1 = lock.try_acquire().expect("第一個匯出應能取鎖");

        // 同時間第二個匯出應失敗（寫鎖已被持有）
        let guard2 = lock.try_acquire();
        assert!(
            guard2.is_err(),
            "寫鎖已被持有時，第二個匯出應回傳 Err，但回傳 Ok"
        );

        drop(guard1); // 釋放寫鎖

        // 釋放後第三個匯出應成功
        let guard3 = lock.try_acquire();
        assert!(
            guard3.is_ok(),
            "寫鎖釋放後應能重新取鎖，但回傳 Err：{:?}",
            guard3
        );
    }

    // DEI-006b: 寫鎖在匯出完成（成功或失敗）後自動釋放
    #[test]
    fn test_write_lock_released_after_export_failure() {
        let lock = ExportLock::new();
        {
            let _guard = lock.try_acquire().expect("應能取鎖");
            // guard 離開 scope 時自動釋放（Drop trait）
        }
        // 釋放後應能重新取鎖
        let result = lock.try_acquire();
        assert!(
            result.is_ok(),
            "匯出完成後寫鎖應釋放，但無法重新取鎖：{:?}",
            result
        );
    }

    // DEI-007: 磁碟空間不足時 start_export 應在開始前就拒絕
    #[test]
    fn test_export_rejects_insufficient_disk_space() {
        let opts = ExportOptions {
            output_path: "/tmp/test.aire".into(),
            // 測試用：模擬 mock 磁碟空間
            #[cfg(test)]
            mock_available_bytes: Some(0),
        };

        let result = start_export(opts);
        assert!(
            matches!(result, Err(ExportError::InsufficientDiskSpace { .. })),
            "磁碟空間不足時應回傳 InsufficientDiskSpace，實際：{:?}",
            result
        );
    }

    // DEI-008: 匯出的 meta.json 必須包含 created_at, aire_version, case_count
    #[test]
    fn test_export_meta_contains_required_fields() {
        // meta.json 的 schema 驗證
        let meta_json = r#"{"case_count": 1}"#; // 缺少必要欄位

        let result: Result<super::super::AireMeta, _> =
            serde_json::from_str(meta_json);

        // 嚴格 schema：缺少 created_at / aire_version 時應反序列化失敗
        // 或透過 validate() 偵測
        match result {
            Ok(meta) => {
                let validation = meta.validate();
                assert!(
                    validation.is_err(),
                    "meta 缺少 created_at + aire_version 時 validate() 應回傳 Err"
                );
            }
            Err(_) => {
                // 嚴格反序列化失敗也符合預期
            }
        }
    }

    // DEI-008b: meta.json case_count 必須正確反映實際案件數量
    #[test]
    fn test_export_meta_case_count_accurate() {
        use super::super::count_cases_in_db;

        let db_path = ":memory:";
        let db = rusqlite::Connection::open(db_path).expect("開啟記憶體 DB 失敗");

        // 插入 5 個案件
        db.execute_batch(
            "CREATE TABLE cases (id INTEGER PRIMARY KEY);
             INSERT INTO cases VALUES (1),(2),(3),(4),(5);"
        ).expect("建立測試資料失敗");

        let count = count_cases_in_db(&db).expect("計算案件數失敗");
        assert_eq!(count, 5, "case_count 應為 5，實際為 {}", count);
    }
}
