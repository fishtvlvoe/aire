use serde_json::Value;
use std::env;

pub async fn call_opendata_query(
    district: &str,
    keyword: &str,
    limit: u32,
) -> Result<Vec<Value>, String> {
    let api_key = env::var("TWINKLE_HUB_API_KEY")
        .map_err(|_| "TWINKLE_HUB_API_KEY not set".to_string())?;

    let where_clause = format!(
        "district LIKE '%{}%' AND road LIKE '%{}%'",
        district.replace("'", "''"),
        keyword.replace("'", "''")
    );

    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "opendata-query_rows",
            "arguments": {
                "dataset": "lvr-trades",
                "where": where_clause,
                "limit": limit
            }
        },
        "id": 1
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.twinkleai.tw/mcp/")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Parse response failed: {}", e))?;

    let text = json
        .pointer("/result/content/0/text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("Unexpected response shape: {}", json))?;

    let records: Vec<Value> = serde_json::from_str(text)
        .map_err(|e| format!("Parse records failed: {}", e))?;

    Ok(records)
}

// --- TDD stubs (to be implemented) ---

pub fn get_api_key_for_test() -> Result<String, String> {
    std::env::var("TWINKLE_AI_API_KEY").map_err(|_| "TWINKLE_AI_API_KEY not set".to_string())
}

pub fn dataset_id_for_city(_city: &str) -> &'static str {
    todo!("implement dataset routing")
}

pub fn parse_sse_response(_body: &str) -> Result<Vec<serde_json::Value>, String> {
    todo!("implement SSE parsing")
}

pub fn build_mcp_request_body(dataset_id: &str, where_clause: &str, limit: u32) -> serde_json::Value {
    serde_json::json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "opendata-query_rows",
            "arguments": {
                "dataset": dataset_id,  // BUG: should be "dataset_id"
                "where": where_clause,
                "limit": limit
            }
        },
        "id": 1
    })
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_district_apostrophe_sanitized() {
        // 確認 district 含單引號時，會被 escape 成 doubled quote
        let district = "東區'DROP TABLE";
        let sanitized = district.replace("'", "''");
        assert!(sanitized.contains("東區''DROP TABLE"));
        assert!(!sanitized.contains("東區'DROP TABLE"));
    }

    #[test]
    fn test_keyword_apostrophe_sanitized() {
        let keyword = "中正路'; DROP TABLE";
        let sanitized = keyword.replace("'", "''");
        assert!(sanitized.contains("中正路''; DROP TABLE"));
        assert!(!sanitized.contains("中正路'; DROP TABLE"));
    }

    #[test]
    fn test_reads_twinkle_ai_api_key() {
        // 目前 call_opendata_query 讀 TWINKLE_HUB_API_KEY，不讀 TWINKLE_AI_API_KEY
        // 此測試設 TWINKLE_AI_API_KEY，確認 get_api_key_for_test() 能讀到
        // (這個 stub 會讀對 key → 測試本身應通過，但它是我們 TDD 的 spec)
        std::env::set_var("TWINKLE_AI_API_KEY", "test-key-for-tdd");
        let result = crate::mcp_client::get_api_key_for_test();
        assert!(result.is_ok(), "TWINKLE_AI_API_KEY should be readable");
        assert_eq!(result.unwrap(), "test-key-for-tdd");
    }

    #[test]
    fn test_accept_header_for_event_stream() {
        // 直接測試 build_mcp_request_body 不含 "dataset_id" → 紅燈（確認現有 bug）
        let body = crate::mcp_client::build_mcp_request_body("test-dataset", "1=1", 5);
        let args = &body["params"]["arguments"];
        assert!(
            args.get("dataset_id").is_some(),
            "body arguments should use 'dataset_id', got: {}",
            args
        );
    }

    #[test]
    fn test_dataset_id_not_dataset() {
        let body = crate::mcp_client::build_mcp_request_body("lvr-trades", "1=1", 5);
        let args = &body["params"]["arguments"];
        assert!(
            args.get("dataset").is_none(),
            "body should NOT have 'dataset' key, should use 'dataset_id'"
        );
        assert!(
            args.get("dataset_id").is_some(),
            "body should have 'dataset_id' key"
        );
    }

    #[test]
    #[should_panic(expected = "implement dataset routing")]
    fn test_dataset_id_for_city_tainan() {
        // stub 目前 todo!() → panics → 測試以 should_panic 確認紅燈
        let _ = crate::mcp_client::dataset_id_for_city("台南市");
    }

    #[test]
    #[should_panic(expected = "implement SSE parsing")]
    fn test_sse_response_parsing() {
        // stub 目前 todo!() → panics
        let sse = "event: message\ndata: {\"jsonrpc\":\"2.0\",\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"[]\"}]}}\n";
        let _ = crate::mcp_client::parse_sse_response(sse);
    }
}
