/// Phase 2 紅燈測試 — land-registry-client
/// 對應 spec: land-registry-client，失敗點 LRC-001 ~ LRC-015
/// 這些測試 import 尚未實作的模組路徑，cargo test 會編譯失敗 = 預期紅燈行為
#[cfg(test)]
mod tests {
    use crate::land_registry::client::{
        LandRegistryClient, ClientConfig, TokenCache, build_auth_header,
        is_token_valid, is_token_expired,
    };
    use crate::land_registry::errors::LandRegistryError;
    use std::time::Duration;

    // LRC-001: CLIENT_ID 或 CLIENT_SECRET 含特殊字元必須正確 base64url encode
    // 若 Authorization header 格式錯誤，token endpoint 回 400 或 401
    #[test]
    fn should_base64_encode_credentials_with_special_chars() {
        let client_id = "user:with+special=chars";
        let client_secret = "pass:word+equals=sign";
        let header = build_auth_header(client_id, client_secret);
        // RFC 7617: credentials 必須先 concat 再 base64，不能對個別字元做 url-encode
        // 特殊字元在 base64 輸出中已被編碼，不應出現原始的 `:`、`+`、`=`（除了 base64 padding）
        assert!(header.starts_with("Basic "), "Authorization header must start with 'Basic '");
        // 驗證 base64 解碼後能還原原始 credentials
        let encoded = header.trim_start_matches("Basic ");
        let decoded = base64_decode_standard(encoded).expect("Must be valid base64");
        let expected = format!("{}:{}", client_id, client_secret);
        assert_eq!(decoded, expected, "Decoded credentials must match original");
    }

    // 輔助函式：標準 base64 decode（Phase 3 實作會用 base64 crate）
    fn base64_decode_standard(s: &str) -> Result<String, String> {
        // 紅燈期：此函式的存在用於測試結構完整性
        // Phase 3 實作時替換為 base64::engine::general_purpose::STANDARD.decode(s)
        unimplemented!("base64_decode_standard: Phase 3 will implement with base64 crate")
    }

    // LRC-002: token endpoint 必須用 POST 不是 GET
    // 協作平台官方文件若版本更新改回 POST，client 必須跟著 POST
    #[test]
    fn should_use_get_method_for_token_endpoint() {
        // 注意：此測試名稱保留原失敗矩陣名稱（GET），但 spec AC 要求 POST
        // 紅燈期：LandRegistryClient 不存在，此測試會在編譯時失敗
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        let recorded = client.last_token_request_method();
        // 失敗矩陣記錄的反向驗證：用 GET 會失敗，正確實作必須用 POST
        assert_eq!(recorded, "POST", "Token endpoint MUST use POST, not GET");
    }

    // LRC-003: token endpoint 5xx 不超過重試預算（不等同業務請求重試）
    #[test]
    fn should_not_retry_token_endpoint_on_5xx_beyond_budget() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        // mock token server 回 500，client 只能嘗試 1 次（不重試 token endpoint）
        let mock_call_count = client.token_request_attempt_count_on_5xx();
        assert_eq!(mock_call_count, 1, "Token endpoint 5xx: no retry allowed");
    }

    // LRC-004: JWT payload base64url decode 不加 padding（JWT 標準）
    // 若用標準 base64（有 padding）decode 無 padding 的 JWT，會報錯誤誤判 token 無效
    #[test]
    fn should_decode_jwt_payload_without_padding() {
        // 建構一個 exp 在未來的 JWT（payload 無 = padding）
        let jwt_no_padding = make_test_jwt_no_padding(chrono::Utc::now().timestamp() + 3600);
        let result = is_token_valid(&jwt_no_padding);
        assert!(result, "JWT without base64url padding must be decoded as valid");
    }

    fn make_test_jwt_no_padding(exp: i64) -> String {
        // 紅燈期：依賴 crate::land_registry::client 的輔助函式
        unimplemented!("make_test_jwt_no_padding: Phase 3 implement")
    }

    // LRC-005: exp 是 Unix epoch seconds（不是 milliseconds）
    // 若誤當 milliseconds，過期 token 會被認為有效 317 年
    #[test]
    fn should_interpret_exp_as_unix_seconds_not_milliseconds() {
        // exp = 1 秒前（過期）
        let past_exp = chrono::Utc::now().timestamp() - 1;
        let expired_jwt = make_test_jwt_no_padding(past_exp);
        assert!(
            is_token_expired(&expired_jwt),
            "Token with exp = now - 1s must be treated as expired (seconds, not ms)"
        );
    }

    // LRC-006: time_sync 未初始化時，is_token_expired 不能無限 loop
    // synced_now() 回傳 epoch 0 → 所有 token 都被誤判過期
    #[test]
    fn should_handle_uninitialized_time_sync_gracefully() {
        use crate::land_registry::time_sync::TimeSyncState;
        // 模擬 time_sync 未初始化（offset = None）
        let uninitialized_state = TimeSyncState::uninitialized();
        let config = ClientConfig::with_time_sync(uninitialized_state);
        let client = LandRegistryClient::new(config);
        // 必須在合理時間內回傳（不 loop）且不 panic
        let result = client.check_token_validity_with_unsynced_clock();
        // 允許回 TimeSkew 或使用 fallback，但不能是無限等待或 panic
        match result {
            Ok(_) | Err(LandRegistryError::TimeSkew { .. }) => { /* acceptable */ }
            Err(other) => panic!("Unexpected error: {:?}", other),
        }
    }

    // LRC-007: reqwest 必須明確設 min TLS 1.2，拒絕 TLS 1.0/1.1
    #[test]
    fn should_reject_tls_10_11_connections() {
        use crate::land_registry::client::TlsVersion;
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        // 嘗試建立 TLS 1.0 連線，必須失敗
        let result = client.test_connect_with_tls_version(TlsVersion::Tls10);
        assert!(
            result.is_err(),
            "TLS 1.0 connection must be rejected; min TLS version = 1.2"
        );
        let result_11 = client.test_connect_with_tls_version(TlsVersion::Tls11);
        assert!(
            result_11.is_err(),
            "TLS 1.1 connection must be rejected; min TLS version = 1.2"
        );
    }

    // LRC-008: Content-Type 必須包含 charset=utf-8（中文地號不會被截斷）
    #[test]
    fn should_set_content_type_with_charset_utf8() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        let recorded_headers = client.capture_request_headers_for_business_call();
        let content_type = recorded_headers
            .get("content-type")
            .expect("content-type header must be present");
        assert_eq!(
            content_type, "application/json; charset=utf-8",
            "Content-Type must include charset=utf-8 for correct UTF-8 JSON body handling"
        );
    }

    // LRC-009: 重試之間必須有 exponential backoff（不能立即重試）
    #[test]
    fn should_apply_exponential_backoff_between_retries() {
        use std::time::Instant;
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        let start = Instant::now();
        // 觸發 2 次重試（server 回 5xx）
        let _ = client.call_with_mock_5xx_server(2);
        let elapsed = start.elapsed();
        // backoff level 1 = 100ms, level 2 = 200ms，至少等 300ms
        assert!(
            elapsed >= Duration::from_millis(300),
            "Exponential backoff must add at least 300ms for 2 retries, elapsed={:?}",
            elapsed
        );
    }

    // LRC-010: 401 觸發 token refresh，若 refresh 也失敗必須回 AuthFailed（不繼續用舊 token）
    #[test]
    fn should_surface_auth_failed_when_token_refresh_also_fails() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        // 模擬 keychain 不可用，token refresh 必定失敗
        let result = client.call_with_broken_keychain();
        assert!(
            matches!(result, Err(LandRegistryError::AuthFailed { .. })),
            "When token refresh fails, must surface AuthFailed, not retry with stale token"
        );
    }

    // LRC-011: 4xx（除 401）不重試 — 400 永不重試
    #[test]
    fn should_not_retry_on_400_bad_request() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        let call_count = client.call_count_for_mock_400_server();
        assert_eq!(
            call_count, 1,
            "400 Bad Request must not be retried; call_count must be 1"
        );
    }

    // LRC-012: 並行請求同時發現 token 過期，只能有 1 次 token refresh
    #[test]
    fn should_deduplicate_concurrent_token_refresh_requests() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        // 同時觸發 N=5 個並行請求，token 過期
        let token_refresh_count = client.concurrent_calls_token_refresh_count(5);
        assert_eq!(
            token_refresh_count, 1,
            "Only 1 token refresh must occur despite N concurrent callers"
        );
    }

    // LRC-013: unresponsive server 必須在設定時間內 timeout（不永久掛起）
    #[test]
    fn should_timeout_within_configured_seconds_on_unresponsive_server() {
        use std::time::Instant;
        let config = ClientConfig::with_timeout(Duration::from_secs(3));
        let client = LandRegistryClient::new(config);
        let start = Instant::now();
        let result = client.call_unresponsive_server();
        let elapsed = start.elapsed();
        assert!(
            matches!(result, Err(LandRegistryError::Network { .. })),
            "Unresponsive server must surface Network error"
        );
        assert!(
            elapsed < Duration::from_secs(5),
            "Must timeout within 5s (configured: 3s), elapsed={:?}",
            elapsed
        );
    }

    // LRC-014: env var 未設定時回明確的 config error，不 panic
    #[test]
    fn should_return_config_error_when_env_vars_missing() {
        let result = LandRegistryClient::new_from_env_without_required_vars();
        assert!(
            matches!(result, Err(LandRegistryError::Internal { .. })),
            "Missing env vars must surface Internal (config) error, not panic or empty URL"
        );
    }

    // LRC-015: 每個請求都必須帶 User-Agent header
    #[test]
    fn should_send_user_agent_header_with_every_request() {
        let config = ClientConfig::default_test();
        let client = LandRegistryClient::new(config);
        let headers = client.capture_request_headers_for_business_call();
        let ua = headers.get("user-agent").expect("user-agent header must be present");
        assert!(!ua.is_empty(), "User-Agent header must not be empty");
    }
}
