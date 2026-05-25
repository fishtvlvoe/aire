use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::db::registry_query_runs::{get_registry_query_run_row, RegistryQueryRunRow};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RegistryRunSyncResult {
    pub synced: bool,
    pub remote_run_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RegistryRunSyncPayload {
    pub run_id: String,
    pub case_id: Option<String>,
    pub registry_key: String,
    pub input_kind: String,
    pub input_address: Option<String>,
    pub section_code: Option<String>,
    pub section_name: Option<String>,
    pub land_no: Option<String>,
    pub building_no: Option<String>,
    pub confirmation_status: String,
    pub status: String,
    pub cache_hit: bool,
    pub source_run_id: Option<String>,
    pub total_cost_cents: i64,
    pub r02_payload_json: Option<Value>,
    pub cop_payload_json: Option<Value>,
    pub error_summary_json: Option<Value>,
    pub created_at: i64,
}

pub fn build_saas_sync_payload(row: RegistryQueryRunRow) -> RegistryRunSyncPayload {
    RegistryRunSyncPayload {
        run_id: row.id,
        case_id: row.case_id,
        registry_key: row.registry_key,
        input_kind: row.input_kind,
        input_address: row.input_address,
        section_code: row.section_code,
        section_name: row.section_name,
        land_no: row.land_no,
        building_no: row.building_no,
        confirmation_status: row.confirmation_status,
        status: row.status,
        cache_hit: row.cache_hit,
        source_run_id: row.source_run_id,
        total_cost_cents: row.total_cost_cents,
        r02_payload_json: row.r02_payload_json,
        cop_payload_json: row.cop_payload_json,
        error_summary_json: row.error_summary_json,
        created_at: row.created_at,
    }
}

pub async fn sync_registry_query_run_to_saas(
    client: &Client,
    base_url: &str,
    token: &str,
    payload: &RegistryRunSyncPayload,
) -> Result<RegistryRunSyncResult, String> {
    if token.trim().is_empty() {
        return Err("opcos_token_required".to_string());
    }
    if payload_contains_secret(payload) {
        return Err("sync_payload_contains_secret".to_string());
    }

    let url = format!(
        "{}/api/aire/registry-query-runs",
        base_url.trim_end_matches('/')
    );
    let response = client
        .post(url)
        .bearer_auth(token)
        .json(payload)
        .send()
        .await
        .map_err(|error| format!("saas_sync_network_error: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("saas_sync_body_error: {error}"))?;
    if !status.is_success() {
        return Err(format!("saas_sync_http_{}: {}", status.as_u16(), body));
    }

    let parsed = serde_json::from_str::<Value>(&body).unwrap_or(Value::Null);
    Ok(RegistryRunSyncResult {
        synced: true,
        remote_run_id: parsed
            .get("remoteRunId")
            .or_else(|| parsed.get("id"))
            .and_then(Value::as_str)
            .map(str::to_string),
    })
}

#[tauri::command]
pub async fn land_registry_sync_query_run_to_saas(
    db: tauri::State<'_, crate::DbState>,
    ipc: tauri::State<'_, crate::AsyncIpcState>,
    run_id: String,
) -> Result<RegistryRunSyncResult, String> {
    let payload = {
        let conn = db.0.lock().map_err(|error| format!("db lock poisoned: {error}"))?;
        let row = get_registry_query_run_row(&conn, &run_id).map_err(|error| error.to_string())?;
        build_saas_sync_payload(row)
    };
    sync_registry_query_run_to_saas(
        &ipc.http_client,
        &ipc.opcos_base_url,
        &ipc.opcos_token,
        &payload,
    )
    .await
}

fn payload_contains_secret(payload: &RegistryRunSyncPayload) -> bool {
    let body = serde_json::to_string(payload).unwrap_or_default().to_lowercase();
    ["client_secret", "access_token", "authorization", "bearer "]
        .iter()
        .any(|needle| body.contains(needle))
}

#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::matchers::{bearer_token, body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn sample_payload() -> RegistryRunSyncPayload {
        RegistryRunSyncPayload {
            run_id: "run-r02-001".to_string(),
            case_id: Some("case-001".to_string()),
            registry_key: "r02:1556:unknown-land:00204000".to_string(),
            input_kind: "address".to_string(),
            input_address: Some("台南市東區裕農路288巷17號8樓之1".to_string()),
            section_code: Some("1556".to_string()),
            section_name: Some("富強段".to_string()),
            land_no: None,
            building_no: Some("00204000".to_string()),
            confirmation_status: "candidate_unconfirmed".to_string(),
            status: "candidate_unconfirmed".to_string(),
            cache_hit: false,
            source_run_id: None,
            total_cost_cents: 0,
            r02_payload_json: Some(serde_json::json!({"adapter": "easymap_r02_desktop"})),
            cop_payload_json: None,
            error_summary_json: None,
            created_at: 1_779_648_000,
        }
    }

    #[tokio::test]
    async fn posts_registry_run_payload_to_saas_with_bearer_token() {
        let server = MockServer::start().await;
        let payload = sample_payload();
        Mock::given(method("POST"))
            .and(path("/api/aire/registry-query-runs"))
            .and(bearer_token("test-token"))
            .and(body_json(&payload))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_json(serde_json::json!({"remoteRunId": "remote-001"})),
            )
            .mount(&server)
            .await;

        let result = sync_registry_query_run_to_saas(
            &Client::new(),
            &server.uri(),
            "test-token",
            &payload,
        )
        .await
        .unwrap();

        assert!(result.synced);
        assert_eq!(result.remote_run_id.as_deref(), Some("remote-001"));
    }

    #[tokio::test]
    async fn refuses_to_sync_payload_that_contains_secret_markers() {
        let mut payload = sample_payload();
        payload.r02_payload_json = Some(serde_json::json!({
            "client_secret": "must-not-sync"
        }));

        let error = sync_registry_query_run_to_saas(
            &Client::new(),
            "https://aire.opcos.me",
            "test-token",
            &payload,
        )
        .await
        .unwrap_err();

        assert_eq!(error, "sync_payload_contains_secret");
    }
}
