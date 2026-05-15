/// land_registry 主模組（Phase 2 結構佔位符）
/// Phase 3 實作時在各子模組加入實際代碼
pub mod client;
pub mod cache;
pub mod errors;
pub mod batch;
pub mod field_mapping;
pub mod billing_log;
pub mod apis;
pub mod api_key_storage;
pub mod balance;
pub mod time_sync;
pub mod disk_resilience;
pub mod migration_rollback;
pub mod opcos_offline_grace;

#[cfg(test)]
mod integration_tests {
    //! Stage 3 integration tests for #2a land-registry-foundation.
    //!
    //! 跨模組整合測試：驗證 OPCOS offline grace、time sync、disk resilience
    //! 三個子系統在邊界情境（網路長時間中斷、系統時鐘漂移、磁碟近滿）下
    //! 表現符合 spec.md 的 acceptance criteria。
    //!
    //! 對應 design.md 的 Risks：
    //! - R1: OPCOS 持續離線 → 7 天寬限期過後 lock out
    //! - R2: 系統時鐘被人為調整 → synced_now 仍提供相對單調的時間
    //! - R3: 磁碟空間不足 → check_writable 必須回 DiskFull 而非 panic / 寫到一半

    use crate::land_registry::disk_resilience::{check_writable, DiskGuard};
    use crate::land_registry::errors::LandRegistryError;
    use crate::land_registry::opcos_offline_grace::{GraceConfig, OfflineGraceChecker};
    use crate::land_registry::time_sync::{synced_now, SyncedClock};

    /// 一天的秒數，用於組合測試情境。
    const SECONDS_PER_DAY: i64 = 86_400;

    /// R1：OPCOS 中斷後 7 天寬限期內仍可使用，第 8 天起 lock out。
    ///
    /// 模擬方式：以「現在」為基準，把 last_verified_ts 設成 N 天前。
    /// SyncedClock::with_fixed_offset(0) 表示時鐘與系統一致（offset 0），
    /// 不會凍結時間。Grace 比較看的是「now - last_verified_ts」相對距離。
    #[test]
    fn test_grace_period_offline_7_days() {
        let grace_days = 7;
        let now_ts = chrono::Utc::now().timestamp();

        let make_checker = || {
            OfflineGraceChecker::new_with_clock_and_config(
                SyncedClock::with_fixed_offset(0),
                GraceConfig { grace_period_days: grace_days },
            )
        };

        // Day 0 — 剛驗證完，必通過。
        let day0_ts = now_ts;
        assert!(
            make_checker().check_grace_period_from_ts(day0_ts).is_ok(),
            "Day 0：寬限期內必通過"
        );

        // Day 7 - 1 小時 — 邊界內側，仍應通過（避免 day7 整點測試遇到秒級飄移）。
        let day7_minus_buffer_ts = now_ts - 7 * SECONDS_PER_DAY + 3600;
        assert!(
            make_checker()
                .check_grace_period_from_ts(day7_minus_buffer_ts)
                .is_ok(),
            "Day 7 內側：邊界內必通過（last hour of grace）"
        );

        // Day 8 — 超過 7 天寬限，必 lock out。
        let day8_ts = now_ts - 8 * SECONDS_PER_DAY;
        match make_checker().check_grace_period_from_ts(day8_ts) {
            Err(LandRegistryError::GracePeriodExpired) => {}
            other => panic!("Day 8：必回 GracePeriodExpired，實際得到 {:?}", other),
        }

        // Day 30 — 遠超寬限，必 lock out（確認 trend 而非邊界誤差）。
        let day30_ts = now_ts - 30 * SECONDS_PER_DAY;
        assert!(
            matches!(
                make_checker().check_grace_period_from_ts(day30_ts),
                Err(LandRegistryError::GracePeriodExpired)
            ),
            "Day 30：必 lock out"
        );
    }

    /// R2：系統時鐘被調整 1 年後，SyncedClock 仍能正常運作。
    ///
    /// 關鍵語意：synced_now() 應該回傳「以基準時間為主、加上 offset」的時間，
    /// 而不是直接讀系統時鐘。所以即便 OS clock 被調整，offset 還是有效的。
    /// 兩次連續呼叫的時間差應為非負（不可倒退）。
    #[test]
    fn test_time_skew_resilience() {
        // 模擬系統時鐘往未來跳 1 年。
        let one_year_seconds: i64 = 365 * SECONDS_PER_DAY;
        let clock = SyncedClock::with_fixed_offset(one_year_seconds);

        let t1 = clock.synced_now().timestamp();
        std::thread::sleep(std::time::Duration::from_millis(10));
        let t2 = clock.synced_now().timestamp();

        assert!(
            t2 >= t1,
            "synced_now 不可倒退：t1={}, t2={}",
            t1, t2
        );

        // 模組層級 helper synced_now() 也必須回正常時間（不 panic、不 < 0）。
        let module_now = synced_now().timestamp();
        assert!(module_now > 0, "synced_now() 必為正值，得到 {}", module_now);

        // Grace check 用大 offset 不應該 panic（chrono Duration 在 1 年內安全）。
        // synced_now 因 offset 已往未來 +1 年，而 last_verified 是「現在」
        // → 從 synced clock 看 elapsed > 1 年，必過期。
        let checker = OfflineGraceChecker::new_with_clock_and_config(
            clock,
            GraceConfig { grace_period_days: 7 },
        );
        match checker.check_grace_period_from_ts(module_now) {
            Err(LandRegistryError::GracePeriodExpired) => {}
            other => panic!(
                "時鐘跳 1 年後 grace 必過期（elapsed > 7 天），得到 {:?}",
                other
            ),
        }

        // 反向：未來 1 年前驗證、現在時鐘正常（offset 0）→ elapsed = -1 年（被 clamp 為 0）
        // 不應該因「負時間」panic，必通過 grace check。
        let normal_clock = SyncedClock::with_fixed_offset(0);
        let normal_checker = OfflineGraceChecker::new_with_clock_and_config(
            normal_clock,
            GraceConfig { grace_period_days: 7 },
        );
        let future_ts = synced_now().timestamp() + one_year_seconds;
        assert!(
            normal_checker.check_grace_period_from_ts(future_ts).is_ok(),
            "last_verified 落在未來（時鐘倒退情境）→ elapsed clamp 為 0，不應 panic 或過期"
        );
    }

    /// R3：磁碟近滿時 check_writable 必須回 DiskFull，不可 panic。
    ///
    /// 方式 1：用 DiskGuard::simulate_full_disk()（available = 0）模擬最極端情境。
    /// 方式 2：用 check_writable 對真實檔系跑（給超大 required_bytes 模擬不足）。
    #[test]
    fn test_disk_full_graceful() {
        // 方式 1：DiskGuard 完全沒空間。
        let guard = DiskGuard::simulate_full_disk();
        match guard.check_before_write(10 * 1024 * 1024) {
            Err(LandRegistryError::DiskFull {
                available_bytes,
                required_bytes,
            }) => {
                assert_eq!(available_bytes, 0, "available 應為 0");
                assert_eq!(required_bytes, 10 * 1024 * 1024, "required 應原樣回傳");
            }
            other => panic!("simulate_full_disk 必回 DiskFull，得到 {:?}", other),
        }

        // 方式 2：對真實 /tmp 路徑要求 16 EB（u64 接近上限），必不足。
        let tmp = std::env::temp_dir();
        // 16 EB = u64::MAX / 1.15 ≒ 不可能滿足，但夠小不會 overflow。
        let unreasonable_bytes: u64 = u64::MAX / 2;
        match check_writable(&tmp, unreasonable_bytes) {
            Err(LandRegistryError::DiskFull { .. }) => {}
            Err(LandRegistryError::Internal { .. }) => {
                // 真實檔系查詢失敗也算 graceful（沒 panic）。
            }
            other => panic!(
                "check_writable 對不合理大小必回 DiskFull/Internal，得到 {:?}",
                other
            ),
        }

        // 邊界：min_bytes = 0 應回 Internal error，不可 silently pass。
        match check_writable(&tmp, 0) {
            Err(LandRegistryError::Internal { .. }) => {}
            other => panic!("min_bytes=0 必回 Internal error，得到 {:?}", other),
        }
    }
}
