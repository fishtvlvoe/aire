/// Phase 2 紅燈測試 — land-registry-time-sync
/// 對應 spec: land-registry-time-sync，失敗點 LTS-001 ~ LTS-008
/// import 尚未實作的 time_sync 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::errors::LandRegistryError;
    use crate::land_registry::time_sync::{
        parse_http_date, SyncedClock, TimeSyncModule, TimeSyncState,
    };
    use std::time::Duration;

    // LTS-001: HTTP Date header 支援多種格式（RFC 7231, RFC 850, ANSI C）
    #[test]
    fn should_parse_multiple_http_date_header_formats() {
        // RFC 7231 (IMF-fixdate)
        let rfc7231 = "Thu, 14 May 2026 12:00:00 GMT";
        // RFC 850 (obsolete, 但仍有 server 回)
        let rfc850 = "Thursday, 14-May-26 12:00:00 GMT";
        // ANSI C asctime()
        let asctime = "Thu May 14 12:00:00 2026";

        let ts_7231 = parse_http_date(rfc7231).expect("RFC 7231 date must parse");
        let ts_850 = parse_http_date(rfc850).expect("RFC 850 date must parse");
        let ts_ansi = parse_http_date(asctime).expect("ANSI C asctime date must parse");

        // 三種格式都應解析到相同的 Unix timestamp（2026-05-14 12:00:00 UTC）
        let expected_ts = 1747224000i64; // 2026-05-14 12:00:00 UTC
        assert_eq!(ts_7231, expected_ts, "RFC 7231 parsed timestamp must match");
        assert_eq!(ts_850, expected_ts, "RFC 850 parsed timestamp must match");
        assert_eq!(
            ts_ansi, expected_ts,
            "ANSI C asctime parsed timestamp must match"
        );
    }

    // LTS-002: 負數 offset（本機比伺服器時間快）必須正確存入 SQLite（整數型別）
    #[test]
    fn should_store_negative_offset_correctly_in_sqlite() {
        let module = TimeSyncModule::new_in_memory_db();
        // 本機時間比伺服器快 300 秒（offset = -300）
        module
            .store_offset(-300)
            .expect("Negative offset must be stored");
        let retrieved = module.get_offset().expect("Offset retrieval must succeed");
        assert_eq!(
            retrieved, -300,
            "Negative offset must be stored and retrieved correctly from SQLite"
        );
    }

    // LTS-003: 首次啟動且 offline 時，offset = 0，並標記 unsynced（不 panic）
    #[test]
    fn should_use_zero_offset_and_flag_unsynced_on_first_boot_offline() {
        let module = TimeSyncModule::new_fresh_offline();
        let state = module.get_state();
        assert_eq!(
            state.offset_seconds(),
            0,
            "First boot offline must use offset = 0 (safe fallback)"
        );
        assert!(
            !state.is_synced(),
            "First boot offline must be flagged as unsynced"
        );
    }

    // LTS-004: NTP sync 必須在 3 秒內完成（不 hang）
    #[test]
    fn should_complete_ntp_sync_within_3_seconds_timeout() {
        use std::time::Instant;
        let module = TimeSyncModule::new_with_ntp_timeout(Duration::from_secs(3));
        let start = Instant::now();
        // 使用 mock NTP server（不實際網路，測 timeout 邊界）
        let _ = module.sync_with_mock_ntp_server();
        let elapsed = start.elapsed();
        assert!(
            elapsed <= Duration::from_secs(4), // 給 1s buffer
            "NTP sync must complete within 3s timeout, elapsed={:?}",
            elapsed
        );
    }

    // LTS-005: NTP 同步在其他模組已計算 TTL 後才更新 offset，不引發 cascade TTL 錯誤
    #[test]
    fn should_handle_late_offset_update_without_cascading_ttl_errors() {
        let clock = SyncedClock::with_initial_offset(0);
        // 模擬 time_sync 在使用中途更新 offset（+5 秒）
        clock.update_offset(5);
        // 快取模組等用的 TTL 計算不應因 offset 改變而崩潰
        let days_remaining = clock.compute_grace_days_remaining(7);
        // 不 panic，結果合理（0 ~ 7）
        assert!(
            days_remaining >= 0 && days_remaining <= 7,
            "Late offset update must not cause cascade TTL errors, got {}",
            days_remaining
        );
    }

    // LTS-006: NTP 失敗時必須記錄失敗原因（不靜默失敗）
    #[test]
    fn should_log_reason_when_ntp_fails() {
        let module = TimeSyncModule::new_with_always_failing_ntp();
        let result = module.sync_with_mock_ntp_server();
        // NTP 失敗必須是 Err（不是靜默的 Ok）
        assert!(
            result.is_err(),
            "NTP failure must return Err, not silently succeed"
        );
        let err_msg = format!("{}", result.unwrap_err());
        // 錯誤訊息必須包含失敗原因
        assert!(
            !err_msg.is_empty(),
            "NTP failure error must include reason for debugging"
        );
    }

    // LTS-007: grace period 天數計算必須使用完整精度（不截斷小時/分鐘）
    // 6 天 23 小時 elapsed → days_remaining = 0（仍在 grace period 內），不是 -1
    #[test]
    fn should_use_full_precision_for_grace_period_day_calculation() {
        let clock = SyncedClock::with_fixed_utc_time("2026-05-14T12:00:00Z");
        // last_verified = 6 天 23 小時前（= 2026-05-07 13:00:00 UTC）
        let last_verified_ts = 1747224000i64 - (6 * 86400 + 23 * 3600);
        let grace_period_days: i64 = 7;
        let days_remaining =
            clock.compute_grace_days_remaining_from_ts(last_verified_ts, grace_period_days);
        // 6d 23h elapsed < 7d → 仍在 grace period → days_remaining should be >= 0
        assert!(
            days_remaining >= 0,
            "6d 23h elapsed within 7-day grace must still have days_remaining >= 0, got {}",
            days_remaining
        );
    }

    // LTS-008: NTP primary 失敗後 fallback，整個 sync 流程不超過 5 秒 budget
    #[test]
    fn should_complete_ntp_fallback_within_total_5_second_budget() {
        use std::time::Instant;
        // primary NTP: 3s timeout（會失敗）
        // fallback NTP: 2s timeout（會成功）
        let module = TimeSyncModule::new_with_primary_fail_fallback_succeed(
            Duration::from_secs(3),
            Duration::from_secs(2),
        );
        let start = Instant::now();
        let result = module.sync_with_fallback();
        let elapsed = start.elapsed();
        // 整個 fallback 流程不超過 6s（5s budget + 1s buffer）
        assert!(
            elapsed <= Duration::from_secs(6),
            "NTP fallback must complete within 5s total budget, elapsed={:?}",
            elapsed
        );
        // fallback 必須成功（不因 primary 失敗而放棄）
        assert!(
            result.is_ok(),
            "NTP fallback must succeed when primary fails"
        );
    }
}
