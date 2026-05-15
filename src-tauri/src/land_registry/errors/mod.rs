use std::error::Error as StdError;

#[derive(Debug, thiserror::Error)]
pub enum LandRegistryError {
    #[error("auth failed: {message}. response_body={response_body}")]
    AuthFailed {
        message: String,
        response_body: String,
    },

    #[error("network error: {message}")]
    Network {
        message: String,
        #[source]
        source: Box<dyn StdError + Send + Sync>,
    },

    #[error("insufficient balance: {message}")]
    InsufficientBalance { message: String },

    #[error("api key not configured")]
    ApiKeyNotConfigured,

    #[error("consent required")]
    ConsentRequired,

    #[error("disk full: available_bytes={available_bytes} required_bytes={required_bytes}")]
    DiskFull {
        available_bytes: u64,
        required_bytes: u64,
    },

    #[error("time skew: {message}")]
    TimeSkew { message: String },

    #[error("migration failed: {message}")]
    MigrationFailed { message: String },

    #[error("grace period expired")]
    GracePeriodExpired,

    #[error(
        "field schema changed for api_id={api_id:?} expected={expected_fields:?} actual={actual_fields:?}"
    )]
    FieldSchemaChanged {
        api_id: String,
        expected_fields: Vec<String>,
        actual_fields: Vec<String>,
    },

    #[error("internal error: {message}")]
    Internal { message: String },
}

impl LandRegistryError {
    pub fn from_http_response(status: u16, body: &str) -> Self {
        match status {
            401 => LandRegistryError::AuthFailed {
                message: "unauthorized".to_string(),
                response_body: body.to_string(),
            },
            402 => LandRegistryError::InsufficientBalance {
                message: "payment required".to_string(),
            },
            429 => LandRegistryError::Internal {
                message: "rate limit exceeded".to_string(),
            },
            _ => LandRegistryError::Internal {
                message: format!("http_status={status} body={body}"),
            },
        }
    }

    pub fn from_ntp_failure(message: &str) -> Self {
        LandRegistryError::TimeSkew {
            message: format!("ntp failure: {message}"),
        }
    }

    pub fn from_http_date_parse_failure(message: &str) -> Self {
        LandRegistryError::TimeSkew {
            message: format!("http date parse failure: {message}"),
        }
    }

    pub fn sample_each_variant() -> Vec<Self> {
        vec![
            LandRegistryError::AuthFailed {
                message: "auth failed sample".to_string(),
                response_body: "invalid_client".to_string(),
            },
            LandRegistryError::Network {
                message: "network sample".to_string(),
                source: Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "sample_source",
                )),
            },
            LandRegistryError::InsufficientBalance {
                message: "insufficient balance".to_string(),
            },
            LandRegistryError::ApiKeyNotConfigured,
            LandRegistryError::ConsentRequired,
            LandRegistryError::DiskFull {
                available_bytes: 1,
                required_bytes: 2,
            },
            LandRegistryError::TimeSkew {
                message: "time skew sample".to_string(),
            },
            LandRegistryError::MigrationFailed {
                message: "migration failed".to_string(),
            },
            LandRegistryError::GracePeriodExpired,
            LandRegistryError::FieldSchemaChanged {
                api_id: "api_owner".to_string(),
                expected_fields: vec!["owner_name".to_string()],
                actual_fields: vec!["name".to_string()],
            },
            LandRegistryError::Internal {
                message: "internal failure".to_string(),
            },
        ]
    }
}

pub mod tests;
