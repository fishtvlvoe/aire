use std::time::Duration;

use reqwest::Client;
use rusqlite::Connection;
use serde::Deserialize;

use crate::realtor_license::cache;

// Re-export types for tests (tests import these from `realtor_license::client::*`).
pub use crate::realtor_license::{LicenseStatus, LicenseVerificationResult, RealtorLicenseError};

const DEFAULT_BASE_URL: &str = "https://opcos.example.com";

fn base_url() -> String {
    std::env::var("OPCOS_API_BASE_URL").unwrap_or_else(|_| DEFAULT_BASE_URL.to_string())
}

fn bearer_token() -> Option<String> {
    std::env::var("OPCOS_API_TOKEN")
        .ok()
        .or_else(|| std::env::var("OPCOS_BEARER_TOKEN").ok())
        .filter(|s| !s.trim().is_empty())
}

fn build_client() -> Result<Client, RealtorLicenseError> {
    Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|_| RealtorLicenseError::OpcosUnreachable)
}

#[derive(Debug, Deserialize)]
struct LicenseResp {
    status: String,
    expires_at: Option<String>,
}

pub async fn fetch_license_from_opcos(
    license_number: &str,
) -> Result<LicenseStatus, RealtorLicenseError> {
    if license_number.trim().is_empty() {
        return Err(RealtorLicenseError::InvalidLicenseNumberFormat);
    }

    let url = format!("{}/v1/realtor-license/{}", base_url(), license_number);
    let client = build_client()?;
    let mut req = client.get(&url);
    if let Some(t) = bearer_token().as_ref() {
        req = req.bearer_auth(t);
    }

    let resp = req
        .send()
        .await
        .map_err(|_| RealtorLicenseError::OpcosUnreachable)?;
    let status = resp.status().as_u16();
    if status == 404 {
        return Ok(LicenseStatus::NotFound);
    }
    if status == 408 {
        return Ok(LicenseStatus::Timeout);
    }
    if !resp.status().is_success() {
        return Err(RealtorLicenseError::OpcosUnreachable);
    }

    let body = resp
        .json::<LicenseResp>()
        .await
        .map_err(|_| RealtorLicenseError::OpcosUnreachable)?;
    Ok(match body.status.as_str() {
        "verified" => LicenseStatus::Verified {
            expires_at: body.expires_at.unwrap_or_default(),
        },
        "expired" => LicenseStatus::Expired {
            expires_at: body.expires_at.unwrap_or_default(),
        },
        "not_found" => LicenseStatus::NotFound,
        _ => LicenseStatus::NotFound,
    })
}

fn status_from_cache_str(s: &str) -> LicenseStatus {
    match s {
        "verified" => LicenseStatus::Verified {
            expires_at: String::new(),
        },
        "expired" => LicenseStatus::Expired {
            expires_at: String::new(),
        },
        "not_found" => LicenseStatus::NotFound,
        _ => LicenseStatus::NotFound,
    }
}

pub fn verify_realtor_license(
    conn: &Connection,
    license_number: &str,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    if license_number.trim().is_empty() {
        return Err(RealtorLicenseError::InvalidLicenseNumberFormat);
    }

    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

    if cache::is_license_cache_valid(conn, license_number, &now) {
        if let Ok(Some(row)) = cache::read_license_cache(conn, license_number) {
            return Ok(LicenseVerificationResult {
                status: status_from_cache_str(&row.status),
                verified_at: row.verified_at,
                source: "cache".to_string(),
            });
        }
    }

    match tauri::async_runtime::block_on(fetch_license_from_opcos(license_number)) {
        Ok(
            status @ (LicenseStatus::Verified { .. }
            | LicenseStatus::NotFound
            | LicenseStatus::Expired { .. }),
        ) => {
            let verified_at = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
            let _ = cache::write_license_cache(conn, license_number, &status, &verified_at)
                .map_err(|_| RealtorLicenseError::CacheWriteFailed)?;
            Ok(LicenseVerificationResult {
                status,
                verified_at,
                source: "fresh".to_string(),
            })
        }
        Ok(LicenseStatus::Timeout) => Ok(LicenseVerificationResult {
            status: LicenseStatus::Timeout,
            verified_at: now,
            source: "fresh".to_string(),
        }),
        Ok(LicenseStatus::Offline { .. }) => Ok(LicenseVerificationResult {
            status: LicenseStatus::Offline {
                last_verified_at: None,
            },
            verified_at: now,
            source: "offline".to_string(),
        }),
        Err(RealtorLicenseError::OpcosUnreachable) => {
            // offline fallback
            if let Ok(Some(row)) = cache::read_license_cache(conn, license_number) {
                Ok(LicenseVerificationResult {
                    status: status_from_cache_str(&row.status),
                    verified_at: row.verified_at,
                    source: "offline".to_string(),
                })
            } else {
                Ok(LicenseVerificationResult {
                    status: LicenseStatus::Offline {
                        last_verified_at: None,
                    },
                    verified_at: now,
                    source: "offline".to_string(),
                })
            }
        }
        Err(e) => Err(e),
    }
}

// ----------------------------
// Test helpers (no network)
// ----------------------------

#[cfg(test)]
pub fn verify_with_mock(
    conn: &Connection,
    license_number: &str,
    status: LicenseStatus,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    let verified_at = "2026-05-14T10:00:00Z".to_string();
    cache::write_license_cache(conn, license_number, &status, &verified_at)
        .map_err(|_| RealtorLicenseError::CacheWriteFailed)?;
    Ok(LicenseVerificationResult {
        status,
        verified_at,
        source: "fresh".to_string(),
    })
}

#[cfg(test)]
pub fn verify_with_delayed_mock(
    _conn: &Connection,
    _license_number: &str,
    delay: Duration,
) -> std::pin::Pin<
    Box<
        dyn std::future::Future<Output = Result<LicenseVerificationResult, RealtorLicenseError>>
            + Send,
    >,
> {
    Box::pin(async move {
        tokio::time::sleep(delay).await;
        Ok(LicenseVerificationResult {
            status: LicenseStatus::Timeout,
            verified_at: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            source: "fresh".to_string(),
        })
    })
}

#[cfg(test)]
pub fn verify_offline(
    conn: &Connection,
    license_number: &str,
) -> Result<LicenseVerificationResult, RealtorLicenseError> {
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
    if let Ok(Some(row)) = cache::read_license_cache(conn, license_number) {
        Ok(LicenseVerificationResult {
            status: status_from_cache_str(&row.status),
            verified_at: row.verified_at,
            source: "offline".to_string(),
        })
    } else {
        Ok(LicenseVerificationResult {
            status: LicenseStatus::Offline {
                last_verified_at: None,
            },
            verified_at: now,
            source: "offline".to_string(),
        })
    }
}

#[cfg(test)]
include!("client/tests.rs");
