// AIRE — OPCOS HTTP client（Task 4.1）
//
// 依據：openspec/changes/aire-desktop-phase1/design.md D3
// capability: license-activation
//
// 端點：
//   POST {base}/api/license/verify    { license_key, device_id }
//   POST {base}/api/license/activate  { license_key, device_id, device_name, os_version }
//
// base URL 取 env OPCOS_API_BASE_URL，未設則用 https://opcos.example.com。
// timeout 10 秒。

use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};

const DEFAULT_BASE_URL: &str = "https://opcos.example.com";

#[derive(Debug, Clone)]
pub struct OpcosError {
    pub code: String,
    pub status: Option<u16>,
    pub message: String,
}

impl OpcosError {
    pub fn new(code: impl Into<String>, status: Option<u16>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            status,
            message: message.into(),
        }
    }

    pub fn network(msg: impl Into<String>) -> Self {
        Self::new("network_failed", None, msg)
    }
}

impl std::fmt::Display for OpcosError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.status {
            Some(s) => write!(f, "[opcos {} {}] {}", s, self.code, self.message),
            None => write!(f, "[opcos {}] {}", self.code, self.message),
        }
    }
}

impl std::error::Error for OpcosError {}

#[derive(Debug, Serialize)]
struct VerifyReq<'a> {
    license_key: &'a str,
    device_id: &'a str,
}

#[derive(Debug, Serialize)]
struct ActivateReq<'a> {
    license_key: &'a str,
    device_id: &'a str,
    device_name: &'a str,
    os_version: &'a str,
}

#[derive(Debug, Deserialize, Clone)]
pub struct VerifyResp {
    pub status: String, // "active"
    pub valid_until: Option<String>,
    pub last_verified_at: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ActivateResp {
    pub status: String, // "active"
    pub token: String,  // JWT
    pub valid_until: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
struct ApiError {
    error: String,
}

fn base_url() -> String {
    // build.rs 在 release profile 透過 cargo:rustc-env 注入 compile-time 值；
    // dev 模式退回 runtime env var，再退回預設值。
    if let Some(url) = option_env!("OPCOS_API_BASE_URL") {
        return url.to_string();
    }
    std::env::var("OPCOS_API_BASE_URL").unwrap_or_else(|_| DEFAULT_BASE_URL.to_string())
}

fn build_client() -> Result<Client, OpcosError> {
    Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| OpcosError::new("client_build", None, e.to_string()))
}

/// 呼叫 POST /api/license/verify。
pub async fn verify_license(license_key: &str, device_id: &str) -> Result<VerifyResp, OpcosError> {
    let url = format!("{}/api/license/verify", base_url());
    let client = build_client()?;
    let resp = client
        .post(&url)
        .json(&VerifyReq {
            license_key,
            device_id,
        })
        .send()
        .await
        .map_err(|e| OpcosError::network(e.to_string()))?;

    let status = resp.status();
    if status.is_success() {
        resp.json::<VerifyResp>()
            .await
            .map_err(|e| OpcosError::new("bad_response", Some(status.as_u16()), e.to_string()))
    } else {
        let code = parse_api_error(resp).await;
        Err(OpcosError::new(
            code,
            Some(status.as_u16()),
            "verify failed",
        ))
    }
}

/// 呼叫 POST /api/license/activate。
pub async fn activate_license(
    license_key: &str,
    device_id: &str,
    device_name: &str,
    os_version: &str,
) -> Result<ActivateResp, OpcosError> {
    let url = format!("{}/api/license/activate", base_url());
    let client = build_client()?;
    let resp = client
        .post(&url)
        .json(&ActivateReq {
            license_key,
            device_id,
            device_name,
            os_version,
        })
        .send()
        .await
        .map_err(|e| OpcosError::network(e.to_string()))?;

    let status = resp.status();
    if status.is_success() {
        resp.json::<ActivateResp>()
            .await
            .map_err(|e| OpcosError::new("bad_response", Some(status.as_u16()), e.to_string()))
    } else {
        // 409 / 422 含 error code
        let code = parse_api_error(resp).await;
        Err(OpcosError::new(
            code,
            Some(status.as_u16()),
            "activate failed",
        ))
    }
}

async fn parse_api_error(resp: reqwest::Response) -> String {
    match resp.json::<ApiError>().await {
        Ok(e) => e.error,
        Err(_) => "unknown".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base_url_uses_env_when_set() {
        std::env::set_var("OPCOS_API_BASE_URL", "https://test.opcos.local");
        assert_eq!(base_url(), "https://test.opcos.local");
        std::env::remove_var("OPCOS_API_BASE_URL");
    }

    #[test]
    fn base_url_falls_back_to_default() {
        std::env::remove_var("OPCOS_API_BASE_URL");
        assert_eq!(base_url(), DEFAULT_BASE_URL);
    }
}
