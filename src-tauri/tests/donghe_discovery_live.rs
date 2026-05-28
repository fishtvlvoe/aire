use aire_lib::land_registry::{
    apis::{
        StaticApiKeyProvider, address_to_parcel::AddressToParcelApi,
    },
    cache::LandRegistryCache,
};
use serde_json::json;
use std::sync::Arc;

// 東和路測試地址
const ADDRESS: &str = "台南市東區東和路47號3樓";
const OUTPUT_PATH: &str = "/tmp/aire-donghe-live-discovery.json";

fn required_env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is required"))
}

#[tokio::test]
#[ignore]
async fn donghe_address_r02_and_cop_live_probe() {
    let mut results = json!({});

    // ========== R02 查詢 ==========
    println!("=== R02: {ADDRESS} ===");
    let r02_result = aire_lib::land_registry::easymap_r02::discover_easymap_r02_address(ADDRESS).await;
    match &r02_result {
        Ok(discovery) => {
            println!("R02 status: OK, parcels={}", discovery.parcels.len());
            for (i, p) in discovery.parcels.iter().take(10).enumerate() {
                println!("  [{i}] parcel_id={} section={:?} land_no={:?} building_no={:?}",
                    p.parcel_id, p.section_name, p.lot_number, p.building_number);
            }
            results["r02"] = json!({
                "success": true,
                "parcel_count": discovery.parcels.len(),
                "parcels": discovery.parcels.iter().take(25).map(|p| json!({
                    "parcel_id": p.parcel_id,
                    "address": p.address,
                    "section_name": p.section_name,
                    "section_code": p.section_code,
                    "land_no": p.lot_number,
                    "building_no": p.building_number,
                    "source": p.source,
                    "trusted_for_pdf": p.trusted_for_pdf,
                })).collect::<Vec<_>>(),
            });
        }
        Err(e) => {
            println!("R02 error: {:?}", e);
            results["r02"] = json!({
                "success": false,
                "error": format!("{:?}", e),
            });
        }
    }

    // ========== COP MOI_API_036 查詢 ==========
    println!("\n=== COP MOI_API_036: {ADDRESS} ===");
    let base_url = std::env::var("LAND_REGISTRY_API_BASE_URL")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/api".to_string());
    let token_endpoint = std::env::var("LAND_REGISTRY_TOKEN_ENDPOINT")
        .unwrap_or_else(|_| "https://copapi.moi.gov.tw/cp/getToken".to_string());

    let cop_result = if let (Ok(client_id), Ok(client_secret)) = (
        std::env::var("LAND_REGISTRY_CLIENT_ID"),
        std::env::var("LAND_REGISTRY_CLIENT_SECRET"),
    ) {
        let key_provider = Arc::new(StaticApiKeyProvider::with_token_endpoint(
            client_id, client_secret, token_endpoint,
        ));
        let cache = LandRegistryCache::new_in_memory();
        let query_date_provider = Arc::new(move || chrono::Local::now().format("%Y-%m-%d").to_string());
        let address_api = AddressToParcelApi::new(
            base_url.clone(),
            cache,
            key_provider.clone(),
            query_date_provider,
        );

        match address_api.lookup(ADDRESS).await {
            Ok(parcels) => {
                println!("COP MOI_API_036 count={}", parcels.len());
                for (i, p) in parcels.iter().take(10).enumerate() {
                    println!("  [{i}] parcel_id={} section={:?} land_no={} building_no={}",
                        p.parcel_id, p.section_name, p.lot_number, p.building_number);
                }
                json!({
                    "success": true,
                    "parcel_count": parcels.len(),
                    "parcels": parcels.iter().take(25).map(|p| json!({
                        "parcel_id": p.parcel_id,
                        "address": p.address,
                        "section_name": p.section_name,
                        "section_code": p.section_code,
                        "land_no": p.lot_number,
                        "building_no": p.building_number,
                        "source": p.source,
                        "trusted_for_pdf": p.trusted_for_pdf,
                    })).collect::<Vec<_>>(),
                })
            }
            Err(e) => {
                println!("COP error: {}", e);
                json!({
                    "success": false,
                    "error": e.to_string(),
                })
            }
        }
    } else {
        println!("COP: skipped (no credentials)");
        json!({
            "success": false,
            "skipped": true,
            "reason": "LAND_REGISTRY_CLIENT_ID or LAND_REGISTRY_CLIENT_SECRET not set",
        })
    };
    results["cop_moi_api_036"] = cop_result;

    // ========== COP MOI_API_015（若有R02地號，反查建號） ==========
    if let Some(r02_parcels) = results["r02"]["parcels"].as_array() {
        if !r02_parcels.is_empty() {
            let first = &r02_parcels[0];
            if let (Some(unit), Some(sec), Some(land_no)) = (
                first["section_code"].as_str(),
                first["section_code"].as_str(),
                first["land_no"].as_str(),
            ) {
                // 需要 land_office 作為 UNIT
                let land_office = first["land_office"].as_str().unwrap_or(sec);
                println!("\n=== COP MOI_API_015: 地號→建號 ===");
                println!("  UNIT={land_office}, SEC={sec}, NO={land_no}");
                // 這裡理論上要用實際的 land_office code，但先記錄結構
                results["cop_moi_api_015_input"] = json!({
                    "unit": land_office,
                    "sec": sec,
                    "no": land_no,
                });
            }
        }
    }

    // ========== 摘要 ==========
    results["summary"] = json!({
        "address": ADDRESS,
        "r02_found": results["r02"]["success"].as_bool().unwrap_or(false),
        "r02_count": results["r02"]["parcel_count"].as_u64().unwrap_or(0),
        "cop_036_found": results["cop_moi_api_036"]["success"].as_bool().unwrap_or(false),
        "cop_036_count": results["cop_moi_api_036"]["parcel_count"].as_u64().unwrap_or(0),
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });

    std::fs::write(OUTPUT_PATH, serde_json::to_string_pretty(&results).unwrap()).unwrap();
    println!("\n=== 結果已寫入 {OUTPUT_PATH} ===");
    println!("{}", serde_json::to_string_pretty(&results["summary"]).unwrap());
}
