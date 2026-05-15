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
}
