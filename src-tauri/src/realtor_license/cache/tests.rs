/// Phase 2 紅燈測試 — realtor_license::cache 模組
///
/// 這個檔案 import 了 `crate::realtor_license::cache`，而該模組尚未建立。
/// `cargo test --package aire_core realtor_license` 會因編譯失敗而紅燈 = 預期行為。
///
/// Phase 3 實作時需建立：
/// - src-tauri/src/realtor_license/cache.rs（write_license_cache, read_license_cache, is_cache_valid）

#[cfg(test)]
mod tests {
    use super::super::{
        cache::{
            write_license_cache, read_license_cache, is_license_cache_valid,
            LicenseCacheRow, seed_expired_license,
        },
        client::LicenseStatus,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-006 / spec: cache 7 天 TTL — cache_expires_at = verified_at + 7 days
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_001_cache_expires_at_is_verified_at_plus_7_days() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        let verified_at = "2026-05-14T10:00:00Z";
        let status = LicenseStatus::Verified { expires_at: "2030-01-01".to_string() };

        write_license_cache(&db, "ABC123456", &status, verified_at).expect("write failed");

        let row = read_license_cache(&db, "ABC123456")
            .expect("read failed")
            .expect("row should exist");

        // cache_expires_at 必須是 2026-05-21T10:00:00Z（+ 7 天）
        assert_eq!(
            row.cache_expires_at,
            "2026-05-21T10:00:00Z",
            "cache_expires_at 應為 verified_at + 7 天（UTC）"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-006 / spec: 7 天內 cache hit — 不觸發 OPCOS，cache_expires_at 不變
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_002_cache_hit_within_7_days_returns_valid() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        let verified_at = "2026-05-14T10:00:00Z";
        let status = LicenseStatus::Verified { expires_at: "2030-01-01".to_string() };

        write_license_cache(&db, "HIT123456", &status, verified_at).expect("write failed");

        // 1 天後查詢 → cache 仍有效
        let now = "2026-05-15T10:00:00Z";
        let valid = is_license_cache_valid(&db, "HIT123456", now);

        assert!(valid, "1 天後查詢應 cache hit（7 天 TTL 未到期）");

        // cache_expires_at 不應被更新
        let row = read_license_cache(&db, "HIT123456")
            .expect("read failed")
            .expect("row should exist");

        assert_eq!(
            row.cache_expires_at,
            "2026-05-21T10:00:00Z",
            "cache hit 後 cache_expires_at 不應變動"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-006 / spec: 8 天後 cache miss → 應觸發新的 OPCOS 查詢
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_003_cache_miss_after_8_days() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        let verified_at = "2026-05-01T10:00:00Z";
        let status = LicenseStatus::Verified { expires_at: "2030-01-01".to_string() };

        write_license_cache(&db, "MISS999999", &status, verified_at).expect("write failed");

        // 8 天後 → cache 過期
        let now = "2026-05-09T10:00:00Z";
        let valid = is_license_cache_valid(&db, "MISS999999", now);

        assert!(!valid, "8 天後 cache 應過期（TTL = 7 天）");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-008 / spec: 時間戳格式一致性 — cache_expires_at 必須是 ISO 8601 UTC
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_004_all_timestamps_use_iso8601_utc() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        write_license_cache(
            &db,
            "TS123456",
            &LicenseStatus::NotFound,
            "2026-05-14T10:00:00Z",
        )
        .expect("write failed");

        let row = read_license_cache(&db, "TS123456")
            .expect("read failed")
            .expect("row should exist");

        // verified_at 和 cache_expires_at 都必須能被 ISO 8601 parser 解析
        let parsed_verified = chrono::DateTime::parse_from_rfc3339(&row.verified_at);
        assert!(
            parsed_verified.is_ok(),
            "verified_at '{}' 應是合法的 RFC 3339 / ISO 8601，但 parse 失敗",
            row.verified_at
        );

        let parsed_expires = chrono::DateTime::parse_from_rfc3339(&row.cache_expires_at);
        assert!(
            parsed_expires.is_ok(),
            "cache_expires_at '{}' 應是合法的 RFC 3339 / ISO 8601，但 parse 失敗",
            row.cache_expires_at
        );

        // 兩個時間戳必須都是 UTC（Z 結尾）
        assert!(
            row.verified_at.ends_with('Z'),
            "verified_at 必須是 UTC（Z 結尾）"
        );
        assert!(
            row.cache_expires_at.ends_with('Z'),
            "cache_expires_at 必須是 UTC（Z 結尾）"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-009 / spec: 離線時，過期 cache 仍作為 fallback
    // seed_expired_license 是測試 helper
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_005_expired_cache_accessible_for_offline_fallback() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // seed 8 天前的 cache（已過期）
        seed_expired_license(&db, "OFFLINE789", "2026-05-06T00:00:00Z")
            .expect("seed failed");

        // 即使過期，row 仍應能讀出（不被自動刪除）
        let row = read_license_cache(&db, "OFFLINE789")
            .expect("read failed");

        assert!(
            row.is_some(),
            "過期的 cache row 應仍存在於 DB（供離線 fallback 使用）"
        );

        let row = row.unwrap();
        // 確認 status 是 verified（由 seed 寫入的）
        assert_eq!(
            row.status,
            "verified",
            "seed 的 cache row status 應是 'verified'"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RLV-007 / spec: INSERT OR REPLACE 的冪等性
    // 同一個 license_number 寫入兩次不應造成唯一鍵衝突
    // ─────────────────────────────────────────────────────────────────────────
    #[test]
    fn rlv_cache_006_insert_or_replace_is_idempotent() {
        let db = rusqlite::Connection::open_in_memory().expect("in-memory DB");

        // 第一次寫入 verified
        write_license_cache(
            &db,
            "IDEM123456",
            &LicenseStatus::Verified { expires_at: "2030-01-01".to_string() },
            "2026-05-14T10:00:00Z",
        )
        .expect("first write failed");

        // 第二次寫入 expired（更新）
        write_license_cache(
            &db,
            "IDEM123456",
            &LicenseStatus::Expired { expires_at: "2024-01-01".to_string() },
            "2026-05-15T10:00:00Z",
        )
        .expect("second write should NOT fail with unique constraint error");

        // 應讀到第二次的值
        let row = read_license_cache(&db, "IDEM123456")
            .expect("read failed")
            .expect("row should exist");

        assert_eq!(
            row.status,
            "expired",
            "第二次 INSERT OR REPLACE 應覆蓋第一次的值"
        );
    }
}
