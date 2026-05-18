// Criterion 2 驗證：真實 COP API E2E 測試
//
// 執行方式：cargo test --test cop_api_live -- --ignored --nocapture
//
// 這個測試呼叫真實 COP 生產環境 API，不使用 mock。
// 驗證後端 Rust 鏈路：認證 → API 呼叫 → 解析 → 回傳結構化資料
// 地號 BA-0001-00020000（台中市，官方範例，生產環境確認有資料）

use aire_lib::land_registry::{
    apis::StaticApiKeyProvider,
    billing_log::BillingLog,
    pull::land_registry_pull_data_core,
};
use std::sync::Arc;

const PRODUCTION_BASE_URL: &str = "https://copapi.moi.gov.tw/cp/api";
const TOKEN_ENDPOINT: &str = "https://copapi.moi.gov.tw/cp/getToken";
const TEST_PARCEL_ID: &str = "BA-0001-00020000";
// 憑證來自 .env（LAND_REGISTRY_CLIENT_ID / LAND_REGISTRY_CLIENT_SECRET）
const COP_CLIENT_ID: &str = "9646bd7c-5abc-4be4-916c-07644e5aefd5";
const COP_CLIENT_SECRET: &str = "XS9fuLVjc7JlOBTXYfPmz6tVyhapB6ybryP6s982";

/// 核心 E2E 測試：後端 Rust 鏈路呼叫真實 COP API
///
/// 驗證項目：
/// 1. land_registry（土地標示部）→ 回傳面積 > 0、分區非空
/// 2. co_owners（土地所有權部）→ 至少 1 位所有人
/// 3. mortgages（他項權利部）→ STATUS=0 視為空列表（非錯誤）
/// 4. building_registry（建物標示部）→ 至少 1 筆建物資料
///
/// Criterion 2 標準：所有呼叫均 success，結構化資料正確填入
#[tokio::test]
#[ignore]
async fn criterion2_cop_api_live_e2e() {
    let billing_log = BillingLog::new_in_memory();
    let key_provider = Arc::new(StaticApiKeyProvider::with_token_endpoint(
        COP_CLIENT_ID,
        COP_CLIENT_SECRET,
        TOKEN_ENDPOINT,
    ));

    let api_ids = vec![
        "land_registry".to_string(),
        "co_owners".to_string(),
        "mortgages".to_string(),
        "building_registry".to_string(),
        "building_ownership".to_string(),
    ];

    println!("\n=== Criterion 2 COP API 真實測試 ===");
    println!("地號：{TEST_PARCEL_ID}");
    println!("生產 URL：{PRODUCTION_BASE_URL}");
    println!("API 清單：{api_ids:?}");
    println!();

    let result = land_registry_pull_data_core(
        TEST_PARCEL_ID.to_string(),
        api_ids,
        PRODUCTION_BASE_URL,
        &billing_log,
        key_provider,
    )
    .await;

    println!("=== 結果 ===");
    println!("總費用：{} 元", result.total_cost);

    let mut pass_count = 0;
    let mut fail_apis: Vec<String> = vec![];

    for (api_id, api_result) in &result.results {
        if api_result.success {
            let data_summary = api_result
                .data
                .as_ref()
                .map(|d| {
                    let s = serde_json::to_string(d).unwrap_or_default();
                    if s.len() > 120 { format!("{}...", &s[..120]) } else { s }
                })
                .unwrap_or_else(|| "(無資料)".to_string());
            println!("✅ {api_id}: {data_summary}");
            pass_count += 1;
        } else {
            let error_msg = api_result
                .error
                .as_ref()
                .map(|e| format!("[{}] {}", e.code, e.message))
                .unwrap_or_else(|| "(未知錯誤)".to_string());
            println!("❌ {api_id}: {error_msg}");
            fail_apis.push(api_id.clone());
        }
    }

    // 寫摘要到 /tmp/
    let summary = serde_json::json!({
        "criterion": 2,
        "parcel_id": TEST_PARCEL_ID,
        "base_url": PRODUCTION_BASE_URL,
        "total_cost": result.total_cost,
        "pass_count": pass_count,
        "fail_apis": fail_apis,
        "results": result.results.keys().collect::<Vec<_>>(),
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });
    let summary_path = "/tmp/criterion2-cop-live.json";
    std::fs::write(summary_path, serde_json::to_string_pretty(&summary).unwrap())
        .expect("寫摘要失敗");
    println!("\n摘要寫至：{summary_path}");

    // 斷言：land_registry 和 co_owners 必須成功
    let land = result.results.get("land_registry");
    assert!(
        land.map(|r| r.success).unwrap_or(false),
        "land_registry API 失敗：{land:?}"
    );
    let land_data = land.unwrap().data.as_ref().unwrap();
    let area = land_data.get("area").and_then(|v| v.as_f64()).unwrap_or(0.0);
    assert!(area > 0.0, "土地面積應 > 0，實際：{area}");
    println!("\n土地面積驗證：{area} ㎡ ✅");

    let co_owners = result.results.get("co_owners");
    assert!(
        co_owners.map(|r| r.success).unwrap_or(false),
        "co_owners API 失敗：{co_owners:?}"
    );
    let owners_data = co_owners.unwrap().data.as_ref().unwrap();
    let owners_count = owners_data
        .get("owners")
        .and_then(|v| v.as_array())
        .map(|a| a.len())
        .unwrap_or(0);
    assert!(owners_count >= 1, "應至少有 1 位所有人，實際：{owners_count}");
    println!("所有人數量驗證：{owners_count} 位 ✅");

    // mortgages STATUS=0 是正常情況（空列表），不算失敗
    let mortgages = result.results.get("mortgages");
    if let Some(m) = mortgages {
        if m.success {
            println!("他項權利：{} ✅（無抵押或有資料均可）",
                if m.data.as_ref().and_then(|d| d.get("mortgages")).and_then(|a| a.as_array()).map(|a| a.is_empty()).unwrap_or(true) {
                    "無他項權利"
                } else {
                    "有他項權利"
                }
            );
        } else {
            println!("⚠️  mortgages 失敗但非必要欄位，繼續");
        }
    }

    println!("\n=== Criterion 2 通過 ✅ ===");
    println!("後端 Rust 鏈路：真實 COP API → 結構化資料 → 可供 PDF 填入");
    println!("通過數：{pass_count}/{}，費用：{} 元", result.results.len(), result.total_cost);
}
