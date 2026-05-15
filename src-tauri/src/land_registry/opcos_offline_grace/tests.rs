/// Phase 2 紅燈測試 — opcos-offline-grace
/// 對應 spec: opcos-offline-grace，失敗點 OOG-001 ~ OOG-008
/// import 尚未實作的 opcos_offline_grace 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::errors::LandRegistryError;
    use crate::land_registry::opcos_offline_grace::{
        GraceConfig, OfflineGraceChecker, OfflineGraceState,
    };

    // OOG-001: 第一次成功驗證後，offline state 必須 upsert（last_verified_at 有值）
    #[test]
    fn should_upsert_offline_state_on_first_successful_verification() {
        let checker = OfflineGraceChecker::new_in_memory();
        // 模擬第一次成功的 OPCOS 驗證
        checker
            .record_successful_verification("SERIAL-001")
            .expect("First verification record must succeed");
        let state = checker
            .get_state()
            .expect("State must exist after first verification");
        assert!(
            state.last_verified_at().is_some(),
            "last_verified_at must be set after first successful verification"
        );
    }

    // OOG-002: 6 天 23 小時 elapsed → days_remaining 應該是 0（仍在 grace period），不是 -1
    #[test]
    fn should_compute_days_remaining_accurately_for_sub_day_precision() {
        use crate::land_registry::time_sync::SyncedClock;
        let clock = SyncedClock::with_fixed_utc_time("2026-05-14T12:00:00Z");
        // last_verified = 6 天 23 小時前
        let last_verified_ts = 1747224000i64 - (6 * 86400 + 23 * 3600);
        let config = GraceConfig {
            grace_period_days: 7,
        };
        let checker = OfflineGraceChecker::new_with_clock_and_config(clock, config);

        let days_remaining = checker.compute_days_remaining_from_ts(last_verified_ts);
        // 6d 23h < 7d → 仍在 grace period → days_remaining 應該 >= 0
        assert!(
            days_remaining >= 0,
            "6d 23h elapsed within 7-day grace must be >= 0 days remaining (sub-day precision required)"
        );
    }

    // OOG-003: 4xx auth failure 時不應給予 grace period（只有 network failure 才 grace）
    #[test]
    fn should_not_grant_grace_period_for_4xx_auth_failures() {
        let checker = OfflineGraceChecker::new_with_expired_grace();
        // 模擬 OPCOS 驗證回 401（AuthFailed，不是 network 問題）
        let result = checker.check_with_auth_failed_response();
        assert!(
            matches!(result, Err(LandRegistryError::GracePeriodExpired)),
            "4xx auth failure must not grant grace period; must return GracePeriodExpired"
        );
    }

    // OOG-004: time_sync 初始化必須在 grace period check 之前完成
    #[test]
    fn should_initialize_time_sync_before_grace_period_check() {
        use crate::land_registry::time_sync::TimeSyncModule;
        use std::sync::{
            atomic::{AtomicBool, Ordering},
            Arc,
        };

        let time_sync_initialized = Arc::new(AtomicBool::new(false));
        let ts_flag = Arc::clone(&time_sync_initialized);

        // 建立 time_sync 模組，初始化時設 flag
        let time_sync = TimeSyncModule::new_with_init_hook(move || {
            ts_flag.store(true, Ordering::SeqCst);
        });
        let checker = OfflineGraceChecker::new_with_time_sync(time_sync);

        // 執行 grace check（這會觸發 time_sync 初始化）
        let _ = checker.check_grace_period();

        assert!(
            time_sync_initialized.load(Ordering::SeqCst),
            "time_sync must be initialized BEFORE grace period check"
        );
    }

    // OOG-005: elapsed time < 0（本機時鐘被往後調）→ 視為 0 天 elapsed（仍在 grace）
    #[test]
    fn should_handle_negative_elapsed_time_gracefully() {
        use crate::land_registry::time_sync::SyncedClock;
        let clock = SyncedClock::with_fixed_utc_time("2026-05-14T12:00:00Z");
        // last_verified = 未來時間（本機時鐘被調前 → elapsed < 0）
        let future_ts = 1747224000i64 + 86400; // last_verified 在「未來」
        let config = GraceConfig {
            grace_period_days: 7,
        };
        let checker = OfflineGraceChecker::new_with_clock_and_config(clock, config);

        let days_remaining = checker.compute_days_remaining_from_ts(future_ts);
        // elapsed < 0 → 應視為 0 elapsed → days_remaining = grace_period_days = 7
        assert!(
            days_remaining >= 0,
            "Negative elapsed time must be treated as 0 (still within grace), got {}",
            days_remaining
        );
    }

    // OOG-006: keychain 不可用時（DB 無法讀取），必須回明確錯誤（不是 GracePeriodExpired）
    #[test]
    fn should_handle_keychain_unavailable_during_grace_check() {
        use crate::encryption::KeychainState;
        let broken_keychain = KeychainState::unavailable();
        let checker = OfflineGraceChecker::new_with_keychain(broken_keychain);
        let result = checker.check_grace_period();
        // keychain 不可用 ≠ grace period 過期，必須是 Internal 錯誤
        match result {
            Err(LandRegistryError::Internal { .. }) => { /* correct */ }
            Err(LandRegistryError::GracePeriodExpired) => {
                panic!("Keychain unavailable must NOT be reported as GracePeriodExpired")
            }
            Ok(_) => panic!("Keychain unavailable must return an error"),
            Err(other) => panic!("Unexpected error: {:?}", other),
        }
    }

    // OOG-007: grace_period_days 必須從 config 讀取（不 hardcode）
    #[test]
    fn should_read_grace_period_days_from_config_not_hardcode() {
        use crate::land_registry::time_sync::SyncedClock;
        // config 設定 14 天 grace period
        let config = GraceConfig {
            grace_period_days: 14,
        };
        let clock = SyncedClock::with_fixed_utc_time("2026-05-14T12:00:00Z");
        // last_verified = 13 天前（若 hardcode 7 天，這裡應該 GracePeriodExpired）
        let last_verified = 1747224000i64 - 13 * 86400;
        let checker = OfflineGraceChecker::new_with_clock_and_config(clock, config);

        let result = checker.check_grace_period_from_ts(last_verified);
        // 13 天 < 14 天 grace → 應該還在 grace period 內
        assert!(
            result.is_ok(),
            "13 days elapsed within 14-day grace must be allowed (grace period read from config)"
        );
    }

    // OOG-008: 成功驗證時，若 serial 改變，必須更新 last_verified_serial
    #[test]
    fn should_update_serial_when_serial_changes_on_successful_verification() {
        let checker = OfflineGraceChecker::new_in_memory();
        // 第一次驗證（serial = OLD-001）
        checker
            .record_successful_verification("SERIAL-OLD-001")
            .unwrap();
        // 第二次驗證（serial 改變 = NEW-002）
        checker
            .record_successful_verification("SERIAL-NEW-002")
            .unwrap();

        let state = checker.get_state().expect("State must exist");
        assert_eq!(
            state.last_verified_serial(),
            "SERIAL-NEW-002",
            "last_verified_serial must be updated when serial changes on successful verification"
        );
    }
}
