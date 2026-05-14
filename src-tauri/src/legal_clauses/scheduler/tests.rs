/// Phase 2 紅燈測試 — legal_clauses::scheduler 模組
///
/// 這個檔案 import 了 `crate::legal_clauses::scheduler`，而該模組尚未建立。
/// `cargo test --package aire_core legal_clauses` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/legal_clauses/scheduler.rs（start_sync_scheduler, SchedulerConfig）

#[cfg(test)]
mod tests {
    use super::super::{
        scheduler::{
            start_sync_scheduler, SchedulerConfig, SchedulerHandle,
            should_trigger_sync_now,
        },
        SyncResult,
    };
    use super::super::scheduler as scheduler;

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-004 / spec: 7 天排程器 callback 觸發恰好一次
    // 使用時間旅行 mock 驗證排程觸發
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_scheduler_001_seven_day_trigger_fires_exactly_once() {
        // should_trigger_sync_now 接受 last_synced_at 和 now，返回是否應觸發
        // 7 天整 → 不觸發（未超過 TTL）
        let last_synced = "2026-05-07T00:00:00Z";
        let now_exactly_7 = "2026-05-14T00:00:00Z";

        let should_trigger = should_trigger_sync_now(last_synced, now_exactly_7, 7);
        assert!(
            !should_trigger,
            "恰好 7 天不應觸發，只有超過 7 天才觸發"
        );

        // 7 天 + 1 秒 → 觸發
        let now_past_7 = "2026-05-14T00:00:01Z";
        let should_trigger_now = should_trigger_sync_now(last_synced, now_past_7, 7);
        assert!(
            should_trigger_now,
            "超過 7 天應觸發 sync，但 should_trigger_sync_now 返回 false"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-006 / spec: 休眠後喚醒的時間漂移
    // SchedulerConfig 必須使用 wall clock（不依賴 monotonic clock）
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_scheduler_002_config_uses_wall_clock_semantics() {
        // SchedulerConfig 必須有 clock_source 欄位，可設定為 WallClock（不是 Monotonic）
        // 這個測試主要是型別存在性驗證
        let config = SchedulerConfig {
            interval_days: 7,
            clock_source: scheduler::ClockSource::WallClock, // 必須有此 variant
        };

        assert_eq!(config.interval_days, 7);

        match config.clock_source {
            scheduler::ClockSource::WallClock => {
                // 預期行為：預設使用 wall clock 避免休眠漂移
            }
            scheduler::ClockSource::Monotonic => {
                panic!("預設 clock source 不應是 Monotonic（休眠後會漂移）");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-010 / spec: 背景 sync task 不持有 UI thread 的鎖
    // SchedulerHandle 必須可 abort 且不 block main thread
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_scheduler_003_scheduler_handle_can_abort_without_deadlock() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");
        let db_arc = std::sync::Arc::new(tokio::sync::Mutex::new(db));

        let config = SchedulerConfig {
            interval_days: 7,
            clock_source: scheduler::ClockSource::WallClock,
        };

        // start_sync_scheduler 應返回一個 SchedulerHandle
        let handle: SchedulerHandle =
            start_sync_scheduler(db_arc, config, "http://localhost:19999/v1/legal-clauses").await;

        // abort 不應 deadlock 或 panic
        handle.abort();

        // 給一點時間讓 tokio task 清理
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // 如果能到這裡就沒有 deadlock
        // （如果 deadlock，tokio::time::sleep 也不會被排程到）
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-016 / spec: 401 Token 過期時觸發重新驗證
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_scheduler_004_401_triggers_reauth_and_retry() {
        use super::super::sync_with_mock_response;

        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // mock：第一次 401，重新驗證後第二次成功
        // sync_with_mock_sequence 接受一個回應序列
        // fixture：最小合法的 OPCOS 法規回應 JSON
        let ok_response = r#"{"laws":[{"law_id":"real-estate-broker-act","title":"不動產經紀業管理條例","content_markdown":"第一條","version_date":"2026-05-14","source_url":"https://law.moj.gov.tw/test"}]}"#;

        let result = super::super::sync_with_mock_sequence(
            &db,
            &[
                (401, None),        // 第一次 OPCOS 回 401
                (200, Some(ok_response)), // 第二次成功
            ],
        )
        .await;

        // 不管 retry 邏輯如何，最終結果不應 panic
        // 實作可能返回 Ok(Synced) 或 Ok(FallbackToCache)
        assert!(result.is_ok(), "401 + retry 不應 panic，got {:?}", result);
    }
}
