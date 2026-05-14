use aes_gcm::aead::generic_array::GenericArray;
use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use rand::rngs::OsRng;
use rand::RngCore;
use std::cell::RefCell;

pub const AES_GCM_NONCE_LEN: usize = 12;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VaultEntry {
    Master,
    Recovery,
}

#[derive(Debug, thiserror::Error)]
pub enum VaultError {
    #[error("authentication failed")]
    AuthenticationFailed,
    #[error("missing vault entry")]
    MissingEntry,
    #[error("invalid nonce length (expected {expected}, got {actual})")]
    InvalidNonceLength { expected: usize, actual: usize },
    #[error("invalid vault data")]
    InvalidVault,
}

#[derive(Clone, Debug)]
struct VaultData {
    ciphertext: Vec<u8>,
    nonce: Vec<u8>,
}

#[derive(Default)]
struct InnerVault {
    master: Option<VaultData>,
    recovery: Option<VaultData>,
}

pub struct Vault {
    inner: RefCell<InnerVault>,
}

impl Vault {
    pub fn new_empty() -> Self {
        Self {
            inner: RefCell::new(InnerVault::default()),
        }
    }

    pub fn has_entry(&self, entry: VaultEntry) -> bool {
        let inner = self.inner.borrow();
        match entry {
            VaultEntry::Master => inner.master.is_some(),
            VaultEntry::Recovery => inner.recovery.is_some(),
        }
    }
}

pub fn encrypt_with_aes_gcm(
    key: &[u8; 32],
    plaintext: &[u8],
) -> Result<(Vec<u8>, Vec<u8>), VaultError> {
    let cipher = Aes256Gcm::new(GenericArray::from_slice(key));

    let mut nonce = [0u8; AES_GCM_NONCE_LEN];
    let mut rng = OsRng;
    rng.fill_bytes(&mut nonce);

    let ciphertext = cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext)
        .map_err(|_| VaultError::AuthenticationFailed)?;

    Ok((ciphertext, nonce.to_vec()))
}

pub fn decrypt_with_aes_gcm(
    key: &[u8; 32],
    ciphertext: &[u8],
    nonce: &[u8],
) -> Result<Vec<u8>, VaultError> {
    if nonce.len() != AES_GCM_NONCE_LEN {
        return Err(VaultError::InvalidNonceLength {
            expected: AES_GCM_NONCE_LEN,
            actual: nonce.len(),
        });
    }

    let cipher = Aes256Gcm::new(GenericArray::from_slice(key));
    cipher
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| VaultError::AuthenticationFailed)
}

pub fn store_vault_master(
    vault: &Vault,
    master_key: &[u8; 32],
    db_key: &[u8; 32],
) -> Result<(), VaultError> {
    let (ciphertext, nonce) = encrypt_with_aes_gcm(master_key, db_key)?;
    let mut inner = vault.inner.borrow_mut();
    inner.master = Some(VaultData { ciphertext, nonce });
    Ok(())
}

pub fn store_vault_recovery(
    vault: &Vault,
    recovery_key: &[u8; 32],
    db_key: &[u8; 32],
) -> Result<(), VaultError> {
    let (ciphertext, nonce) = encrypt_with_aes_gcm(recovery_key, db_key)?;
    let mut inner = vault.inner.borrow_mut();
    inner.recovery = Some(VaultData { ciphertext, nonce });
    Ok(())
}

pub fn unlock_vault_with_master(vault: &Vault, master_key: &[u8; 32]) -> Result<[u8; 32], VaultError> {
    let data = {
        let inner = vault.inner.borrow();
        inner.master.clone().ok_or(VaultError::MissingEntry)?
    };

    let plaintext = decrypt_with_aes_gcm(master_key, &data.ciphertext, &data.nonce)?;
    if plaintext.len() != 32 {
        return Err(VaultError::InvalidVault);
    }

    let mut out = [0u8; 32];
    out.copy_from_slice(&plaintext);
    Ok(out)
}

pub fn unlock_vault_with_recovery(
    vault: &Vault,
    recovery_key: &[u8; 32],
) -> Result<[u8; 32], VaultError> {
    let data = {
        let inner = vault.inner.borrow();
        inner.recovery.clone().ok_or(VaultError::MissingEntry)?
    };

    let plaintext = decrypt_with_aes_gcm(recovery_key, &data.ciphertext, &data.nonce)?;
    if plaintext.len() != 32 {
        return Err(VaultError::InvalidVault);
    }

    let mut out = [0u8; 32];
    out.copy_from_slice(&plaintext);
    Ok(out)
}

#[cfg(test)]
mod tests {
    include!("vault/tests.rs");
}
