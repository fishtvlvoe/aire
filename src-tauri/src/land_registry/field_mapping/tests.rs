/// Phase 2 紅燈測試 — land-registry-field-mapping
/// 對應 spec: land-registry-field-mapping，失敗點 LRF-001 ~ LRF-008
/// import 尚未實作的 field_mapping 模組 → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::field_mapping::{
        FieldMappingConfig, FieldMapper, ApiFieldSchema, resolve_json_path,
    };
    use crate::land_registry::errors::LandRegistryError;

    // LRF-001: config 檔案不存在時回 error（不 panic）
    #[test]
    fn should_return_error_not_panic_when_config_file_missing() {
        let result = FieldMappingConfig::load_from_path("/nonexistent/path/field-mapping.toml");
        assert!(
            result.is_err(),
            "Missing config file must return Err, not panic"
        );
        // 錯誤型別必須是 Internal（config 載入失敗）
        assert!(
            matches!(result.unwrap_err(), LandRegistryError::Internal { .. }),
            "Config load error must be LandRegistryError::Internal"
        );
    }

    // LRF-002: api_id lookup 必須 normalize 大小寫（"api_owner" == "API_OWNER"）
    #[test]
    fn should_normalize_api_id_case_before_lookup() {
        let config = FieldMappingConfig::from_toml_str(r#"
            [apis.api_owner]
            target_field = "owner_name"
            json_path = "$.data.name"
        "#).expect("Config parse must succeed");
        let mapper = FieldMapper::new(config);

        // 用大寫 API_ID 查，應該 match 到小寫定義的 api_owner
        let result_upper = mapper.get_target_field("API_OWNER");
        let result_lower = mapper.get_target_field("api_owner");
        let result_mixed = mapper.get_target_field("Api_Owner");
        assert_eq!(result_upper, result_lower, "API ID lookup must be case-insensitive");
        assert_eq!(result_upper, result_mixed, "API ID lookup must be case-insensitive");
    }

    // LRF-003: 巢狀 JSON path（如 $.data.parcel.owner）必須正確解析
    #[test]
    fn should_resolve_nested_json_paths_in_field_mapping() {
        let json = serde_json::json!({
            "data": {
                "parcel": {
                    "owner": "王小明",
                    "area": 150.5
                }
            }
        });
        let name = resolve_json_path(&json, "$.data.parcel.owner")
            .expect("Nested JSON path must resolve");
        assert_eq!(name.as_str().unwrap(), "王小明", "Nested JSON path must resolve correctly");

        let area = resolve_json_path(&json, "$.data.parcel.area")
            .expect("Nested JSON path must resolve");
        assert_eq!(area.as_f64().unwrap(), 150.5, "Nested numeric JSON path must resolve correctly");
    }

    // LRF-004: app 重啟後必須 reload config（不使用舊 mapping）
    #[test]
    fn should_reload_config_on_restart_not_cache_stale_mapping() {
        use std::path::PathBuf;
        // 建立臨時 config 檔
        let tmp_dir = std::env::temp_dir();
        let config_path = tmp_dir.join("test-field-mapping.toml");
        std::fs::write(&config_path, r#"
            [apis.api_v1]
            target_field = "owner_v1"
            json_path = "$.owner"
        "#).expect("Write temp config");

        let mapper = FieldMapper::load_from_path(&config_path).expect("Load config v1");
        assert_eq!(mapper.get_target_field("api_v1").unwrap(), "owner_v1");

        // 模擬 config 更新（v2）
        std::fs::write(&config_path, r#"
            [apis.api_v1]
            target_field = "owner_v2"
            json_path = "$.owner_new"
        "#).expect("Write updated config");

        // reload 後必須使用新 mapping
        let mapper_v2 = FieldMapper::load_from_path(&config_path).expect("Load config v2");
        assert_eq!(
            mapper_v2.get_target_field("api_v1").unwrap(),
            "owner_v2",
            "Config reload must use updated mapping, not stale cache"
        );
        // 清理
        let _ = std::fs::remove_file(&config_path);
    }

    // LRF-005: FieldSchemaChanged error 中的 api_id 必須被 sanitize（防 log injection）
    #[test]
    fn should_sanitize_api_id_in_field_schema_changed_error() {
        // 惡意 api_id 含 newline（log injection 攻擊）
        let malicious_api_id = "api_owner\nINJECTED LOG LINE";
        let err = LandRegistryError::FieldSchemaChanged {
            api_id: malicious_api_id.to_string(),
            expected_fields: vec!["owner_name".to_string()],
            actual_fields: vec!["name".to_string()],
        };
        let display = format!("{}", err);
        // display 輸出中不應包含換行符（防止 log injection）
        assert!(
            !display.contains('\n'),
            "api_id in error display must be sanitized (no newlines for log injection)"
        );
    }

    // LRF-006: billing log 的 api_id 欄位必須接受長 api_id（最長 255 字元）
    #[test]
    fn should_accept_long_api_ids_in_billing_log() {
        use crate::land_registry::billing_log::BillingLogEntry;
        let long_api_id = "a".repeat(255);
        let entry = BillingLogEntry::new(
            "BA-0001-00010001",
            &long_api_id,
            0.5,
            "TXN-001",
        );
        // 建立 entry 不應截斷或 panic
        assert_eq!(entry.api_id().len(), 255, "Long api_id (255 chars) must be accepted without truncation");
    }

    // LRF-007: config 載入時必須驗證 schema version（不接受過時 config 格式）
    #[test]
    fn should_validate_config_schema_version_on_load() {
        // schema_version = 0（不支援的版本）
        let old_config = r#"
            schema_version = 0
            [apis.api_owner]
            target_field = "owner"
            json_path = "$.owner"
        "#;
        let result = FieldMappingConfig::from_toml_str(old_config);
        assert!(
            result.is_err(),
            "Config with unsupported schema_version must fail validation"
        );
    }

    // LRF-008: config 中重複的 target_field 名稱必須被偵測並報錯
    #[test]
    fn should_detect_duplicate_target_field_names_in_config() {
        // 兩個不同 api 映射到同一個 target_field = "owner_name"（衝突）
        let dup_config = r#"
            schema_version = 1
            [apis.api_owner_1]
            target_field = "owner_name"
            json_path = "$.data.owner"
            [apis.api_owner_2]
            target_field = "owner_name"
            json_path = "$.result.owner_name"
        "#;
        let result = FieldMappingConfig::from_toml_str(dup_config);
        assert!(
            result.is_err(),
            "Duplicate target_field names in config must be detected and rejected"
        );
    }
}
