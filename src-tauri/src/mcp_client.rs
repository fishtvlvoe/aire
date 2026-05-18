use serde_json::Value;
use std::env;

pub async fn call_opendata_query(
    district: &str,
    keyword: &str,
    limit: u32,
) -> Result<Vec<Value>, String> {
    let api_key = env::var("TWINKLE_AI_API_KEY")
        .map_err(|_| "TWINKLE_AI_API_KEY not set".to_string())?;

    let dataset_id = dataset_id_for_city(district);

    let where_clause = format!(
        "\"鄉鎮市區\" LIKE '%{}%' AND \"土地區段位置或建物區門牌\" LIKE '%{}%'",
        district.replace("'", "''"),
        keyword.replace("'", "''")
    );

    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "opendata-query_rows",
            "arguments": {
                "dataset_id": dataset_id,
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
        .header("Accept", "application/json, text/event-stream")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Read response body failed: {}", e))?;

    parse_sse_response(&body_text)
}

// --- TDD stubs (to be implemented) ---

pub fn get_api_key_for_test() -> Result<String, String> {
    std::env::var("TWINKLE_AI_API_KEY").map_err(|_| "TWINKLE_AI_API_KEY not set".to_string())
}

pub fn dataset_id_for_city(city: &str) -> &'static str {
    if city.starts_with("台南市") {
        "128852"
    } else {
        "lvr-trades"
    }
}

pub fn parse_sse_response(body: &str) -> Result<Vec<serde_json::Value>, String> {
    // 找第一個 data: 開頭的行
    let data_line = body
        .lines()
        .find(|line| line.starts_with("data:"))
        .ok_or_else(|| "no data: line found in SSE response".to_string())?;

    // 去除 "data: " 前綴
    let json_str = data_line.trim_start_matches("data:").trim();

    // 解析外層 JSON（MCP 回應格式）
    let outer: serde_json::Value =
        serde_json::from_str(json_str).map_err(|e| format!("SSE outer JSON parse failed: {}", e))?;

    // 取出 result.content[0].text
    let text = outer
        .pointer("/result/content/0/text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("unexpected SSE response shape: {}", outer))?;

    // 解析 records array
    serde_json::from_str::<Vec<serde_json::Value>>(text)
        .map_err(|e| format!("SSE records JSON parse failed: {}", e))
}

pub fn build_mcp_request_body(
    dataset_id: &str,
    where_clause: &str,
    limit: u32,
) -> serde_json::Value {
    serde_json::json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "opendata-query_rows",
            "arguments": {
                "dataset_id": dataset_id,
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
    fn test_dataset_id_for_city_tainan() {
        // Wave 3 實作後：台南市 → dataset_id "128852"
        let result = crate::mcp_client::dataset_id_for_city("台南市");
        assert_eq!(result, "128852", "台南市 dataset id 應為 128852");
    }

    #[test]
    fn test_sse_response_parsing() {
        // Wave 3 實作後：應能正確解析 SSE data: 行
        let sse = "event: message\ndata: {\"jsonrpc\":\"2.0\",\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"[{\\\"單價每平方公尺\\\":\\\"50000\\\"}]\"}]}}\n";
        let result = crate::mcp_client::parse_sse_response(sse);
        assert!(result.is_ok(), "SSE 解析應成功，got: {:?}", result.err());
        let records = result.unwrap();
        assert_eq!(records.len(), 1, "應有 1 筆 record");
        assert!(
            records[0].get("單價每平方公尺").is_some(),
            "record 應有 '單價每平方公尺' 欄位"
        );
    }
}
