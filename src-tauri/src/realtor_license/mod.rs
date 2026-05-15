pub mod cache;
pub mod client;

use reqwest::Client;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LicenseStatus {
    Verified,
    NotFound,
    Expired,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VerificationSource {
    Cache,
    Fresh,
    Offline,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LicenseVerificationResult {
    pub status: LicenseStatus,
    pub source: VerificationSource,
    pub verified_at: String,
}

#[derive(Debug)]
pub enum RealtorLicenseError {
    OpcosUnreachable,
    CacheFailed(String),
    InvalidResponse,
}

impl std::fmt::Display for RealtorLicenseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::OpcosUnreachable => write!(f, "opcos unreachable"),
            Self::CacheFailed(msg) => write!(f, "cache failed: {msg}"),
            Self::InvalidResponse => write!(f, "invalid response"),
        }
    }
}

impl std::error::Error for RealtorLicenseError {}

pub async fn verify_realtor_license(
    conn: &Connection,
    client: &Client,
    base_url: &str,
    token: &str,
    license_number: &str,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    if let Some(cached) =
        cache::get_cached(conn, license_number).map_err(RealtorLicenseError::CacheFailed)?
    {
        return Ok(LicenseVerificationResult {
            status: cached.status,
            source: VerificationSource::Cache,
            verified_at: cached.verified_at,
        });
    }

    match client::fetch_license_status(client, base_url, token, license_number).await {
        Ok(status) => {
            let verified_at = chrono::Utc::now().to_rfc3339();
            cache::upsert_verification(conn, license_number, &status, &verified_at)
                .map_err(RealtorLicenseError::CacheFailed)?;
            Ok(LicenseVerificationResult {
                status,
                source: VerificationSource::Fresh,
                verified_at,
            })
        }
        Err(RealtorLicenseError::OpcosUnreachable) => {
            let latest = cache::get_latest(conn, license_number)
                .map_err(RealtorLicenseError::CacheFailed)?;
            if let Some(last) = latest {
                Ok(LicenseVerificationResult {
                    status: last.status,
                    source: VerificationSource::Offline,
                    verified_at: last.verified_at,
                })
            } else {
                Err(RealtorLicenseError::OpcosUnreachable)
            }
        }
        Err(err) => Err(err),
    }
}

// ── IPC command handler ───────────────────────────────────────────────

/// 驗證仲介執照（IPC sync command，避免 Connection 不是 Send 的問題）
#[tauri::command(rename = "verify_realtor_license")]
pub fn verify_realtor_license_ipc(
    db: tauri::State<'_, crate::DbState>,
    base_url: String,
    token: String,
    license_number: String,
) -> Result<LicenseVerificationResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // 先查快取（純同步操作）
    if let Ok(Some(cached)) = cache::get_cached(&conn, &license_number) {
        return Ok(LicenseVerificationResult {
            status: cached.status,
            source: VerificationSource::Cache,
            verified_at: cached.verified_at,
        });
    }

    // 需要網路呼叫：在 block_in_place 執行 async（Connection 不跨 await）
    let client = Client::new();
    let fetch_result = {
        let rt = tokio::runtime::Handle::try_current();
        match rt {
            Ok(handle) => tokio::task::block_in_place(|| {
                handle.block_on(client::fetch_license_status(
                    &client,
                    &base_url,
                    &token,
                    &license_number,
                ))
            }),
            Err(_) => {
                // 不在 async runtime，建臨時 runtime
                let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
                rt.block_on(client::fetch_license_status(
                    &client,
                    &base_url,
                    &token,
                    &license_number,
                ))
            }
        }
    };

    match fetch_result {
        Ok(status) => {
            let verified_at = chrono::Utc::now().to_rfc3339();
            // 寫快取（失敗不影響主要結果）
            let _ = cache::upsert_verification(&conn, &license_number, &status, &verified_at);
            Ok(LicenseVerificationResult {
                status,
                source: VerificationSource::Fresh,
                verified_at,
            })
        }
        Err(RealtorLicenseError::OpcosUnreachable) => {
            // 網路不通，回傳最後快取
            if let Ok(Some(last)) = cache::get_latest(&conn, &license_number) {
                Ok(LicenseVerificationResult {
                    status: last.status,
                    source: VerificationSource::Offline,
                    verified_at: last.verified_at,
                })
            } else {
                Err(RealtorLicenseError::OpcosUnreachable.to_string())
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn source_enum_serializes() {
        let source = VerificationSource::Cache;
        let encoded = serde_json::to_string(&source).expect("serialize");
        assert_eq!(encoded, "\"cache\"");
    }
}
