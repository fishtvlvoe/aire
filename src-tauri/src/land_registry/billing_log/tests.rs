/// Phase 2 紅燈測試 — land-registry-billing-log
/// 對應 spec: land-registry-billing-log，失敗點 LBL-001 ~ LBL-008
/// import 尚未實作的 billing_log 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::billing_log::{
        BillingLog, BillingLogEntry, aggregate_daily_cost,
    };
    use crate::land_registry::errors::LandRegistryError;

    // LBL-001: transaction_id 必須 case-insensitively 從 response 中提取
    #[test]
    fn should_extract_transaction_id_case_insensitively() {
        // 協作平台回傳不同 case 的 header key
        let headers_upper = [("X-TRANSACTION-ID", "TXN-UPPER-001")];
        let headers_lower = [("x-transaction-id", "TXN-LOWER-001")];
        let headers_mixed = [("X-Transaction-Id", "TXN-MIXED-001")];

        let id_upper = BillingLogEntry::extract_transaction_id(&headers_upper);
        let id_lower = BillingLogEntry::extract_transaction_id(&headers_lower);
        let id_mixed = BillingLogEntry::extract_transaction_id(&headers_mixed);

        // 三種 header key 格式都必須成功提取（case-insensitive）
        assert_eq!(id_upper.unwrap(), "TXN-UPPER-001");
        assert_eq!(id_lower.unwrap(), "TXN-LOWER-001");
        assert_eq!(id_mixed.unwrap(), "TXN-MIXED-001");
    }

    // LBL-002: billing log 寫入失敗時，原始業務錯誤不能被吞掉（error chain 必須保留）
    #[test]
    fn should_preserve_original_error_when_billing_log_write_fails() {
        use crate::land_registry::disk_resilience::DiskGuard;
        let disk_guard = DiskGuard::simulate_full_disk();
        let log = BillingLog::new_with_disk_guard(disk_guard);

        // 業務呼叫成功，但 billing log 寫入失敗（磁碟滿）
        // 原始業務 result 必須被回傳，billing log 寫入失敗只記 log 不覆蓋 result
        let business_result: Result<String, LandRegistryError> = Ok("business data".to_string());
        let final_result = log.record_and_passthrough(
            "BA-0001-00010001",
            "API_001",
            0.5,
            "TXN-001",
            business_result,
        );
        // billing log 失敗不應讓業務成功結果變成 Err
        assert!(
            final_result.is_ok(),
            "Billing log write failure must not override successful business result"
        );
    }

    // LBL-003: API 呼叫失敗時，billing log 的 cost 必須記錄為 0
    #[test]
    fn should_store_zero_cost_for_failed_calls() {
        let log = BillingLog::new_in_memory();
        let api_error = LandRegistryError::Network {
            message: "connection refused".to_string(),
            source: Box::new(std::io::Error::new(
                std::io::ErrorKind::ConnectionRefused, "refused"
            )),
        };
        log.record_failed_call("BA-0001-00010001", "API_001", api_error, "TXN-FAIL-001")
            .expect("Recording failed call must not itself fail");

        let entries = log.get_entries_for("BA-0001-00010001");
        let failed_entry = entries.iter().find(|e| e.transaction_id() == "TXN-FAIL-001")
            .expect("Failed call entry must exist");
        assert_eq!(
            failed_entry.cost(), 0.0,
            "Failed API call must record cost = 0, not the last known cost"
        );
    }

    // LBL-004: 每日費用彙總必須用 local date（台灣時間），不用 UTC
    #[test]
    fn should_aggregate_cost_using_local_date_not_utc() {
        use crate::land_registry::time_sync::SyncedClock;
        // 模擬 UTC 00:30（台灣時間 08:30，是新的一天）
        // UTC: 2026-05-14 00:30 → 台灣 2026-05-14 08:30（同一天）
        // UTC: 2026-05-13 23:30 → 台灣 2026-05-14 07:30（跨日！）
        let clock_utc_23_30 = SyncedClock::with_fixed_utc_time("2026-05-13T23:30:00Z");
        let log = BillingLog::new_with_clock(clock_utc_23_30);
        log.record_call("BA-0001-00010001", "API_001", 1.0, "TXN-A").unwrap();

        // 台灣時間 = UTC+8，所以 2026-05-13 23:30 UTC = 2026-05-14 07:30 台灣
        // 費用應該彙總到 2026-05-14（台灣本地日期）
        let daily_cost = log.aggregate_daily("2026-05-14");
        assert!(
            daily_cost > 0.0,
            "Cost at UTC 23:30 (TW 07:30 next day) must be aggregated under Taiwan local date 2026-05-14"
        );
    }

    // LBL-005: 彙總時 cost = 0 和 negative cost 不應破壞彙總結果
    #[test]
    fn should_handle_zero_and_negative_cost_in_aggregation() {
        let log = BillingLog::new_in_memory();
        log.record_call("BA-0001-00010001", "API_001", 1.0, "TXN-001").unwrap();
        log.record_call("BA-0001-00010001", "API_002", 0.0, "TXN-002").unwrap();
        log.record_call("BA-0001-00010001", "API_003", -0.5, "TXN-REFUND").unwrap(); // 退款/修正

        let daily_cost = log.aggregate_daily("2026-05-14");
        // 1.0 + 0.0 + (-0.5) = 0.5（負數是合法的退款修正）
        assert!(
            (daily_cost - 0.5).abs() < 1e-9,
            "Aggregation must handle zero and negative costs correctly: expected 0.5, got {}",
            daily_cost
        );
    }

    // LBL-006: disk resilience check 必須在 billing log INSERT 前執行
    #[test]
    fn should_call_disk_resilience_check_before_billing_log_insert() {
        use crate::land_registry::disk_resilience::DiskGuard;
        use std::sync::{Arc, atomic::{AtomicBool, Ordering}};

        let disk_check_called = Arc::new(AtomicBool::new(false));
        let guard = DiskGuard::with_spy_hook({
            let flag = Arc::clone(&disk_check_called);
            move || { flag.store(true, Ordering::SeqCst); }
        });
        let log = BillingLog::new_with_disk_guard(guard);
        let _ = log.record_call("BA-0001-00010001", "API_001", 1.0, "TXN-001");

        assert!(
            disk_check_called.load(Ordering::SeqCst),
            "Disk resilience check must be called before billing log INSERT"
        );
    }

    // LBL-007: billing log 的 timestamp 必須使用校正後時間（synced_now()）
    #[test]
    fn should_use_synced_time_for_billing_log_timestamp() {
        use crate::land_registry::time_sync::SyncedClock;
        // 固定 synced time：2026-05-14T12:00:00Z
        let fixed_clock = SyncedClock::with_fixed_utc_time("2026-05-14T12:00:00Z");
        let log = BillingLog::new_with_clock(fixed_clock);
        log.record_call("BA-0001-00010001", "API_001", 1.0, "TXN-SYNC").unwrap();

        let entries = log.get_entries_for("BA-0001-00010001");
        let entry = entries.iter().find(|e| e.transaction_id() == "TXN-SYNC")
            .expect("Entry must exist");
        // timestamp 必須是 synced clock 的時間，不是本機 system clock
        assert!(
            entry.timestamp().contains("2026-05-14T12:00:00"),
            "Billing log timestamp must use synced_now(), got: {}",
            entry.timestamp()
        );
    }

    // LBL-008: 開始日期 > 結束日期（inverted range）時，aggregate 必須回傳 0
    #[test]
    fn should_return_zero_for_inverted_date_range() {
        let log = BillingLog::new_in_memory();
        log.record_call("BA-0001-00010001", "API_001", 100.0, "TXN-001").unwrap();

        // end_date < start_date（inverted range）
        let cost = log.aggregate_range("2026-05-20", "2026-05-01");
        assert_eq!(
            cost, 0.0,
            "Inverted date range must return 0.0, not negative or error"
        );
    }
}
