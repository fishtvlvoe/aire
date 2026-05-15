/// Phase 2 紅燈測試 — land-registry-errors
/// 對應 spec: land-registry-errors，失敗點 LRE-001 ~ LRE-008
/// import 尚未實作的 LandRegistryError enum → 編譯失敗 = 預期紅燈
#[cfg(test)]
mod tests {
    use crate::land_registry::errors::LandRegistryError;

    // LRE-001: 402 但 body 非標準格式，仍必須識別為 InsufficientBalance
    #[test]
    fn should_identify_insufficient_balance_even_with_non_standard_body() {
        // 非標準 body：不含 "insufficient_balance" 關鍵字，但 HTTP status = 402
        let non_standard_body = r#"{"error": "Payment Required", "code": 4020}"#;
        let err = LandRegistryError::from_http_response(402, non_standard_body);
        assert!(
            matches!(err, LandRegistryError::InsufficientBalance { .. }),
            "HTTP 402 must be mapped to InsufficientBalance regardless of body format, got {:?}",
            err
        );
    }

    // LRE-002: DiskFull error 裡的 available_bytes 欄位單位必須是 bytes（不是 KB）
    #[test]
    fn should_report_disk_available_bytes_in_bytes_not_kilobytes() {
        // 模擬 10 MB 可用空間
        let available_bytes: u64 = 10 * 1024 * 1024;
        let err = LandRegistryError::DiskFull {
            available_bytes,
            required_bytes: 50 * 1024 * 1024,
        };
        match err {
            LandRegistryError::DiskFull {
                available_bytes: ab,
                ..
            } => {
                // 確認值是 bytes（10MB = 10,485,760），不是 10240（KB）
                assert_eq!(
                    ab,
                    10 * 1024 * 1024,
                    "DiskFull.available_bytes must be in bytes, not KB"
                );
            }
            _ => panic!("Expected DiskFull variant"),
        }
    }

    // LRE-003: match expression 必須窮舉所有 error variant（no wildcard escape）
    // 此測試確保 Phase 3 加入新 variant 時，現有 match 會編譯失敗而非靜默忽略
    #[test]
    fn should_exhaust_all_error_variants_in_match_expressions() {
        let err = LandRegistryError::sample_each_variant();
        for e in err {
            // 窮舉 match — 若有新 variant 未列出，編譯時會報 "non-exhaustive pattern" 錯誤
            let _display_msg: &str = match e {
                LandRegistryError::AuthFailed { .. } => "auth_failed",
                LandRegistryError::Network { .. } => "network",
                LandRegistryError::InsufficientBalance { .. } => "insufficient_balance",
                LandRegistryError::ApiKeyNotConfigured => "api_key_not_configured",
                LandRegistryError::ConsentRequired => "consent_required",
                LandRegistryError::DiskFull { .. } => "disk_full",
                LandRegistryError::TimeSkew { .. } => "time_skew",
                LandRegistryError::MigrationFailed { .. } => "migration_failed",
                LandRegistryError::GracePeriodExpired => "grace_period_expired",
                LandRegistryError::FieldSchemaChanged { .. } => "field_schema_changed",
                LandRegistryError::Internal { .. } => "internal",
                // Phase 3 新增 variant 後，此處必須同步補充，不加 `_` fallback
            };
        }
    }

    // LRE-004: Network error 必須 chain 原始 source error（不能只有 message string）
    #[test]
    fn should_include_source_error_in_network_error_chain() {
        use std::error::Error;
        let io_err = std::io::Error::new(std::io::ErrorKind::ConnectionRefused, "refused");
        let err = LandRegistryError::Network {
            message: "connection failed".to_string(),
            source: Box::new(io_err),
        };
        // std::error::Error::source() 必須能取到原始 io::Error
        let source = err
            .source()
            .expect("Network error must have a source error in the chain");
        assert!(
            source.to_string().contains("refused"),
            "Source error must contain original error message"
        );
    }

    // LRE-005: 所有 time sync 相關失敗必須用 TimeSkew variant（統一語意）
    #[test]
    fn should_use_time_skew_error_for_all_time_sync_failures() {
        // NTP 失敗
        let ntp_fail = LandRegistryError::from_ntp_failure("ntp.timetool.org unreachable");
        assert!(
            matches!(ntp_fail, LandRegistryError::TimeSkew { .. }),
            "NTP failure must be mapped to TimeSkew variant"
        );
        // HTTP Date header parse 失敗
        let date_fail = LandRegistryError::from_http_date_parse_failure("invalid date format");
        assert!(
            matches!(date_fail, LandRegistryError::TimeSkew { .. }),
            "HTTP Date header parse failure must be mapped to TimeSkew variant"
        );
    }

    // LRE-006: LandRegistryError 必須實作 Send + Sync（用於 async context）
    #[test]
    fn should_implement_send_sync_for_land_registry_error() {
        // 這個測試是編譯時斷言：若 LandRegistryError 未實作 Send + Sync，
        // 下面的 trait bound 在編譯時就會失敗
        fn assert_send_sync<T: Send + Sync>() {}
        assert_send_sync::<LandRegistryError>();
    }

    // LRE-007: 所有 error variant 的 Display 輸出必須是人類可讀的（非 Debug dump）
    #[test]
    fn should_produce_human_readable_display_for_all_error_variants() {
        let errors = LandRegistryError::sample_each_variant();
        for e in errors {
            let display = format!("{}", e);
            // Display 輸出不能是 Rust Debug 格式（如 `AuthFailed { .. }`）
            assert!(
                !display.contains("{ "),
                "Display must be human-readable, not Debug format: got '{}'",
                display
            );
            assert!(
                display.len() >= 10,
                "Display message must have meaningful content (>= 10 chars): got '{}'",
                display
            );
        }
    }

    // LRE-008: AuthFailed error 必須包含 response body（方便 debug）
    #[test]
    fn should_include_response_body_in_auth_failed_error() {
        let body = r#"{"error":"invalid_client","description":"Unknown client"}"#;
        let err = LandRegistryError::from_http_response(401, body);
        match err {
            LandRegistryError::AuthFailed { response_body, .. } => {
                assert!(
                    response_body.contains("invalid_client"),
                    "AuthFailed must include response body for debugging"
                );
            }
            _ => panic!("401 response must map to AuthFailed"),
        }
    }
}
