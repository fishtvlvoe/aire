/// Phase 2 紅燈測試 — land-registry-cache
/// 對應 spec: land-registry-cache，失敗點 LCC-001 ~ LCC-011
/// import 尚未實作的模組路徑 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::cache::{
        generate_cache_key, CacheEntry, CacheKey, LandRegistryCache,
    };
    use crate::land_registry::errors::LandRegistryError;
    use serde_json::Value;

    // LCC-001: parcel_id 格式不統一時，cache key 必須 normalize（大小寫、分隔符號）
    #[test]
    fn should_normalize_parcel_id_before_cache_key_generation() {
        let key1 = generate_cache_key("BA-0001-00010001", "API_001", "2026-05-14");
        let key2 = generate_cache_key("ba-0001-00010001", "API_001", "2026-05-14");
        let key3 = generate_cache_key("BA000100010001", "API_001", "2026-05-14");
        // 三種格式代表同一地號，cache key 必須相同
        assert_eq!(
            key1, key2,
            "Cache key must be normalized: uppercase == lowercase"
        );
        assert_eq!(
            key1, key3,
            "Cache key must be normalized: with/without separators"
        );
    }

    // LCC-002: query_date 必須用校正後的 synced_now() 而非本機時鐘
    #[test]
    fn should_use_synced_now_for_query_date_not_local_clock() {
        use crate::land_registry::time_sync::SyncedClock;
        // 建立一個偏差 +8h 的 mock clock（模擬 NTP 校正）
        let mock_clock = SyncedClock::with_fixed_offset(8 * 3600);
        let cache = LandRegistryCache::new_with_clock(mock_clock.clone());
        let entry_date = cache.current_query_date();
        let synced_date = mock_clock.synced_date();
        assert_eq!(
            entry_date, synced_date,
            "query_date must use synced_now().date(), not system local date"
        );
    }

    // LCC-003: 含 null 欄位的 payload 序列化/反序列化後 null 必須保留
    #[test]
    fn should_preserve_null_fields_in_cached_payload() {
        let payload: Value = serde_json::json!({
            "parcel_id": "BA-0001-00010001",
            "owner_name": null,
            "area_sqm": 100.5
        });
        let cache = LandRegistryCache::new_in_memory();
        cache
            .store("BA-0001-00010001", "API_001", "2026-05-14", &payload)
            .expect("Cache store must succeed");
        let retrieved = cache
            .get("BA-0001-00010001", "API_001", "2026-05-14")
            .expect("Cache get must succeed");
        assert_eq!(
            retrieved["owner_name"],
            Value::Null,
            "Null field must be preserved after cache round-trip, not treated as missing key"
        );
    }

    // LCC-004: api_id = None 時，invalidate 必須清除該地號的所有 API entry
    #[test]
    fn should_invalidate_all_api_entries_for_parcel_when_api_id_is_none() {
        let cache = LandRegistryCache::new_in_memory();
        let parcel = "BA-0001-00010001";
        let dummy = serde_json::json!({"x": 1});
        cache
            .store(parcel, "API_001", "2026-05-14", &dummy)
            .unwrap();
        cache
            .store(parcel, "API_002", "2026-05-14", &dummy)
            .unwrap();
        cache
            .store(parcel, "API_003", "2026-05-14", &dummy)
            .unwrap();

        // api_id = None 代表刪除整個地號的所有 API cache entry
        cache
            .invalidate(parcel, None)
            .expect("Invalidate must succeed");
        let remaining = cache.count_entries(parcel);
        assert_eq!(
            remaining, 0,
            "All API entries for parcel must be deleted when api_id = None"
        );
    }

    // LCC-005: 磁碟將滿時 SQLite WAL 寫入失敗，必須 graceful 包成 DiskFull（不 panic）
    #[test]
    fn should_handle_sqlite_wal_space_exhaustion_gracefully() {
        use crate::land_registry::disk_resilience::DiskGuard;
        // 模擬磁碟可用空間 = 0
        let tight_guard = DiskGuard::simulate_full_disk();
        let cache = LandRegistryCache::new_with_disk_guard(tight_guard);
        let dummy = serde_json::json!({"x": 1});
        let result = cache.store("BA-0001-00010001", "API_001", "2026-05-14", &dummy);
        assert!(
            matches!(result, Err(LandRegistryError::DiskFull { .. })),
            "WAL space exhaustion must surface as DiskFull, not panic"
        );
    }

    // LCC-006: DB 加密初始化失敗（keychain 不可用），cache 必須回 Internal error
    #[test]
    fn should_surface_encryption_init_failure_as_internal_error() {
        use crate::encryption::KeychainState;
        let broken_keychain = KeychainState::unavailable();
        let result = LandRegistryCache::new_with_keychain(broken_keychain);
        assert!(
            matches!(result, Err(LandRegistryError::Internal { .. })),
            "Encryption init failure must surface as Internal error, not propagate raw SQLITE_NOTADB"
        );
    }

    // LCC-007: 並行寫入相同 key 必須 UPSERT 成功或回 Internal（不 panic）
    #[test]
    fn should_handle_concurrent_cache_writes_for_same_key() {
        use std::sync::Arc;
        let cache = Arc::new(LandRegistryCache::new_in_memory());
        let dummy = serde_json::json!({"chunk": 1});
        let dummy2 = serde_json::json!({"chunk": 2});
        let c1 = Arc::clone(&cache);
        let c2 = Arc::clone(&cache);
        // 並行寫入相同 parcel_id + query_date + api_id
        let t1 = std::thread::spawn(move || {
            c1.store("BA-0001-00010001", "API_001", "2026-05-14", &dummy)
        });
        let t2 = std::thread::spawn(move || {
            c2.store("BA-0001-00010001", "API_001", "2026-05-14", &dummy2)
        });
        let r1 = t1.join().expect("Thread 1 must not panic");
        let r2 = t2.join().expect("Thread 2 must not panic");
        // 至少一個成功（UPSERT），或兩個都回 Internal（可接受）；不允許 panic
        assert!(
            r1.is_ok() || matches!(r1, Err(LandRegistryError::Internal { .. })),
            "Concurrent write result 1 must be Ok or Internal, got {:?}",
            r1
        );
        assert!(
            r2.is_ok() || matches!(r2, Err(LandRegistryError::Internal { .. })),
            "Concurrent write result 2 must be Ok or Internal, got {:?}",
            r2
        );
    }

    // LCC-008: invalidate 後並行的 get_or_fetch 必須觸發 upstream 抓取（cache miss）
    #[test]
    fn should_enforce_cache_miss_after_invalidate_under_concurrency() {
        use std::sync::{
            atomic::{AtomicUsize, Ordering},
            Arc,
        };
        let cache = Arc::new(LandRegistryCache::new_in_memory());
        let fetch_count = Arc::new(AtomicUsize::new(0));
        let dummy = serde_json::json!({"x": 1});
        let parcel = "BA-0001-00010001";

        // 先寫入 cache
        cache
            .store(parcel, "API_001", "2026-05-14", &dummy)
            .unwrap();
        // invalidate
        cache.invalidate(parcel, Some("API_001")).unwrap();

        let c = Arc::clone(&cache);
        let fc = Arc::clone(&fetch_count);
        // get_or_fetch 必須觸發 upstream（因為已 invalidate）
        let _ = c.get_or_fetch(parcel, "API_001", "2026-05-14", || {
            fc.fetch_add(1, Ordering::SeqCst);
            Ok(dummy.clone())
        });
        assert!(
            fetch_count.load(Ordering::SeqCst) >= 1,
            "After invalidate, get_or_fetch must call upstream at least once"
        );
    }

    // LCC-009: 前一天的 cache entry 必須視為 cache miss（當天 query_date 不同）
    #[test]
    fn should_treat_entries_from_previous_day_as_cache_miss() {
        let cache = LandRegistryCache::new_in_memory();
        let dummy = serde_json::json!({"x": 1});
        // 昨天寫入
        cache
            .store("BA-0001-00010001", "API_001", "2026-05-13", &dummy)
            .unwrap();
        // 今天查詢
        let result = cache.get("BA-0001-00010001", "API_001", "2026-05-14");
        assert!(
            result.is_none(),
            "Entry from previous day must be treated as cache miss"
        );
    }

    // LCC-010: 磁碟空間恢復後，cache 寫入必須重試成功
    #[test]
    fn should_retry_cache_write_after_disk_space_recovered() {
        use crate::land_registry::disk_resilience::DiskGuard;
        let mut guard = DiskGuard::simulate_full_disk();
        let cache = LandRegistryCache::new_with_disk_guard(guard.clone());
        let dummy = serde_json::json!({"x": 1});
        // 第一次失敗（磁碟滿）
        let r1 = cache.store("BA-0001-00010001", "API_001", "2026-05-14", &dummy);
        assert!(r1.is_err(), "First write must fail when disk is full");
        // 模擬磁碟空間釋放
        guard.simulate_space_freed(10 * 1024 * 1024);
        // 第二次重試成功
        let r2 = cache.store("BA-0001-00010001", "API_001", "2026-05-14", &dummy);
        assert!(r2.is_ok(), "Retry must succeed after disk space recovered");
    }

    // LCC-011: 並行 cache miss 場景必須有 mutex / db lock 防止 double-fetch
    #[test]
    fn should_use_database_lock_or_mutex_to_prevent_double_fetch() {
        use std::sync::{
            atomic::{AtomicUsize, Ordering},
            Arc,
        };
        let cache = Arc::new(LandRegistryCache::new_in_memory());
        let fetch_count = Arc::new(AtomicUsize::new(0));
        let dummy = serde_json::json!({"x": 1});

        // 同時發出 N=5 個 get_or_fetch，全部 cache miss
        let handles: Vec<_> = (0..5)
            .map(|_| {
                let c = Arc::clone(&cache);
                let fc = Arc::clone(&fetch_count);
                let d = dummy.clone();
                std::thread::spawn(move || {
                    c.get_or_fetch("BA-0001-00010001", "API_001", "2026-05-14", || {
                        fc.fetch_add(1, Ordering::SeqCst);
                        Ok(d)
                    })
                })
            })
            .collect();
        for h in handles {
            h.join().expect("Thread must not panic");
        }

        // 有 lock 機制時，upstream 只應該被呼叫 1 次
        assert_eq!(
            fetch_count.load(Ordering::SeqCst),
            1,
            "With mutex/db-lock, upstream fetch must be called exactly once despite concurrent misses"
        );
    }
}
