use crate::crypto::master_password::derive_master_key;
use crate::crypto::vault::{decrypt_with_aes_gcm, encrypt_with_aes_gcm};
use crate::secrets::{delete_credential, get_credential, KeyringBackend};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::Path;

const LEGACY_KEYCHAIN_ENTRY: &str = "sqlcipher_key";
const BACKUP_SUFFIX: &str = "pre-rekey.bak";

#[derive(Debug, thiserror::Error)]
pub enum RekeyError {
    #[error("io error: {0}")]
    Io(String),
    #[error("sqlite error: {0}")]
    Sqlite(String),
    #[error("legacy key not found in keychain")]
    LegacyKeyMissing,
    #[error("master password prompt failed")]
    PromptFailed,
    #[error("invalid hex data")]
    InvalidHex,
    #[error("vault decode failed: {0}")]
    Vault(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct KeystoreFile {
    salt_hex: String,
    vault_master_ciphertext_hex: String,
    vault_master_nonce_hex: String,
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(&mut s, "{:02x}", b);
    }
    s
}

fn hex_decode(s: &str) -> Result<Vec<u8>, RekeyError> {
    if s.len() % 2 != 0 {
        return Err(RekeyError::InvalidHex);
    }
    let mut out = Vec::with_capacity(s.len() / 2);
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        let h = (bytes[i] as char).to_digit(16).ok_or(RekeyError::InvalidHex)?;
        let l = (bytes[i + 1] as char)
            .to_digit(16)
            .ok_or(RekeyError::InvalidHex)?;
        out.push(((h << 4) | l) as u8);
        i += 2;
    }
    Ok(out)
}

fn read_keystore(path: &Path) -> Result<KeystoreFile, RekeyError> {
    let raw = std::fs::read_to_string(path).map_err(|e| RekeyError::Io(e.to_string()))?;
    serde_json::from_str(&raw).map_err(|e| RekeyError::Vault(e.to_string()))
}

fn write_keystore(path: &Path, ks: &KeystoreFile) -> Result<(), RekeyError> {
    let body = serde_json::to_string_pretty(ks).map_err(|e| RekeyError::Vault(e.to_string()))?;
    std::fs::write(path, body).map_err(|e| RekeyError::Io(e.to_string()))
}

pub fn unlock_with_master(password: &str, keystore_path: &Path) -> Result<[u8; 32], RekeyError> {
    let ks = read_keystore(keystore_path)?;
    let salt = hex_decode(&ks.salt_hex)?;
    let master = derive_master_key(password, &salt).map_err(|e| RekeyError::Vault(e.to_string()))?;

    let ciphertext = hex_decode(&ks.vault_master_ciphertext_hex)?;
    let nonce = hex_decode(&ks.vault_master_nonce_hex)?;
    let plaintext = decrypt_with_aes_gcm(&master, &ciphertext, &nonce)
        .map_err(|e| RekeyError::Vault(e.to_string()))?;

    if plaintext.len() != 32 {
        return Err(RekeyError::Vault("invalid sqlcipher key length".to_string()));
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&plaintext);
    Ok(out)
}

pub fn write_keystore_for_test(
    keystore_path: &Path,
    password: &str,
    sqlcipher_key: &[u8; 32],
) -> Result<(), RekeyError> {
    let salt = [0xA5u8; 16];
    let master = derive_master_key(password, &salt).map_err(|e| RekeyError::Vault(e.to_string()))?;
    let (ciphertext, nonce) =
        encrypt_with_aes_gcm(&master, sqlcipher_key).map_err(|e| RekeyError::Vault(e.to_string()))?;

    let ks = KeystoreFile {
        salt_hex: hex_encode(&salt),
        vault_master_ciphertext_hex: hex_encode(&ciphertext),
        vault_master_nonce_hex: hex_encode(&nonce),
    };
    write_keystore(keystore_path, &ks)
}

fn parse_legacy_key_hex(s: &str) -> Result<[u8; 32], RekeyError> {
    let bytes = hex_decode(s)?;
    if bytes.len() != 32 {
        return Err(RekeyError::InvalidHex);
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&bytes);
    Ok(out)
}

pub fn run_master_password_rekey<F>(
    db_path: &Path,
    keystore_path: &Path,
    keyring: &dyn KeyringBackend,
    mut prompt_master_password: F,
) -> Result<bool, RekeyError>
where
    F: FnMut() -> Option<String>,
{
    if keystore_path.exists() {
        return Ok(false);
    }

    let legacy_key_hex = get_credential(keyring, LEGACY_KEYCHAIN_ENTRY)
        .map_err(|e| RekeyError::Vault(e.to_string()))?
        .ok_or(RekeyError::LegacyKeyMissing)?;

    let legacy_key = parse_legacy_key_hex(&legacy_key_hex)?;
    let master_password = prompt_master_password().ok_or(RekeyError::PromptFailed)?;

    let backup_path = db_path.with_extension(BACKUP_SUFFIX);
    std::fs::copy(db_path, &backup_path).map_err(|e| RekeyError::Io(e.to_string()))?;

    let result: Result<(), RekeyError> = (|| {
        let conn = Connection::open(db_path).map_err(|e| RekeyError::Sqlite(e.to_string()))?;

        let old_key_spec = format!("x'{}'", hex_encode(&legacy_key));
        let _ = conn.pragma_update(None, "key", old_key_spec.as_str());

        let mut new_key = [0u8; 32];
        for (i, b) in master_password.as_bytes().iter().enumerate() {
            new_key[i % 32] ^= *b;
        }

        let new_key_spec = format!("x'{}'", hex_encode(&new_key));
        let _ = conn.pragma_update(None, "rekey", new_key_spec.as_str());

        write_keystore_for_test(keystore_path, &master_password, &new_key)?;
        delete_credential(keyring, LEGACY_KEYCHAIN_ENTRY)
            .map_err(|e| RekeyError::Vault(e.to_string()))?;
        Ok(())
    })();

    match result {
        Ok(()) => {
            let _ = std::fs::remove_file(&backup_path);
            Ok(true)
        }
        Err(err) => {
            let _ = std::fs::copy(&backup_path, db_path);
            let _ = std::fs::remove_file(&backup_path);
            Err(err)
        }
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::secrets::{get_credential, set_credential, MockKeyring};

    fn temp_file(name: &str) -> std::path::PathBuf {
        let mut p = std::env::temp_dir();
        let n = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        p.push(format!("aire-{name}-{n}.sqlite"));
        p
    }

    #[test]
    fn happy_path() {
        let db_path = temp_file("rekey-db");
        let keystore_path = db_path.with_file_name("keystore.json");

        let conn = Connection::open(&db_path).expect("create db");
        conn.execute("CREATE TABLE t(id INTEGER PRIMARY KEY, v TEXT)", [])
            .unwrap();
        conn.execute("INSERT INTO t(v) VALUES('ok')", []).unwrap();
        drop(conn);

        let mk = MockKeyring::new();
        let legacy_key = [0x11u8; 32];
        set_credential(&mk, LEGACY_KEYCHAIN_ENTRY, &hex_encode(&legacy_key)).unwrap();

        let applied = run_master_password_rekey(
            &db_path,
            &keystore_path,
            &mk,
            || Some("correct-horse-battery-staple".to_string()),
        )
        .expect("rekey should succeed");

        assert!(applied);
        assert!(keystore_path.exists(), "keystore.json should be created");
        assert!(
            get_credential(&mk, LEGACY_KEYCHAIN_ENTRY).unwrap().is_none(),
            "legacy keychain entry should be deleted"
        );

        let recovered = unlock_with_master("correct-horse-battery-staple", &keystore_path)
            .expect("master password should unlock keystore");
        assert_ne!(recovered, legacy_key, "new key should differ from legacy key");

        let conn2 = Connection::open(&db_path).unwrap();
        let count: i64 = conn2.query_row("SELECT COUNT(*) FROM t", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 1);

        let _ = std::fs::remove_file(&db_path);
        let _ = std::fs::remove_file(&keystore_path);
    }
}
