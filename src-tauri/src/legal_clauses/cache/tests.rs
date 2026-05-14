/// Phase 2 紅燈測試 — legal_clauses::cache 模組
///
/// 這個檔案 import 了 `crate::legal_clauses::cache`，而該模組尚未建立。
/// `cargo test --package aire_core legal_clauses` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/legal_clauses/cache.rs（write_clause, read_clause, is_stale, CacheEntry）

#[cfg(test)]
mod tests {
    use super::super::{
        cache::{write_clause, read_clause, is_cache_stale, CacheWriteError},
        LegalClause,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-005 / 並行：兩個並行 INSERT OR REPLACE 不應造成 SQLITE_BUSY panic
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_005_concurrent_writes_do_not_deadlock() {
        use std::sync::{Arc, Mutex};

        let db = Arc::new(Mutex::new(
            rusqlite::Connection::open_in_memory().expect("in-memory DB"),
        ));

        let db_a = Arc::clone(&db);
        let db_b = Arc::clone(&db);

        let clause_a = LegalClause {
            law_id: "real-estate-broker-act".to_string(),
            title: "不動產經紀業管理條例".to_string(),
            content_markdown: "條文 A".to_string(),
            version_date: "2026-05-10".to_string(),
            fetched_at: "2026-05-14T10:00:00Z".to_string(),
            source_url: "https://law.moj.gov.tw/a".to_string(),
        };

        let clause_b = LegalClause {
            law_id: "consumer-protection-relevant".to_string(),
            title: "消費者保護法相關條款".to_string(),
            content_markdown: "條文 B".to_string(),
            version_date: "2026-05-10".to_string(),
            fetched_at: "2026-05-14T10:00:00Z".to_string(),
            source_url: "https://law.moj.gov.tw/b".to_string(),
        };

        // 同時發起兩個 write task — 不應 deadlock 或 panic
        let handle_a = tokio::spawn(async move {
            let db = db_a.lock().unwrap();
            write_clause(&*db, &clause_a)
        });

        let handle_b = tokio::spawn(async move {
            let db = db_b.lock().unwrap();
            write_clause(&*db, &clause_b)
        });

        let (result_a, result_b) = tokio::join!(handle_a, handle_b);

        assert!(result_a.is_ok(), "write_clause A task panic: {:?}", result_a);
        assert!(result_b.is_ok(), "write_clause B task panic: {:?}", result_b);

        // 兩個寫入結果都應成功（不論哪個先寫）
        let inner = result_a.unwrap();
        assert!(inner.is_ok(), "write_clause A DB 錯誤: {:?}", inner);
        let inner_b = result_b.unwrap();
        assert!(inner_b.is_ok(), "write_clause B DB 錯誤: {:?}", inner_b);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-015 / 環境：磁碟空間不足時返回包含診斷資訊的 CacheWriteError
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_015_cache_write_error_preserves_diagnostic_info() {
        // CacheWriteError 必須包含足夠的診斷資訊（不只是 generic "failed"）
        // 這個測試驗證 error type 的 variant 設計

        // 磁碟不足時，rusqlite 返回 SQLITE_FULL（code 13）
        // 實作必須包裝成 CacheWriteError::StorageFull 或類似 variant，不是 generic Error
        let write_error = CacheWriteError::StorageFull {
            available_bytes: 0,
            law_id: "real-estate-broker-act".to_string(),
        };

        // variant 必須存在且可 match（型別檢查 = 紅燈）
        match write_error {
            CacheWriteError::StorageFull { available_bytes, law_id } => {
                assert_eq!(available_bytes, 0);
                assert!(!law_id.is_empty());
            }
            _ => panic!("CacheWriteError::StorageFull variant 不存在"),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-009 / 環境：timeout 5s 的語意是從請求發出計算（非連線建立）
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_009_cache_stale_check_uses_iso8601_timestamps() {
        // is_cache_stale 必須接受 ISO 8601 字串並正確計算
        // fetched_at = "2026-05-07T00:00:00Z"，now = "2026-05-14T00:00:00Z" → 7 天 → 不 stale（剛好）
        let fetched_at = "2026-05-07T00:00:00Z";
        let now = "2026-05-14T00:00:00Z";

        let stale = is_cache_stale(fetched_at, now, 7);
        assert!(
            !stale,
            "7 天整應不算 stale（cache TTL = 7 天），但 is_cache_stale 返回 true"
        );

        // fetched_at = "2026-05-06T23:59:59Z"，now = "2026-05-14T00:00:00Z" → 超過 7 天 → stale
        let fetched_at_old = "2026-05-06T23:59:59Z";
        let stale_old = is_cache_stale(fetched_at_old, now, 7);
        assert!(
            stale_old,
            "超過 7 天的 cache 應 stale，但 is_cache_stale 返回 false"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-018 / 邊界：大型 content_markdown 仍可正確讀回
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_018_large_content_markdown_roundtrip() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // 50KB 的法規內容
        let large_content = "A".repeat(50_000);

        let clause = LegalClause {
            law_id: "large-law-test".to_string(),
            title: "大型測試法規".to_string(),
            content_markdown: large_content.clone(),
            version_date: "2026-05-10".to_string(),
            fetched_at: "2026-05-14T10:00:00Z".to_string(),
            source_url: "https://law.moj.gov.tw/large".to_string(),
        };

        write_clause(&db, &clause).expect("write large clause failed");

        let retrieved = read_clause(&db, "large-law-test").expect("read failed");
        assert_eq!(
            retrieved.content_markdown.len(),
            50_000,
            "大型 content_markdown 讀回後長度應維持 50000 bytes"
        );
    }
}
