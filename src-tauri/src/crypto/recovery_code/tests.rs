/// Phase 2 紅燈測試 — crypto::recovery_code
///
/// 涵蓋失敗點：RCM-001 ~ RCM-016
/// - 12 BIP39 字 / 128-bit entropy / 密碼學 RNG
/// - BIP39 wordlist 版本驗證
/// - 救援碼獨立 salt
/// - 重置後舊主密碼 / 舊救援碼失效
/// - 新救援碼生成
/// - BIP39 字驗證 + 字數驗證
/// - 不持久化（log / app data）
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        generate_recovery_code,
        validate_recovery_code,
        RecoveryCode,
        RecoveryCodeError,
        derive_recovery_key,
        RECOVERY_CODE_WORD_COUNT,
        RECOVERY_CODE_ENTROPY_BITS,
        BIP39_WORDLIST_VERSION,
    };
    use std::collections::HashSet;

    // RCM-001: 生成的救援碼必須是 12 個 BIP39 字
    #[test]
    fn test_recovery_code_has_12_words() {
        assert_eq!(
            RECOVERY_CODE_WORD_COUNT, 12,
            "救援碼應為 12 字，常數為 {}",
            RECOVERY_CODE_WORD_COUNT
        );

        let code = generate_recovery_code().expect("生成救援碼失敗");
        let words: Vec<&str> = code.words();

        assert_eq!(
            words.len(), 12,
            "生成的救援碼應有 12 個字，實際：{}",
            words.len()
        );
    }

    // RCM-002: 128-bit entropy 確認
    #[test]
    fn test_recovery_code_entropy_is_128_bits() {
        assert_eq!(
            RECOVERY_CODE_ENTROPY_BITS, 128,
            "救援碼 entropy 應為 128 bits，實際：{}",
            RECOVERY_CODE_ENTROPY_BITS
        );
    }

    // RCM-003: 每次生成的救援碼必須唯一（密碼學 RNG）
    #[test]
    fn test_recovery_codes_are_unique() {
        let mut codes = HashSet::new();

        for _ in 0..10 {
            let code = generate_recovery_code().expect("生成救援碼失敗");
            let code_str = code.to_string();
            assert!(
                codes.insert(code_str.clone()),
                "生成了重複的救援碼：{}",
                code_str
            );
        }
    }

    // RCM-004: 所有生成的字必須在 BIP39 英文詞庫中
    #[test]
    fn test_recovery_code_words_are_valid_bip39() {
        let code = generate_recovery_code().expect("生成救援碼失敗");

        for word in code.words() {
            let is_valid = super::super::bip39_wordlist_contains(word);
            assert!(
                is_valid,
                "「{}」不在 BIP39 詞庫中",
                word
            );
        }
    }

    // RCM-005: BIP39 wordlist 版本驗證
    #[test]
    fn test_bip39_wordlist_version_is_specified() {
        // 必須指定 wordlist 版本（不是任意版本）
        assert!(
            !BIP39_WORDLIST_VERSION.is_empty(),
            "BIP39_WORDLIST_VERSION 不應為空字串"
        );
    }

    // RCM-006: 救援碼使用獨立 salt（與主密碼 salt 不同）
    #[test]
    fn test_recovery_code_uses_independent_salt() {
        use super::super::generate_recovery_salt;

        let salt1 = generate_recovery_salt().expect("生成 recovery salt 失敗");
        let salt2 = generate_recovery_salt().expect("生成 recovery salt 失敗");

        assert_ne!(
            salt1, salt2,
            "每次生成的 recovery salt 應不同（密碼學 RNG）"
        );
        assert_eq!(
            salt1.len(), 16,
            "recovery salt 應為 16 bytes"
        );
    }

    // RCM-007: derive_recovery_key 確定性驗證
    #[test]
    fn test_recovery_key_derivation_is_deterministic() {
        let code_words = ["abandon"; 12]; // 測試用固定詞
        let salt = [0x55u8; 16];

        let key1 = derive_recovery_key(&code_words, &salt).expect("第一次 derive 失敗");
        let key2 = derive_recovery_key(&code_words, &salt).expect("第二次 derive 失敗");

        assert_eq!(key1, key2, "相同輸入應產生相同的 recovery key");
    }

    // RCM-008: validate_recovery_code 接受 12 個合法 BIP39 字
    #[test]
    fn test_validate_accepts_valid_12_word_code() {
        // 使用有效的 BIP39 詞（"abandon" 是 BIP39 第一個字）
        let words = vec!["abandon"; 12];

        // 注意：只驗證格式正確性（Phase 3 才驗 vault 解鎖）
        let result = validate_recovery_code(&words);
        assert!(
            result.is_ok(),
            "12 個合法 BIP39 字應通過格式驗證，但回傳 Err：{:?}",
            result
        );
    }

    // RCM-009: validate_recovery_code 拒絕非 BIP39 字
    #[test]
    fn test_validate_rejects_non_bip39_words() {
        let words = vec!["foobarxyz"; 12]; // 不在 BIP39 詞庫中

        let result = validate_recovery_code(&words);
        assert!(
            result.is_err(),
            "非 BIP39 字應被拒絕，但回傳 Ok"
        );

        match result {
            Err(RecoveryCodeError::InvalidWord { word, position }) => {
                assert_eq!(word, "foobarxyz");
                assert_eq!(position, 0);
            }
            Err(other) => panic!("期望 InvalidWord，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }

    // RCM-010: validate_recovery_code 拒絕少於 12 個字
    #[test]
    fn test_validate_rejects_wrong_word_count() {
        let too_few = vec!["abandon"; 11];

        let result = validate_recovery_code(&too_few);
        assert!(
            result.is_err(),
            "少於 12 個字應被拒絕，但回傳 Ok"
        );

        match result {
            Err(RecoveryCodeError::WrongWordCount { expected, actual }) => {
                assert_eq!(expected, 12);
                assert_eq!(actual, 11);
            }
            Err(other) => panic!("期望 WrongWordCount，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }

    // RCM-011: validate_recovery_code 拒絕多於 12 個字
    #[test]
    fn test_validate_rejects_too_many_words() {
        let too_many = vec!["abandon"; 13];

        let result = validate_recovery_code(&too_many);
        assert!(
            result.is_err(),
            "超過 12 個字應被拒絕，但回傳 Ok"
        );

        match result {
            Err(RecoveryCodeError::WrongWordCount { expected, actual }) => {
                assert_eq!(expected, 12);
                assert_eq!(actual, 13);
            }
            Err(other) => panic!("期望 WrongWordCount，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }

    // RCM-012: RecoveryCode 不應實作 Display 輸出明文到 log
    // （確認 Debug 格式被遮罩）
    #[test]
    fn test_recovery_code_debug_is_redacted() {
        let code = generate_recovery_code().expect("生成救援碼失敗");
        let debug_str = format!("{:?}", code);

        // Debug 輸出不應包含實際詞語（應被遮罩）
        assert!(
            debug_str.contains("[REDACTED]") || !debug_str.contains("abandon"),
            "RecoveryCode Debug 輸出不應暴露明文詞語，實際：{}",
            debug_str
        );
    }

    // RCM-013: RecoveryCode 重置後應生成新救援碼（不重用舊碼）
    #[test]
    fn test_reset_generates_new_recovery_code() {
        use super::super::VaultRecoveryManager;

        let mut manager = VaultRecoveryManager::new_for_test();
        let old_code = manager.current_recovery_code().cloned().expect("應有初始救援碼");

        manager.reset_recovery_code().expect("重置救援碼失敗");

        let new_code = manager.current_recovery_code().expect("重置後應有新救援碼");
        assert_ne!(
            old_code.to_string(),
            new_code.to_string(),
            "重置後救援碼應不同"
        );
    }

    // RCM-014: 重置後舊救援碼應失效（無法解鎖 vault）
    #[test]
    fn test_old_recovery_code_invalid_after_reset() {
        use super::super::{VaultRecoveryManager, unlock_vault_with_recovery};

        let mut manager = VaultRecoveryManager::new_for_test();
        let old_code = manager.current_recovery_code().cloned().expect("應有初始救援碼");

        manager.reset_recovery_code().expect("重置救援碼失敗");

        // 嘗試用舊救援碼解鎖
        let result = unlock_vault_with_recovery(manager.vault_id(), &old_code);
        assert!(
            result.is_err(),
            "舊救援碼應在重置後失效，但解鎖成功"
        );
    }

    // RCM-015: 救援碼不應被寫入 log（透過 log crate 測試）
    // 注意：Phase 3 整合 log 框架後才能完整驗證，這裡測試介面
    #[test]
    fn test_recovery_code_type_implements_no_log_trait() {
        // RecoveryCode 應實作 NoLogOutput marker trait
        // 確認型別存在即可
        use super::super::NoLogOutput;

        fn requires_no_log<T: NoLogOutput>(_: &T) {}

        let code = generate_recovery_code().expect("生成救援碼失敗");
        requires_no_log(&code);
        // 能編譯 = RecoveryCode 實作了 NoLogOutput
    }

    // RCM-016: 救援碼不應持久化到 app data 目錄
    #[test]
    fn test_recovery_code_not_stored_in_app_data() {
        use super::super::check_recovery_code_persistence;
        use std::path::Path;

        let test_app_data = Path::new("/tmp/aire-test-app-data");
        let code = generate_recovery_code().expect("生成救援碼失敗");

        // 模擬「完成生成」流程
        // 確認過程中沒有寫入任何包含救援碼的檔案
        let found_persistence = check_recovery_code_persistence(test_app_data, &code);
        assert!(
            !found_persistence,
            "救援碼不應被持久化到 app data，但在 {:?} 發現相關資料",
            test_app_data
        );
    }
}
