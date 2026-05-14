/// Phase 2 紅燈測試 — data_portability::conflict
///
/// 涵蓋失敗點：DEI-013 (Overwrite), DEI-014 (KeepNewer), DEI-015 (Skip),
///             DEI-016 (Apply to all), DEI-017 (逐案決策), DEI-018 (策略持久化)
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        ConflictStrategy,
        ConflictResolver,
        ConflictItem,
        ApplyToAllState,
        resolve_single_conflict,
        apply_strategy_to_all,
    };

    fn make_conflict(id: u64, existing_updated_at: i64, incoming_updated_at: i64) -> ConflictItem {
        ConflictItem {
            case_id: id,
            existing_updated_at,
            incoming_updated_at,
        }
    }

    // DEI-013: Overwrite 策略 → 用匯入資料覆蓋現有資料
    #[test]
    fn test_conflict_overwrite_replaces_existing() {
        let conflict = make_conflict(1, 1000, 2000);
        let result = resolve_single_conflict(&conflict, ConflictStrategy::Overwrite)
            .expect("resolve 失敗");

        assert!(
            result.use_incoming,
            "Overwrite 策略應選擇 incoming 資料，但選了 existing"
        );
        assert_eq!(result.case_id, 1);
    }

    // DEI-014: KeepNewer 策略 → 保留較新的（比較 updated_at 時間戳）
    #[test]
    fn test_conflict_keep_newer_selects_more_recent_existing() {
        // existing 較新（updated_at 更大）
        let conflict = make_conflict(1, 9999, 1000);
        let result = resolve_single_conflict(&conflict, ConflictStrategy::KeepNewer)
            .expect("resolve 失敗");

        assert!(
            !result.use_incoming,
            "KeepNewer 且 existing 較新，應保留 existing"
        );
    }

    #[test]
    fn test_conflict_keep_newer_selects_more_recent_incoming() {
        // incoming 較新
        let conflict = make_conflict(1, 1000, 9999);
        let result = resolve_single_conflict(&conflict, ConflictStrategy::KeepNewer)
            .expect("resolve 失敗");

        assert!(
            result.use_incoming,
            "KeepNewer 且 incoming 較新，應選擇 incoming"
        );
    }

    // DEI-015: Skip 策略 → 保留現有資料，不匯入衝突案件
    #[test]
    fn test_conflict_skip_keeps_existing() {
        let conflict = make_conflict(1, 1000, 9999);
        let result = resolve_single_conflict(&conflict, ConflictStrategy::Skip)
            .expect("resolve 失敗");

        assert!(
            !result.use_incoming,
            "Skip 策略應保留 existing，不管時間戳"
        );
    }

    // DEI-016: Apply to all → 將選擇的策略套用至所有剩餘衝突
    #[test]
    fn test_apply_to_all_applies_strategy_to_remaining_conflicts() {
        let conflicts = vec![
            make_conflict(1, 1000, 2000),
            make_conflict(2, 3000, 1500),
            make_conflict(3, 5000, 5001),
        ];

        let results = apply_strategy_to_all(&conflicts, ConflictStrategy::Overwrite)
            .expect("apply_strategy_to_all 失敗");

        assert_eq!(results.len(), 3, "應處理所有 3 個衝突");

        // Overwrite：全部用 incoming
        for r in &results {
            assert!(
                r.use_incoming,
                "Overwrite + Apply to all：case_id {} 應選 incoming",
                r.case_id
            );
        }
    }

    // DEI-016b: Apply to all 與 KeepNewer 結合
    #[test]
    fn test_apply_to_all_with_keep_newer() {
        let conflicts = vec![
            make_conflict(1, 9999, 1000), // existing 較新
            make_conflict(2, 1000, 9999), // incoming 較新
        ];

        let results = apply_strategy_to_all(&conflicts, ConflictStrategy::KeepNewer)
            .expect("apply_strategy_to_all 失敗");

        assert_eq!(results.len(), 2);
        assert!(!results[0].use_incoming, "case 1：existing 較新應保留 existing");
        assert!(results[1].use_incoming, "case 2：incoming 較新應選 incoming");
    }

    // DEI-017: 逐案決策 → 每個衝突可獨立選擇策略
    #[test]
    fn test_resolver_handles_per_case_strategy() {
        let mut resolver = ConflictResolver::new();

        let conflict_1 = make_conflict(1, 1000, 9999);
        let conflict_2 = make_conflict(2, 9999, 1000);

        // 案件 1 選 Overwrite，案件 2 選 Skip
        resolver.decide(conflict_1.case_id, ConflictStrategy::Overwrite);
        resolver.decide(conflict_2.case_id, ConflictStrategy::Skip);

        let r1 = resolver.resolve(&conflict_1).expect("resolve case 1 失敗");
        let r2 = resolver.resolve(&conflict_2).expect("resolve case 2 失敗");

        assert!(r1.use_incoming, "case 1 選 Overwrite 應使用 incoming");
        assert!(!r2.use_incoming, "case 2 選 Skip 應保留 existing");
    }

    // DEI-018: ApplyToAll 狀態必須在整個匯入流程中持久（不被重置）
    #[test]
    fn test_apply_to_all_state_persists_through_resolver() {
        let mut resolver = ConflictResolver::new();

        // 使用者在案件 1 觸發「Apply to all: Overwrite」
        resolver.set_apply_to_all(ConflictStrategy::Overwrite);

        assert_eq!(
            resolver.apply_to_all_state(),
            Some(ApplyToAllState { strategy: ConflictStrategy::Overwrite }),
            "Apply to all 狀態應持久保存"
        );

        // 即使再 decide 個別案件，apply_to_all 不應被清除
        resolver.decide(99, ConflictStrategy::Skip);
        assert!(
            resolver.apply_to_all_state().is_some(),
            "個別 decide 後 apply_to_all 狀態不應被清除"
        );
    }
}
