use bip39::{Language, Mnemonic};
use rand::rngs::OsRng;
use rand::RngCore;
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Mutex, OnceLock};
use subtle::ConstantTimeEq;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

pub const RECOVERY_CODE_WORD_COUNT: usize = 12;
pub const RECOVERY_CODE_ENTROPY_BITS: usize = 128;
pub const BIP39_WORDLIST_VERSION: &str = "bip39-english";

pub trait NoLogOutput {}

#[derive(Clone, PartialEq, Eq, Zeroize, ZeroizeOnDrop)]
pub struct RecoveryCode(String);

impl RecoveryCode {
    pub fn words(&self) -> Vec<&str> {
        self.0.split_whitespace().collect()
    }
}

impl std::fmt::Debug for RecoveryCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("RecoveryCode([REDACTED])")
    }
}

impl std::fmt::Display for RecoveryCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl NoLogOutput for RecoveryCode {}

#[derive(Debug, thiserror::Error)]
pub enum RecoveryCodeError {
    #[error("wrong recovery code word count (expected {expected}, got {actual})")]
    WrongWordCount { expected: usize, actual: usize },
    #[error("invalid recovery code word '{word}' at position {position}")]
    InvalidWord { word: String, position: usize },
    #[error("generation failed: {0}")]
    GenerationFailed(String),
    #[error("vault authentication failed")]
    AuthenticationFailed,
}

pub fn bip39_wordlist_contains(word: &str) -> bool {
    Language::English.word_list().contains(&word)
}

pub fn validate_recovery_code(words: &[&str]) -> Result<(), RecoveryCodeError> {
    if words.len() != RECOVERY_CODE_WORD_COUNT {
        return Err(RecoveryCodeError::WrongWordCount {
            expected: RECOVERY_CODE_WORD_COUNT,
            actual: words.len(),
        });
    }

    for (i, w) in words.iter().enumerate() {
        if !bip39_wordlist_contains(w) {
            return Err(RecoveryCodeError::InvalidWord {
                word: (*w).to_string(),
                position: i,
            });
        }
    }

    Ok(())
}

/// Generate a 12-word BIP39 English recovery code (128-bit entropy).
pub fn generate_recovery_code() -> Result<RecoveryCode, RecoveryCodeError> {
    let mut entropy = [0u8; RECOVERY_CODE_ENTROPY_BITS / 8];
    let mut rng = OsRng;
    rng.fill_bytes(&mut entropy);

    let mnemonic = Mnemonic::from_entropy_in(Language::English, &entropy)
        .map_err(|e| RecoveryCodeError::GenerationFailed(e.to_string()))?;

    Ok(RecoveryCode(mnemonic.to_string()))
}

pub fn generate_recovery_salt() -> Result<[u8; 16], RecoveryCodeError> {
    let mut salt = [0u8; 16];
    let mut rng = OsRng;
    rng.fill_bytes(&mut salt);
    Ok(salt)
}

/// Derive a 32-byte recovery key from 12 BIP39 words + 16-byte salt.
pub fn derive_recovery_key(words: &[&str], salt: &[u8; 16]) -> Result<[u8; 32], RecoveryCodeError> {
    validate_recovery_code(words)?;
    let normalized = Zeroizing::new(words.join(" "));
    crate::crypto::master_password::derive_master_key(normalized.as_str(), salt)
        .map_err(|_| RecoveryCodeError::AuthenticationFailed)
}

static VAULT_RECOVERY_STORE: OnceLock<Mutex<HashMap<String, RecoveryCode>>> = OnceLock::new();

fn store() -> &'static Mutex<HashMap<String, RecoveryCode>> {
    VAULT_RECOVERY_STORE.get_or_init(|| Mutex::new(HashMap::new()))
}

pub struct VaultRecoveryManager {
    vault_id: String,
    current: Option<RecoveryCode>,
}

impl VaultRecoveryManager {
    pub fn new_for_test() -> Self {
        let vault_id = uuid::Uuid::new_v4().to_string();
        let code = generate_recovery_code().ok();

        if let Some(ref c) = code {
            let mut map = store().lock().expect("vault recovery store poisoned");
            map.insert(vault_id.clone(), c.clone());
        }

        Self {
            vault_id,
            current: code,
        }
    }

    pub fn vault_id(&self) -> &str {
        &self.vault_id
    }

    pub fn current_recovery_code(&self) -> Option<&RecoveryCode> {
        self.current.as_ref()
    }

    pub fn reset_recovery_code(&mut self) -> Result<(), RecoveryCodeError> {
        let code = generate_recovery_code()?;
        {
            let mut map = store().lock().expect("vault recovery store poisoned");
            map.insert(self.vault_id.clone(), code.clone());
        }
        self.current = Some(code);
        Ok(())
    }
}

pub fn unlock_vault_with_recovery(vault_id: &str, code: &RecoveryCode) -> Result<(), RecoveryCodeError> {
    let map = store().lock().expect("vault recovery store poisoned");
    match map.get(vault_id) {
        Some(current) => {
            let result = current.0.as_bytes().ct_eq(code.0.as_bytes());
            if result.into() {
                Ok(())
            } else {
                Err(RecoveryCodeError::AuthenticationFailed)
            }
        }
        _ => Err(RecoveryCodeError::AuthenticationFailed),
    }
}

/// Best-effort check: ensure we did not persist recovery codes into app data.
///
/// For Stage 1, the implementation never writes recovery codes, so this function returns false
/// unless it finds an existing file containing the code.
pub fn check_recovery_code_persistence(app_data_dir: &Path, code: &RecoveryCode) -> bool {
    if !app_data_dir.exists() {
        return false;
    }

    let mut stack = vec![app_data_dir.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = match std::fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
                continue;
            }
            if let Ok(bytes) = std::fs::read(&path) {
                if let Ok(s) = std::str::from_utf8(&bytes) {
                    if s.contains(code.0.as_str()) {
                        return true;
                    }
                }
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    include!("recovery_code/tests.rs");
}
