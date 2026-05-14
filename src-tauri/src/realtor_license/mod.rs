use serde::{Deserialize, Serialize};

pub mod cache;
pub mod client;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum LicenseStatus {
    Verified { expires_at: String },
    NotFound,
    Expired { expires_at: String },
    Timeout,
    Offline { last_verified_at: Option<String> },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LicenseVerificationResult {
    pub status: LicenseStatus,
    pub verified_at: String,
    pub source: String, // "cache" | "fresh" | "offline"
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RealtorLicenseError {
    InvalidLicenseNumberFormat,
    OpcosUnreachable,
    CacheWriteFailed,
}

pub use client::{fetch_license_from_opcos, verify_realtor_license};

#[cfg(test)]
pub use client::{verify_offline, verify_with_delayed_mock, verify_with_mock};

use crate::DbState;
use tauri::State;

#[tauri::command(rename = "verify_realtor_license")]
pub async fn verify_realtor_license_ipc(
    license_number: String,
    db: State<'_, DbState>,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    let conn =
        db.0.lock()
            .map_err(|_| RealtorLicenseError::CacheWriteFailed)?
            .try_clone()
            .map_err(|_| RealtorLicenseError::CacheWriteFailed)?;

    tauri::async_runtime::spawn_blocking(move || {
        client::verify_realtor_license(&conn, &license_number)
    })
    .await
    .map_err(|_| RealtorLicenseError::CacheWriteFailed)?
}
