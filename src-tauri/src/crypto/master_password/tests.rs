/// Phase 2 紅燈測試 — crypto::master_password
///
/// 涵蓋失敗點：MPKD-001 ~ MPKD-012
/// - Argon2id 確定性輸出
/// - OWASP 參數（m=19456, t=2, p=1）
/// - 32-byte 輸出 / 16-byte salt
/// - 密碼 zeroize
/// - min 8 code points
/// - PRAGMA key 套用
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        derive_master_key,
        MasterKeyParams,
        MasterKeyError,
        ARGON2_MEMORY_KIB,
        ARGON2_TIME_COST,
        ARGON2_PARALLELISM,
        MASTER_KEY_LEN,
        SALT_LEN,
        MIN_PASSWORD_CODE_POINTS,
    };

    // MPKD-001: Argon2id 確定性 — 相同輸入產生相同輸出
    #[test]
    fn test_argon2id_is_deterministic() {
        let password = "correct-horse-battery-staple";
        let salt = [0x42u8; 16]; // 固定 salt

        let key1 = derive_master_key(password, &salt).expect("第一次 derive 失敗");
        let key2 = derive_master_key(password, &salt).expect("第二次 derive 失敗");

        assert_eq!(key1, key2, "相同輸入應產生相同的 Argon2id 輸出");
    }

    // MPKD-002: Argon2id 不同 salt 產生不同輸出
    #[test]
    fn test_argon2id_different_salt_different_output() {
        let password = "correct-horse-battery-staple";
        let salt1 = [0x11u8; 16];
        let salt2 = [0x22u8; 16];

        let key1 = derive_master_key(password, &salt1).expect("第一次 derive 失敗");
        let key2 = derive_master_key(password, &salt2).expect("第二次 derive 失敗");

        assert_ne!(key1, key2, "不同 salt 應產生不同的 derive 結果");
    }

    // MPKD-003: OWASP 參數 — m=19456 KiB
    #[test]
    fn test_argon2id_memory_cost_is_owasp_compliant() {
        assert_eq!(
            ARGON2_MEMORY_KIB, 19456,
            "Argon2id 記憶體成本應為 OWASP 最低要求 19456 KiB，實際：{}",
            ARGON2_MEMORY_KIB
        );
    }

    // MPKD-004: OWASP 參數 — t=2（迭代次數）
    #[test]
    fn test_argon2id_time_cost_is_owasp_compliant() {
        assert_eq!(
            ARGON2_TIME_COST, 2,
            "Argon2id 時間成本應為 OWASP 最低要求 2，實際：{}",
            ARGON2_TIME_COST
        );
    }

    // MPKD-005: OWASP 參數 — p=1（並行度）
    #[test]
    fn test_argon2id_parallelism_is_owasp_compliant() {
        assert_eq!(
            ARGON2_PARALLELISM, 1,
            "Argon2id 並行度應為 OWASP 最低要求 1，實際：{}",
            ARGON2_PARALLELISM
        );
    }

    // MPKD-006: derive_master_key 輸出必須是 32 bytes
    #[test]
    fn test_derived_key_is_32_bytes() {
        assert_eq!(MASTER_KEY_LEN, 32, "主金鑰長度常數應為 32");

        let password = "test-password-123!";
        let salt = [0xABu8; 16];
        let key = derive_master_key(password, &salt).expect("derive 失敗");

        assert_eq!(
            key.len(), 32,
            "derive_master_key 應回傳 32 bytes，實際：{}",
            key.len()
        );
    }

    // MPKD-007: salt 必須是 16 bytes
    #[test]
    fn test_salt_length_constant_is_16() {
        assert_eq!(SALT_LEN, 16, "SALT_LEN 常數應為 16，實際：{}", SALT_LEN);
    }

    // MPKD-007b: salt 長度不是 16 bytes 時應回傳錯誤
    #[test]
    fn test_derive_rejects_invalid_salt_length() {
        let password = "valid-password-abc";
        let short_salt = [0x00u8; 8]; // 只有 8 bytes

        let result = derive_master_key(password, &short_salt);
        assert!(
            result.is_err(),
            "salt 長度不是 16 bytes 時應回傳 Err，但回傳 Ok"
        );

        match result {
            Err(MasterKeyError::InvalidSaltLength { expected, actual }) => {
                assert_eq!(expected, 16);
                assert_eq!(actual, 8);
            }
            Err(other) => panic!("期望 InvalidSaltLength，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }

    // MPKD-008: 密碼最少 8 個 Unicode code points（不是 bytes）
    #[test]
    fn test_minimum_password_length_is_8_code_points() {
        assert_eq!(
            MIN_PASSWORD_CODE_POINTS, 8,
            "最小密碼長度應為 8 code points，實際：{}",
            MIN_PASSWORD_CODE_POINTS
        );
    }

    // MPKD-009: 密碼少於 8 code points 時應拒絕
    #[test]
    fn test_derive_rejects_password_too_short() {
        let short_password = "七字元a"; // 4 code points（中文 3 個 = 3 code points + 'a' = 4）
        // 確認確實少於 8 code points
        assert!(short_password.chars().count() < 8);

        let salt = [0x01u8; 16];
        let result = derive_master_key(short_password, &salt);

        assert!(
            result.is_err(),
            "少於 8 code points 的密碼應被拒絕，但回傳 Ok"
        );

        match result {
            Err(MasterKeyError::PasswordTooShort { code_points }) => {
                assert!(code_points < 8, "code_points 應小於 8");
            }
            Err(other) => panic!("期望 PasswordTooShort，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }

    // MPKD-010: 密碼剛好 8 code points（Unicode）應被接受
    #[test]
    fn test_derive_accepts_8_code_point_password() {
        let eight_cp_password = "密碼中文ab12"; // 8 code points
        assert_eq!(
            eight_cp_password.chars().count(),
            8,
            "測試密碼應是 8 code points"
        );

        let salt = [0x02u8; 16];
        let result = derive_master_key(eight_cp_password, &salt);
        assert!(
            result.is_ok(),
            "8 code points 密碼應被接受，但回傳 Err：{:?}",
            result
        );
    }

    // MPKD-011: 密碼 zeroize — derive 後原始密碼記憶體應被清零
    // 注意：這個測試在 Phase 3 實作 Zeroize trait 後才能完整驗證
    // 先確認介面存在（SecretString 類型）
    #[test]
    fn test_password_input_uses_zeroize_type() {
        use super::super::SecretPassword;

        // SecretPassword 必須實作 Drop + Zeroize
        let secret = SecretPassword::new("test-password-12345");
        // 確認類型存在即可，Zeroize 在 drop 時自動觸發
        drop(secret);
        // 如果編譯過了，代表 SecretPassword 類型存在
    }

    // MPKD-012: PRAGMA key 套用後 DB 應可正常讀寫
    #[test]
    fn test_pragma_key_applied_correctly_to_sqlite() {
        use super::super::open_encrypted_db;

        let salt = [0x03u8; 16];
        let key = derive_master_key("correct-horse-battery-staple-extra", &salt)
            .expect("derive 失敗");

        // 用主金鑰開啟加密 DB（記憶體模式）
        let db = open_encrypted_db(":memory:", &key);
        assert!(
            db.is_ok(),
            "PRAGMA key 套用後應能開啟 DB，但失敗：{:?}",
            db
        );

        // 確認可以執行查詢
        let conn = db.unwrap();
        let result: i64 = conn
            .query_row("SELECT 42", [], |row| row.get(0))
            .expect("加密 DB 查詢失敗");
        assert_eq!(result, 42, "加密 DB 應能正常執行查詢");
    }
}
