use aire_lib::land_registry::apis::{
    post_json_with_key, require_api_key, StaticApiKeyProvider,
};
use serde_json::json;

const OUTPUT_PATH: &str = "/tmp/aire-donghe-moi-api-015.json";

#[tokio::test]
#[ignore]
async fn donghe_moi_api_015_land_to_building_probe() {
    let base_url = std::env::var("LAND_REGISTRY_API_BASE_URL")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/api".to_string());
    let token_endpoint = std::env::var("LAND_REGISTRY_TOKEN_ENDPOINT")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/getToken".to_string());

    let client_id = std::env::var("LAND_REGISTRY_CLIENT_ID").expect("need LAND_REGISTRY_CLIENT_ID");
    let client_secret = std::env::var("LAND_REGISTRY_CLIENT_SECRET").expect("need LAND_REGISTRY_CLIENT_SECRET");

    let key_provider = std::sync::Arc::new(StaticApiKeyProvider::with_token_endpoint(
        client_id, client_secret, token_endpoint,
    ));
    let credentials = require_api_key(key_provider.as_ref()).unwrap();
    let http_client = reqwest::Client::new();

    // 東和路 R02 查到的地號：UNIT=DC, SEC=1514, NO=00022132
    let payload = json!([{"UNIT": "DC", "SEC": "1514", "NO": "00022132"}]);

    println!("=== COP MOI_API_015 QueryByLandNo ===");
    println!("Payload: {}", serde_json::to_string(&payload).unwrap());

    let result = post_json_with_key(
        &http_client,
        &base_url,
        "/BuildingNo/1.0/QueryByLandNo",
        &credentials,
        &payload,
    ).await;

    let output = match result {
        Ok((status, response)) => {
            println!("HTTP status: {}", status);
            println!("COP STATUS: {:?}", response.get("STATUS"));
            println!("COP CODE: {:?}", response.get("CODE"));
            println!("COP RETURNROWS: {:?}", response.get("RETURNROWS"));
            println!("Response: {}", serde_json::to_string_pretty(&response).unwrap());
            json!({
                "success": response.get("STATUS").and_then(|s| s.as_i64()) == Some(1),
                "http_status": status,
                "cop_status": response.get("STATUS").cloned(),
                "cop_code": response.get("CODE").cloned(),
                "cop_message": response.get("MESSAGE").cloned(),
                "return_rows": response.get("RETURNROWS").cloned(),
                "response": response,
            })
        }
        Err(e) => {
            println!("Error: {}", e);
            json!({
                "success": false,
                "error": e.to_string(),
            })
        }
    };

    std::fs::write(OUTPUT_PATH, serde_json::to_string_pretty(&output).unwrap()).unwrap();
    println!("\n=== 結果已寫入 {OUTPUT_PATH} ===");
}
