use aire_lib::land_registry::apis::nlsc_cadastral::NlscCadastralClient;
use aire_lib::land_registry::errors::LandRegistryError;
use serde_json::json;

const ADDRESS_WITH_FLOOR: &str = "台南市東區裕農路288巷17號8樓之1";
const ADDRESS_NO_FLOOR: &str = "台南市東區裕農路288巷17號";
const NLSC_BASE_URL: &str = "https://api.nlsc.gov.tw";
const OUTPUT_PATH: &str = "/tmp/aire-nlsc-cad-yunong-live.json";

fn classify_result<T: serde::Serialize>(result: Result<T, LandRegistryError>) -> serde_json::Value {
    match result {
        Ok(value) => json!({
            "success": true,
            "blocked_reason": null,
            "value": value,
        }),
        Err(LandRegistryError::NlscPermissionDenied { message }) => json!({
            "success": false,
            "blocked_reason": "nlsc_permission_denied",
            "message": message,
        }),
        Err(error) => json!({
            "success": false,
            "blocked_reason": "error",
            "message": error.to_string(),
        }),
    }
}

#[tokio::test]
#[ignore = "hits live NLSC CAD endpoints for 裕農路 evidence"]
async fn yunong_nlsc_cad_minimal_probe() {
    let client = NlscCadastralClient::new(NLSC_BASE_URL);
    let address_with_floor = classify_result(client.address_query_land(ADDRESS_WITH_FLOOR, 10).await);
    let address_no_floor = classify_result(client.address_query_land(ADDRESS_NO_FLOOR, 10).await);
    let known_land_full = classify_result(client.cadas_land_info("D", "1556", "00700000").await);
    let known_land_simple = classify_result(client.cadas_land_info("D", "1556", "70").await);

    let summary = json!({
        "address": ADDRESS_WITH_FLOOR,
        "base_url": NLSC_BASE_URL,
        "provenance_note": "NLSC CAD can only be an address/parcel discovery fallback. It is not formal transcript data and must stay trusted_for_pdf=false until MOI transcript API or manual confirmation verifies it.",
        "cad_009": {
            "with_floor": address_with_floor,
            "no_floor": address_no_floor,
        },
        "cad_011": {
            "known_land_full": known_land_full,
            "known_land_simple": known_land_simple,
        },
    });

    std::fs::write(OUTPUT_PATH, serde_json::to_string_pretty(&summary).unwrap()).unwrap();
    println!("wrote {OUTPUT_PATH}");
}
