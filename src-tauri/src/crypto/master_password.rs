use argon2::{Algorithm, Argon2, Params, Version};
use rusqlite::Connection;
use zeroize::{Zeroize, Zeroizing};

pub const ARGON2_MEMORY_KIB: u32 = 19456; // OWASP minimum (19 MiB)
pub const ARGON2_TIME_COST: u32 = 2;
pub const ARGON2_PARALLELISM: u32 = 1;

pub const MASTER_KEY_LEN: usize = 32;
pub const SALT_LEN: usize = 16;
pub const MIN_PASSWORD_CODE_POINTS: usize = 8;

#[derive(Debug, Clone, Copy)]
pub struct MasterKeyParams {
    pub memory_kib: u32,
    pub time_cost: u32,
    pub parallelism: u32,
    pub output_len: usize,
}

impl Default for MasterKeyParams {
    fn default() -> Self {
        Self {
            memory_kib: ARGON2_MEMORY_KIB,
            time_cost: ARGON2_TIME_COST,
            parallelism: ARGON2_PARALLELISM,
            output_len: MASTER_KEY_LEN,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MasterKeyError {
    #[error("invalid salt length (expected {expected}, got {actual})")]
    InvalidSaltLength { expected: usize, actual: usize },
    #[error("password too short (min 8 code points)")]
    PasswordTooShort { code_points: usize },
    #[error("argon2 derive failed: {0}")]
    DeriveFailed(String),
}

/// A password wrapper that zeroizes its internal buffer on drop.
#[derive(Default)]
pub struct SecretPassword(String);

impl SecretPassword {
    pub fn new(password: &str) -> Self {
        Self(password.to_owned())
    }
}

impl Zeroize for SecretPassword {
    fn zeroize(&mut self) {
        self.0.zeroize();
    }
}

impl Drop for SecretPassword {
    fn drop(&mut self) {
        self.zeroize();
    }
}

/// Derive a 32-byte master key from password + 16-byte salt using Argon2id.
pub fn derive_master_key(password: &str, salt: &[u8]) -> Result<[u8; MASTER_KEY_LEN], MasterKeyError> {
    if salt.len() != SALT_LEN {
        return Err(MasterKeyError::InvalidSaltLength {
            expected: SALT_LEN,
            actual: salt.len(),
        });
    }

    let code_points = password.chars().count();
    if code_points < MIN_PASSWORD_CODE_POINTS {
        return Err(MasterKeyError::PasswordTooShort { code_points });
    }

    let params = Params::new(
        ARGON2_MEMORY_KIB,
        ARGON2_TIME_COST,
        ARGON2_PARALLELISM,
        Some(MASTER_KEY_LEN),
    )
    .map_err(|e| MasterKeyError::DeriveFailed(e.to_string()))?;

    let argon = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut out = Zeroizing::new([0u8; MASTER_KEY_LEN]);
    argon
        .hash_password_into(password.as_bytes(), salt, out.as_mut())
        .map_err(|e| MasterKeyError::DeriveFailed(e.to_string()))?;

    Ok(*out)
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(&mut s, "{:02x}", b);
    }
    s
}

/// Open an encrypted SQLite DB and apply SQLCipher-style PRAGMA key.
///
/// Note: with bundled SQLite (non-SQLCipher), unknown PRAGMAs are no-ops, but this still keeps
/// the interface stable for later SQLCipher enablement.
pub fn open_encrypted_db(path: &str, key: &[u8; MASTER_KEY_LEN]) -> rusqlite::Result<Connection> {
    let conn = Connection::open(path)?;

    // SQLCipher expects a passphrase or hex-blob string. We set a hex blob form.
    let hex = Zeroizing::new(hex_encode(key));
    let key_spec = Zeroizing::new(format!("x'{}'", hex.as_str()));

    // Use pragma_update to avoid manual SQL string escaping.
    let _ = conn.pragma_update(None, "key", key_spec.as_str());

    Ok(conn)
}

#[cfg(test)]
mod tests {
    include!("master_password/tests.rs");
}
