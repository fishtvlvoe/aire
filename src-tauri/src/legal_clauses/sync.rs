use reqwest::{Client, StatusCode};
use serde::Deserialize;
use std::time::Duration;

use super::{LegalClause, LegalClausesError};

#[derive(Deserialize)]
struct VersionResponse {
    version: String,
}

#[derive(Deserialize)]
struct LawResponse {
    law_id: String,
    title: String,
    content_markdown: String,
    version_date: String,
    fetched_at: String,
    source_url: String,
}

pub async fn fetch_version(
    client: &Client,
    base_url: &str,
    token: &str,
) -> Result<String, LegalClausesError> {
    let url = format!(
        "{}/v1/legal-clauses/version",
        base_url.trim_end_matches('/')
    );
    let response = client
        .get(url)
        .bearer_auth(token)
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .map_err(map_network_error)?;

    match response.status() {
        StatusCode::OK => {
            let body: VersionResponse = response
                .json()
                .await
                .map_err(|_| LegalClausesError::OpcosUnreachable)?;
            Ok(body.version)
        }
        StatusCode::UNAUTHORIZED => Err(LegalClausesError::OpcosUnreachable),
        status if status.is_server_error() => Err(LegalClausesError::OpcosUnreachable),
        _ => Err(LegalClausesError::OpcosUnreachable),
    }
}

pub async fn fetch_law(
    client: &Client,
    base_url: &str,
    token: &str,
    law_id: &str,
) -> Result<LegalClause, LegalClausesError> {
    let url = format!(
        "{}/v1/legal-clauses/{}",
        base_url.trim_end_matches('/'),
        law_id
    );
    let response = client
        .get(url)
        .bearer_auth(token)
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .map_err(map_network_error)?;

    match response.status() {
        StatusCode::OK => {
            let body: LawResponse = response
                .json()
                .await
                .map_err(|_| LegalClausesError::OpcosUnreachable)?;
            Ok(LegalClause {
                law_id: body.law_id,
                title: body.title,
                content_markdown: body.content_markdown,
                version_date: body.version_date,
                fetched_at: body.fetched_at,
                source_url: body.source_url,
            })
        }
        StatusCode::NOT_FOUND => Err(LegalClausesError::LawNotFound(law_id.to_string())),
        StatusCode::UNAUTHORIZED => Err(LegalClausesError::OpcosUnreachable),
        status if status.is_server_error() => Err(LegalClausesError::OpcosUnreachable),
        _ => Err(LegalClausesError::OpcosUnreachable),
    }
}

fn map_network_error(_err: reqwest::Error) -> LegalClausesError {
    LegalClausesError::OpcosUnreachable
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn fetch_version_unreachable() {
        let client = Client::new();
        let result = fetch_version(&client, "http://127.0.0.1:9", "token").await;
        assert!(matches!(result, Err(LegalClausesError::OpcosUnreachable)));
    }

    #[tokio::test]
    async fn fetch_law_unreachable() {
        let client = Client::new();
        let result = fetch_law(&client, "http://127.0.0.1:9", "token", "missing").await;
        assert!(matches!(result, Err(LegalClausesError::OpcosUnreachable)));
    }
}
