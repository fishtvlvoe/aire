/// Phase 2 紅燈測試 — crypto::vault
///
/// 涵蓋失敗點：MPKD-013 ~ MPKD-020
/// - vault_master / vault_recovery 雙路儲存
/// - AES-GCM nonce 12-byte 唯一
/// - 雙路解鎖（主密碼 + 救援碼均可解鎖）
/// - 舊救援碼重置後失效
///
/// 預期結果：cargo test 時全部編譯失敗（模組不存在）= 紅燈

#[cfg(test)]
mod tests {
    use super::super::{
        Vault,
        VaultEntry,
        VaultError,
        encrypt_with_aes_gcm,
        decrypt_with_aes_gcm,
        AES_GCM_NONCE_LEN,
        store_vault_master,
        store_vault_recovery,
        unlock_vault_with_master,
        unlock_vault_with_recovery,
    };
    use std::collections::HashSet;

    // MPKD-013: AES-GCM nonce 必須是 12 bytes
    #[test]
    fn test_aes_gcm_nonce_length_is_12() {
        assert_eq!(
            AES_GCM_NONCE_LEN, 12,
            "AES-GCM nonce 應為 12 bytes，常數為 {}",
            AES_GCM_NONCE_LEN
        );
    }

    // MPKD-014: 每次加密必須生成唯一 nonce
    #[test]
    fn test_aes_gcm_nonces_are_unique() {
        let key = [0x42u8; 32]; // 測試用固定金鑰
        let plaintext = b"test data to encrypt";

        let mut nonces = HashSet::new();

        for _ in 0..20 {
            let (ciphertext, nonce) = encrypt_with_aes_gcm(&key, plaintext)
                .expect("加密失敗");

            assert_eq!(nonce.len(), 12, "nonce 應為 12 bytes");
            assert!(
                nonces.insert(nonce.clone()),
                "nonce 重複！第 {} 次加密產生重複 nonce",
                nonces.len() + 1
            );
        }
    }

    // MPKD-015: AES-GCM 加解密正確性
    #[test]
    fn test_aes_gcm_encrypt_decrypt_roundtrip() {
        let key = [0xABu8; 32];
        let plaintext = b"AIRE vault secret data";

        let (ciphertext, nonce) = encrypt_with_aes_gcm(&key, plaintext)
            .expect("加密失敗");

        // 密文不應等於明文
        assert_ne!(ciphertext.as_slice(), plaintext.as_slice());

        // 解密後應還原
        let decrypted = decrypt_with_aes_gcm(&key, &ciphertext, &nonce)
            .expect("解密失敗");

        assert_eq!(decrypted, plaintext, "解密結果應與原始明文相同");
    }

    // MPKD-016: 錯誤金鑰解密應失敗（AES-GCM 認證標籤驗證）
    #[test]
    fn test_aes_gcm_wrong_key_fails_decryption() {
        let key = [0x11u8; 32];
        let wrong_key = [0x22u8; 32];
        let plaintext = b"sensitive vault data";

        let (ciphertext, nonce) = encrypt_with_aes_gcm(&key, plaintext)
            .expect("加密失敗");

        let result = decrypt_with_aes_gcm(&wrong_key, &ciphertext, &nonce);
        assert!(
            result.is_err(),
            "使用錯誤金鑰解密應失敗（AES-GCM 認證失敗），但回傳 Ok"
        );
    }

    // MPKD-017: vault_master 和 vault_recovery 雙路儲存
    #[test]
    fn test_vault_stores_both_master_and_recovery_entries() {
        let vault = Vault::new_empty();
        let master_key = [0x01u8; 32];
        let recovery_key = [0x02u8; 32];
        let db_key = [0x03u8; 32]; // 實際加密 DB 的 key

        // 雙路寫入
        store_vault_master(&vault, &master_key, &db_key).expect("寫入 vault_master 失敗");
        store_vault_recovery(&vault, &recovery_key, &db_key).expect("寫入 vault_recovery 失敗");

        // 確認兩個 entry 都存在
        assert!(
            vault.has_entry(VaultEntry::Master),
            "vault 應包含 master 路徑的 entry"
        );
        assert!(
            vault.has_entry(VaultEntry::Recovery),
            "vault 應包含 recovery 路徑的 entry"
        );
    }

    // MPKD-018: 主密碼路徑可解鎖 vault（取得 DB key）
    #[test]
    fn test_unlock_vault_with_master_password() {
        let vault = Vault::new_empty();
        let master_key = [0x01u8; 32];
        let db_key = [0x99u8; 32];

        store_vault_master(&vault, &master_key, &db_key).expect("寫入 vault_master 失敗");

        let unlocked_db_key = unlock_vault_with_master(&vault, &master_key)
            .expect("主密碼應能解鎖 vault");

        assert_eq!(
            unlocked_db_key, db_key,
            "解鎖後應取得正確的 DB key"
        );
    }

    // MPKD-019: 救援碼路徑可獨立解鎖 vault（取得相同 DB key）
    #[test]
    fn test_unlock_vault_with_recovery_code() {
        let vault = Vault::new_empty();
        let master_key = [0x01u8; 32];
        let recovery_key = [0x02u8; 32];
        let db_key = [0x99u8; 32];

        store_vault_master(&vault, &master_key, &db_key).expect("寫入 vault_master 失敗");
        store_vault_recovery(&vault, &recovery_key, &db_key).expect("寫入 vault_recovery 失敗");

        // 只用救援碼路徑解鎖
        let unlocked_db_key = unlock_vault_with_recovery(&vault, &recovery_key)
            .expect("救援碼應能解鎖 vault");

        assert_eq!(
            unlocked_db_key, db_key,
            "救援碼解鎖後應取得與主密碼相同的 DB key"
        );
    }

    // MPKD-020: 兩個路徑解鎖的 DB key 必須完全相同（同一份 DB）
    #[test]
    fn test_both_unlock_paths_yield_same_db_key() {
        let vault = Vault::new_empty();
        let master_key = [0xAAu8; 32];
        let recovery_key = [0xBBu8; 32];
        let db_key = [0xCCu8; 32];

        store_vault_master(&vault, &master_key, &db_key).expect("寫入 vault_master 失敗");
        store_vault_recovery(&vault, &recovery_key, &db_key).expect("寫入 vault_recovery 失敗");

        let key_from_master = unlock_vault_with_master(&vault, &master_key)
            .expect("主密碼解鎖失敗");
        let key_from_recovery = unlock_vault_with_recovery(&vault, &recovery_key)
            .expect("救援碼解鎖失敗");

        assert_eq!(
            key_from_master, key_from_recovery,
            "主密碼和救援碼兩個路徑應解鎖到相同的 DB key"
        );
    }

    // MPKD-020b: 錯誤的主密碼應無法解鎖
    #[test]
    fn test_wrong_master_key_cannot_unlock_vault() {
        let vault = Vault::new_empty();
        let master_key = [0x01u8; 32];
        let wrong_key = [0x02u8; 32];
        let db_key = [0x99u8; 32];

        store_vault_master(&vault, &master_key, &db_key).expect("寫入 vault_master 失敗");

        let result = unlock_vault_with_master(&vault, &wrong_key);
        assert!(
            result.is_err(),
            "錯誤的主密碼應無法解鎖 vault，但回傳 Ok"
        );

        match result {
            Err(VaultError::AuthenticationFailed) => { /* 正確 */ }
            Err(other) => panic!("期望 AuthenticationFailed，實際：{:?}", other),
            Ok(_) => panic!("不應回傳 Ok"),
        }
    }
}
