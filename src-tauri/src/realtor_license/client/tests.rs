/// Phase 2 紅燈測試 — realtor_license::client 模組
///
/// 這個檔案 import 了 `crate::realtor_license::client`，而該模組尚未建立。
/// `cargo test --package aire_core realtor_license` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/realtor_license/mod.rs
/// - src-tauri/src/realtor_license/client.rs（verify_realtor_license, LicenseStatus, RealtorLicenseError）
/// - src-tauri/src/realtor_license/models.rs（LicenseVerificationResult）

#[cfg(test)]
mod tests {
    use super::super::{
        client::{
            fetch_license_from_opcos, LicenseStatus, LicenseVerificationResult, RealtorLicenseError,
        },
        verify_realtor_license,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-001 / spec: IPC verify_realtor_license 返回 source: 'fresh' 當 cache miss
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_001_fresh_verification_returns_source_fresh() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // mock OPCOS 返回 verified
        let result = super::super::verify_with_mock(
            &db,
            "ABC123456",
            LicenseStatus::Verified {
                expires_at: "2030-01-01".to_string(),
            },
        );

        assert!(result.is_ok(), "fresh 驗證應成功");

        let verification = result.unwrap();
        assert_eq!(
            verification.source, "fresh",
            "cache miss 時 source 必須是 'fresh'"
        );
        assert_eq!(
            verification.status,
            LicenseStatus::Verified {
                expires_at: "2030-01-01".to_string()
            }
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-005 / spec: expired 狀態不阻擋 form submit
    // 驗證 verify_realtor_license 返回 Ok 即使狀態是 expired
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_002_expired_license_returns_ok_not_err() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // mock OPCOS 返回 expired
        let result = super::super::verify_with_mock(
            &db,
            "EXP999999",
            LicenseStatus::Expired {
                expires_at: "2024-01-01".to_string(),
            },
        );

        // expired 是一種有效的驗證結果，不是錯誤
        // IPC 應返回 Ok(LicenseVerificationResult { status: Expired, ... })
        // 而不是 Err(...)
        assert!(
            result.is_ok(),
            "expired 狀態應返回 Ok，不應是 Err（驗證結果不等於失敗）"
        );

        let verification = result.unwrap();
        matches!(verification.status, LicenseStatus::Expired { .. });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-007 / spec: 並行同一個證號 cache miss → INSERT race condition
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_003_concurrent_same_license_no_unique_constraint_panic() {
        use std::sync::Arc;
        use tokio::sync::Mutex;

        let db = Arc::new(Mutex::new(
            rusqlite::Connection::open_in_memory().expect("in-memory DB"),
        ));

        let db_a = Arc::clone(&db);
        let db_b = Arc::clone(&db);

        // 兩個 task 同時驗證同一個證號（cache miss → 都打 OPCOS → 都 INSERT）
        let handle_a = tokio::spawn(async move {
            let db = db_a.lock().await;
            super::super::verify_with_mock(
                &*db,
                "SAME123456",
                LicenseStatus::Verified {
                    expires_at: "2030-01-01".to_string(),
                },
            )
        });

        let handle_b = tokio::spawn(async move {
            let db = db_b.lock().await;
            super::super::verify_with_mock(
                &*db,
                "SAME123456",
                LicenseStatus::Verified {
                    expires_at: "2030-01-01".to_string(),
                },
            )
        });

        let (result_a, result_b) = tokio::join!(handle_a, handle_b);

        // 兩個 task 都不應 panic（UNIQUE constraint violation 應被 INSERT OR REPLACE 處理）
        assert!(
            result_a.is_ok(),
            "concurrent verify A task panic: {:?}",
            result_a
        );
        assert!(
            result_b.is_ok(),
            "concurrent verify B task panic: {:?}",
            result_b
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-011 / spec: 3 秒 timeout 後回傳 timeout 狀態，不寫 cache
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_004_timeout_after_3s_returns_timeout_state() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // mock 一個回應需要 3001ms 的 OPCOS（超過 3s timeout）
        let result = super::super::verify_with_delayed_mock(
            &db,
            "TIMEOUT789",
            std::time::Duration::from_millis(3001),
        )
        .await;

        // 不應 panic，應返回 timeout 錯誤或超時狀態
        assert!(
            result.is_ok(),
            "timeout 不應 panic，應返回 Ok(timeout state)"
        );

        let verification = result.unwrap();
        matches!(verification.status, LicenseStatus::Timeout);

        // timeout 後不應寫入 cache
        let cache_row = super::super::cache::read_license_cache(&db, "TIMEOUT789");
        assert!(
            cache_row.is_err() || cache_row.unwrap().is_none(),
            "timeout 的驗證結果不應寫入 cache"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-012 / spec: Timeout 狀態是合法的 UI 狀態（非 3-態之外的邊緣）
    // LicenseStatus 必須有 Timeout variant
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_client_005_license_status_has_timeout_variant() {
        // 型別編譯驗證：LicenseStatus 必須包含 Timeout variant（spec 三態 + 超時 = 四態 UI）
        let timeout_status = LicenseStatus::Timeout;

        // 必須可以 match
        match timeout_status {
            LicenseStatus::Verified { .. } => panic!("不應是 Verified"),
            LicenseStatus::NotFound => panic!("不應是 NotFound"),
            LicenseStatus::Expired { .. } => panic!("不應是 Expired"),
            LicenseStatus::Timeout => {
                // 預期行為
            }
            LicenseStatus::Offline { .. } => panic!("不應是 Offline"),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-013 / spec: source 欄位在過期 cache + 離線時的語意
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_006_expired_cache_offline_returns_offline_source() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // 預先寫入 8 天前的 cache（已過期）
        super::super::cache::seed_expired_license(&db, "OLD123456", "2026-05-06T00:00:00Z")
            .expect("seed failed");

        // mock OPCOS 無法連線
        let result = super::super::verify_offline(&db, "OLD123456");

        assert!(result.is_ok(), "離線 + 過期 cache 不應 panic");

        let verification = result.unwrap();
        // source 應是 'offline'（不是 'cache'，因為 cache 已過期）
        assert_eq!(
            verification.source, "offline",
            "過期 cache + 離線時 source 應是 'offline'，不是 'cache'"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-015 / spec: 空字串 license_number 不應發送 API 請求
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn rlv_client_007_empty_license_number_returns_error_without_api_call() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // 空字串不應觸發 OPCOS 呼叫
        let result = verify_realtor_license(&db, "");

        assert!(
            result.is_err(),
            "空字串 license_number 應返回 Err（不觸發 API）"
        );

        match result.unwrap_err() {
            RealtorLicenseError::InvalidLicenseNumberFormat => {
                // 預期行為
            }
            other => panic!(
                "空字串應返回 InvalidLicenseNumberFormat，但得到 {:?}",
                other
            ),
        }
    }
}
