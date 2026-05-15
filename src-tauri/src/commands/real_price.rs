use serde_json::Value;

#[tauri::command]
pub async fn query_real_price(
    district: String,
    keyword: String,
    limit: u32,
) -> Result<Vec<Value>, String> {
    crate::mcp_client::call_opendata_query(&district, &keyword, limit).await
}
