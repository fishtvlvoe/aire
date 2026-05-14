/// Phase 2 紅燈測試 — land-registry-batch
/// 對應 spec: land-registry-batch，失敗點 LRB-001 ~ LRB-009
/// import 尚未實作的 batch 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::batch::{BatchDispatcher, BatchItem, BatchResult};
    use crate::land_registry::errors::LandRegistryError;

    // LRB-001: 50 個 items，chunk_size = 25，必須 dispatch 恰好 2 次 API call
    #[test]
    fn should_dispatch_exactly_two_calls_for_50_items() {
        let items: Vec<BatchItem> = (0..50)
            .map(|i| BatchItem::new(format!("BA-0001-{:08}", i)))
            .collect();
        let dispatcher = BatchDispatcher::new_with_chunk_size(25);
        let api_call_count = dispatcher.count_api_calls_for(&items);
        assert_eq!(api_call_count, 2, "50 items / chunk_size 25 = exactly 2 API calls");
    }

    // LRB-002: 餘數 chunk（< 25 items）必須正確發送（不被丟棄）
    #[test]
    fn should_send_remainder_chunk_with_fewer_than_25_items() {
        // 27 items: chunk 1 = 25, chunk 2 = 2（餘數）
        let items: Vec<BatchItem> = (0..27)
            .map(|i| BatchItem::new(format!("BA-0002-{:08}", i)))
            .collect();
        let dispatcher = BatchDispatcher::new_with_chunk_size(25);
        let results = dispatcher.dispatch_all_sync(&items).expect("Dispatch must not fail");
        assert_eq!(results.len(), 27, "All 27 items must have results (remainder chunk not dropped)");
    }

    // LRB-003: chunk 回傳順序不同時，結果必須按輸入順序排列
    #[test]
    fn should_preserve_input_order_when_chunks_return_out_of_order() {
        let items: Vec<BatchItem> = vec![
            BatchItem::new("BA-FIRST-00000001"),
            BatchItem::new("BA-SECOND-00000001"),
            BatchItem::new("BA-THIRD-00000001"),
        ];
        let dispatcher = BatchDispatcher::new_with_reverse_chunk_order(); // mock: chunk 2 先回
        let results = dispatcher.dispatch_all_sync(&items).expect("Dispatch must not fail");
        // 結果順序必須與輸入一致
        assert_eq!(results[0].parcel_id(), "BA-FIRST-00000001");
        assert_eq!(results[1].parcel_id(), "BA-SECOND-00000001");
        assert_eq!(results[2].parcel_id(), "BA-THIRD-00000001");
    }

    // LRB-004: chunk 整體失敗時，該 chunk 內所有 items 都標記為 Err
    #[test]
    fn should_mark_all_items_in_failed_chunk_as_err() {
        let items: Vec<BatchItem> = (0..3)
            .map(|i| BatchItem::new(format!("BA-ERR-{:08}", i)))
            .collect();
        let dispatcher = BatchDispatcher::new_with_always_failing_api();
        let results = dispatcher.dispatch_all_sync(&items).expect("Dispatch wrapper must not panic");
        for result in &results {
            assert!(
                result.is_err(),
                "All items in a failed chunk must be marked as Err: {:?}",
                result
            );
        }
    }

    // LRB-005: 空輸入 → 回傳空 Vec（不 panic，不 API call）
    #[test]
    fn should_return_empty_vec_for_empty_input() {
        let items: Vec<BatchItem> = vec![];
        let dispatcher = BatchDispatcher::new_with_chunk_size(25);
        let results = dispatcher.dispatch_all_sync(&items).expect("Empty input must not fail");
        assert!(results.is_empty(), "Empty input must produce empty results");
        let api_calls = dispatcher.api_call_count();
        assert_eq!(api_calls, 0, "Empty input must not trigger any API call");
    }

    // LRB-006: 已 cache 的 item 不應該發出 API call（cache hit = skip dispatch）
    #[test]
    fn should_skip_cached_items_in_batch_dispatch() {
        use crate::land_registry::cache::LandRegistryCache;
        let cache = LandRegistryCache::new_in_memory();
        let cached_parcel = "BA-CACHED-00010001";
        let dummy = serde_json::json!({"status": "cached"});
        cache.store(cached_parcel, "API_001", "2026-05-14", &dummy).unwrap();

        let items = vec![
            BatchItem::new(cached_parcel),
            BatchItem::new("BA-NOCACHE-00010001"),
        ];
        let dispatcher = BatchDispatcher::new_with_cache(cache);
        let api_calls = dispatcher.count_api_calls_for(&items);
        assert_eq!(api_calls, 1, "Cached item must be skipped; only 1 API call for non-cached item");
    }

    // LRB-007: batch 中有重複地號時，只 dispatch 一次，結果共享給兩個 item
    #[test]
    fn should_handle_duplicate_parcel_ids_in_batch() {
        let items = vec![
            BatchItem::new("BA-DUP-00010001"),
            BatchItem::new("BA-OTHER-00010001"),
            BatchItem::new("BA-DUP-00010001"), // 重複
        ];
        let dispatcher = BatchDispatcher::new_with_chunk_size(25);
        let api_calls = dispatcher.count_unique_parcel_api_calls_for(&items);
        assert_eq!(api_calls, 2, "Duplicate parcel must be deduplicated before dispatch");
        let results = dispatcher.dispatch_all_sync(&items).expect("Dispatch must not fail");
        assert_eq!(results.len(), 3, "Results must have same count as input (including duplicates)");
    }

    // LRB-008: 並行 chunk dispatch 數量必須 <= 設定的 max_concurrent
    #[test]
    fn should_limit_concurrent_chunk_dispatch_to_configured_max() {
        let items: Vec<BatchItem> = (0..100)
            .map(|i| BatchItem::new(format!("BA-CONC-{:08}", i)))
            .collect();
        let max_concurrent = 3;
        let dispatcher = BatchDispatcher::new_with_max_concurrent(25, max_concurrent);
        let peak_concurrent = dispatcher.measure_peak_concurrent_calls(&items);
        assert!(
            peak_concurrent <= max_concurrent,
            "Peak concurrent chunk calls ({}) must not exceed max_concurrent ({})",
            peak_concurrent,
            max_concurrent
        );
    }

    // LRB-009: 單 item batch 行為必須與多 item batch 相同（不走特殊 fast-path）
    #[test]
    fn should_handle_single_item_batch_identically_to_multi_item() {
        let single_item = vec![BatchItem::new("BA-SINGLE-00010001")];
        let multi_items: Vec<BatchItem> = (0..5)
            .map(|i| BatchItem::new(format!("BA-MULTI-{:08}", i)))
            .collect();
        let dispatcher = BatchDispatcher::new_with_chunk_size(25);

        let single_results = dispatcher.dispatch_all_sync(&single_item).expect("Single item must not fail");
        let multi_results = dispatcher.dispatch_all_sync(&multi_items).expect("Multi item must not fail");

        // 單 item 回傳 1 個結果（不是空 Vec 或 panic）
        assert_eq!(single_results.len(), 1, "Single item batch must return exactly 1 result");
        // API 呼叫行為一致（都走 chunk dispatch 路徑）
        assert_eq!(
            single_results[0].is_from_chunk_dispatch(),
            multi_results[0].is_from_chunk_dispatch(),
            "Single item must use same dispatch path as multi-item batch"
        );
    }
}
