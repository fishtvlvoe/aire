/// Phase 2 紅燈測試 — legal_clauses::sync 模組
///
/// 這個檔案 import 了 `crate::legal_clauses::sync`，而該模組尚未建立。
/// `cargo test --package aire_core legal_clauses` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/legal_clauses/mod.rs
/// - src-tauri/src/legal_clauses/sync.rs（sync_legal_clauses, SyncResult, LegalClausesError）
/// - src-tauri/src/legal_clauses/models.rs（LegalClause, SyncResult enum）

#[cfg(test)]
mod tests {
    // ❌ 這些模組還不存在 — 紅燈起點
    use super::super::{
        sync_legal_clauses, get_legal_clause,
        SyncResult, LegalClause, LegalClausesError,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-001 / spec: First-run sync populates all three laws
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_001_first_run_sync_populates_three_laws() {
        // mock OPCOS endpoint 回傳三條法規
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");
        let mock_endpoint = "http://localhost:19999/v1/legal-clauses"; // mock server

        let result = sync_legal_clauses(&db, mock_endpoint).await;

        // 不存在的模組讓編譯失敗 = 紅燈；若編譯過，assert 應對實作行為
        assert!(result.is_ok(), "首次 sync 應成功，got {:?}", result);

        // 確認三條 law_id 都存在
        let expected_ids = vec![
            "consumer-protection-relevant",
            "fair-trade-relevant",
            "real-estate-broker-act",
        ];
        for law_id in expected_ids {
            let clause = get_legal_clause(&db, law_id);
            assert!(
                clause.is_ok(),
                "law_id '{}' 應存在於 cache，但 get_legal_clause 回傳 {:?}",
                law_id,
                clause
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-002 / spec: Each law row has required metadata（ISO 8601 版本日期）
    // 對應失敗矩陣 LCS-002：version_date 格式非 ISO 8601
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_002_law_version_date_is_iso8601() {
        // 建立一個假的 LegalClause，version_date 為台灣民國年格式，應被拒絕或轉換
        let clause = LegalClause {
            law_id: "real-estate-broker-act".to_string(),
            title: "不動產經紀業管理條例".to_string(),
            content_markdown: "條文內容".to_string(),
            version_date: "113-05-10".to_string(), // 民國年 ❌ 不合法
            fetched_at: "2026-05-14T00:00:00Z".to_string(),
            source_url: "https://law.moj.gov.tw/test".to_string(),
        };

        // version_date 必須符合 ISO 8601 格式 YYYY-MM-DD
        let err = super::super::validate_legal_clause(&clause);
        assert!(
            err.is_err(),
            "民國年 '113-05-10' 應被 validate_legal_clause 拒絕（非嚴格 YYYY-MM-DD）"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-003 / spec: source_url 必須是 HTTPS URL
    // 對應失敗矩陣 LCS-003：source_url 為空字串
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_003_source_url_must_be_https() {
        // validate_legal_clause 應拒絕空字串或 http:// 的 source_url
        use super::super::validate_legal_clause;

        let invalid = LegalClause {
            law_id: "test-law".to_string(),
            title: "測試法規".to_string(),
            content_markdown: "內容".to_string(),
            version_date: "2026-05-10".to_string(),
            fetched_at: "2026-05-14T00:00:00Z".to_string(),
            source_url: "".to_string(), // ❌ 空字串
        };

        let result = validate_legal_clause(&invalid);
        assert!(
            result.is_err(),
            "空 source_url 應被 validate 拒絕，但通過了"
        );

        let invalid_http = LegalClause {
            source_url: "http://law.moj.gov.tw/test".to_string(), // ❌ http 不是 https
            ..invalid
        };
        let result2 = validate_legal_clause(&invalid_http);
        assert!(
            result2.is_err(),
            "http:// source_url 應被拒絕（需 HTTPS），但通過了"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-004 / spec: 版本比較應用語意日期比較而非字串字典序
    // 對應失敗矩陣 LCS-004：跨月邊界比較錯誤
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_004_version_comparison_uses_date_semantics_not_lexical() {
        use super::super::is_remote_version_newer;

        // '2026-10-01' > '2026-09-10' 在語意上正確但字典序錯誤（'1' < '9'）
        let local = "2026-09-10";
        let remote = "2026-10-01";

        let newer = is_remote_version_newer(local, remote);
        assert!(
            newer,
            "2026-10-01 應比 2026-09-10 新，但 is_remote_version_newer 返回 false（字典序 bug）"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-007 / spec: 空 cache 首次失敗時返回 EmptyCacheNoNetwork
    // 對應失敗矩陣 LCS-007：MAX(fetched_at) 為 null 時除零或 panic
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_007_empty_cache_no_network_returns_correct_variant() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");
        // 不 setup 任何法規 rows → table 應是空的

        // mock 一個無法連線的 endpoint
        let unreachable_endpoint = "http://localhost:19998/v1/legal-clauses";

        let result = sync_legal_clauses(&db, unreachable_endpoint).await;

        assert!(result.is_ok(), "sync 失敗不應 panic，應返回 Ok(SyncResult::...)");

        match result.unwrap() {
            SyncResult::EmptyCacheNoNetwork => {
                // 預期行為
            }
            other => panic!(
                "空 cache + 無網路應返回 EmptyCacheNoNetwork，但得到 {:?}",
                other
            ),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-008 / spec: HTTP 5xx 應觸發 fallback
    // 對應失敗矩陣 LCS-008：5xx 未觸發 fallback
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_008_http_5xx_triggers_fallback_to_cache() {
        use super::super::sync_with_mock_response;

        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");
        // 預先放一條 law 進 cache
        super::super::seed_law_clause(&db, "real-estate-broker-act", "2026-01-01")
            .expect("seed failed");

        // mock OPCOS 回 503
        let result = sync_with_mock_response(&db, 503, None).await;

        assert!(result.is_ok(), "5xx 不應 panic");
        match result.unwrap() {
            SyncResult::FallbackToCache { .. } => {
                // 預期行為
            }
            other => panic!(
                "5xx 應觸發 FallbackToCache，但得到 {:?}",
                other
            ),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-012 / spec: get_legal_clause 找不到時返回 LawNotFound
    // 對應失敗矩陣 LCS-012：Tauri IPC enum 序列化格式
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn lcs_012_get_missing_law_returns_law_not_found_error() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        let result = get_legal_clause(&db, "non-existent-law-id");

        assert!(result.is_err(), "不存在的 law_id 應返回 Err");

        match result.unwrap_err() {
            LegalClausesError::LawNotFound => {
                // 預期行為
            }
            other => panic!(
                "應返回 LegalClausesError::LawNotFound，但得到 {:?}",
                other
            ),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LCS-014 / spec: Partial sync preserves successful rows
    // 對應失敗矩陣 LCS-014：partial failure 不應回滾成功的 rows
    // ─────────────────────────────────────────────────────────────────────────
    #[tokio::test]
    async fn lcs_014_partial_sync_preserves_successful_rows() {
        use super::super::sync_partial_with_failure_at;

        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // 第 1 條成功，第 2 條失敗（網路中斷）
        let result = sync_partial_with_failure_at(&db, 1).await;

        assert!(result.is_ok(), "partial sync 不應 panic");

        // 第 1 條（real-estate-broker-act）應留在 DB
        let first = get_legal_clause(&db, "real-estate-broker-act");
        assert!(
            first.is_ok(),
            "第 1 條 sync 成功後即使第 2 條失敗，DB 仍應保留 real-estate-broker-act"
        );

        // 第 2 條（consumer-protection-relevant）不應存在
        let second = get_legal_clause(&db, "consumer-protection-relevant");
        assert!(
            second.is_err(),
            "失敗的 consumer-protection-relevant 不應留在 DB"
        );
    }
}
