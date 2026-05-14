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

use tauri::State;
use crate::DbState;

#[tauri::command(rename = "verify_realtor_license")]
pub fn verify_realtor_license_ipc(
    license_number: String,
    db: State<'_, DbState>,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    let conn = db.0.lock().map_err(|_| RealtorLicenseError::CacheWriteFailed)?;
    tauri::async_runtime::block_on(client::verify_realtor_license(&*conn, &license_number))
}
