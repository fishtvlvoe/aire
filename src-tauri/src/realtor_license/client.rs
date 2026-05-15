use reqwest::{Client, StatusCode};
use serde::Deserialize;
use std::time::Duration;

use super::{LicenseStatus, RealtorLicenseError};

#[derive(Deserialize)]
struct LicenseResponse {
    status: String,
}

pub async fn fetch_license_status(
    client: &Client,
    base_url: &str,
    token: &str,
    license_number: &str,
) -> Result<LicenseStatus, RealtorLicenseError> {
    let url = format!(
        "{}/v1/realtor-license/{}",
        base_url.trim_end_matches('/'),
        license_number
    );
    let response = client
        .get(url)
        .bearer_auth(token)
        .timeout(Duration::from_secs(3))
        .send()
        .await
        .map_err(|_| RealtorLicenseError::OpcosUnreachable)?;

    match response.status() {
        StatusCode::OK => {
            let body: LicenseResponse = response
                .json()
                .await
                .map_err(|_| RealtorLicenseError::InvalidResponse)?;
            match body.status.as_str() {
                "verified" => Ok(LicenseStatus::Verified),
                "not_found" => Ok(LicenseStatus::NotFound),
                "expired" => Ok(LicenseStatus::Expired),
                _ => Err(RealtorLicenseError::InvalidResponse),
            }
        }
        StatusCode::UNAUTHORIZED => Err(RealtorLicenseError::OpcosUnreachable),
        status if status.is_server_error() => Err(RealtorLicenseError::OpcosUnreachable),
        _ => Err(RealtorLicenseError::InvalidResponse),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn unreachable_returns_error() {
        let client = Client::new();
        let result =
            fetch_license_status(&client, "http://127.0.0.1:9", "token", "A123456789").await;
        assert!(matches!(result, Err(RealtorLicenseError::OpcosUnreachable)));
    }
}
