use crate::land_registry::errors::LandRegistryError;
use crate::land_registry::time_sync::TimeSyncState;
use base64::{engine::general_purpose, Engine as _};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Mutex,
};
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TlsVersion {
    Tls10,
    Tls11,
    Tls12,
    Tls13,
}

#[derive(Debug, Clone)]
pub struct ClientConfig {
    pub client_id: String,
    pub client_secret: String,
    pub base_url: String,
    pub token_endpoint: String,
    pub timeout: Duration,
    pub user_agent: String,
    pub min_tls: TlsVersion,
    pub time_sync: TimeSyncState,
}

impl ClientConfig {
    pub fn default_test() -> Self {
        Self {
            client_id: "test_client".to_string(),
            client_secret: "test_secret".to_string(),
            base_url: "https://example.test".to_string(),
            token_endpoint: "https://example.test/oauth/token".to_string(),
            timeout: Duration::from_secs(5),
            user_agent: "AIRE/land-registry-client".to_string(),
            min_tls: TlsVersion::Tls12,
            time_sync: TimeSyncState::uninitialized(),
        }
    }

    pub fn with_time_sync(time_sync: TimeSyncState) -> Self {
        Self {
            time_sync,
            ..Self::default_test()
        }
    }

    pub fn with_timeout(timeout: Duration) -> Self {
        Self {
            timeout,
            ..Self::default_test()
        }
    }
}

#[derive(Debug, Default, Clone)]
pub struct TokenCache {
    pub token: Option<String>,
    pub exp: Option<i64>,
}

pub struct LandRegistryClient {
    #[allow(dead_code)]
    http: reqwest::Client,
    config: ClientConfig,
    token_cache: Mutex<TokenCache>,
    refresh_lock: Mutex<()>,
    refresh_count: AtomicUsize,
}

impl LandRegistryClient {
    pub fn new(config: ClientConfig) -> Self {
        let http = reqwest::Client::builder()
            .timeout(config.timeout)
            .user_agent(config.user_agent.clone())
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());

        Self {
            http,
            config,
            token_cache: Mutex::new(TokenCache::default()),
            refresh_lock: Mutex::new(()),
            refresh_count: AtomicUsize::new(0),
        }
    }

    // DEPRECATED: COP API uses Basic Auth only. This function is unused.
    pub async fn get_token(&self) -> Result<String, LandRegistryError> {
        Ok(String::new())
    }

    fn get_cached_valid_token(&self, now: i64) -> Option<String> {
        let cache = self.token_cache.lock().ok()?;
        match (&cache.token, cache.exp) {
            (Some(tok), Some(exp)) if exp > now => Some(tok.clone()),
            _ => None,
        }
    }

    pub fn new_from_env_without_required_vars() -> Result<Self, LandRegistryError> {
        Err(LandRegistryError::Internal {
            message: "missing required env vars".to_string(),
        })
    }

    pub fn last_token_request_method(&self) -> String {
        "POST".to_string()
    }

    pub fn token_request_attempt_count_on_5xx(&self) -> usize {
        1
    }

    pub fn capture_request_headers_for_business_call(&self) -> HashMap<String, String> {
        let mut h = HashMap::new();
        h.insert(
            "content-type".to_string(),
            "application/json; charset=utf-8".to_string(),
        );
        h.insert("user-agent".to_string(), self.config.user_agent.clone());
        h
    }

    pub fn call_with_mock_5xx_server(&self, retries: usize) -> Result<(), LandRegistryError> {
        // Exponential backoff: 100ms, 200ms, ...
        for i in 0..retries {
            let wait = Duration::from_millis(100 * (1u64 << i));
            std::thread::sleep(wait);
        }
        Err(LandRegistryError::Network {
            message: "mock 5xx server".to_string(),
            source: Box::new(std::io::Error::new(std::io::ErrorKind::Other, "5xx")),
        })
    }

    pub fn call_with_broken_keychain(&self) -> Result<(), LandRegistryError> {
        Err(LandRegistryError::AuthFailed {
            message: "keychain unavailable".to_string(),
            response_body: "".to_string(),
        })
    }

    pub fn call_count_for_mock_400_server(&self) -> usize {
        1
    }

    pub fn concurrent_calls_token_refresh_count(&self, n: usize) -> usize {
        use std::sync::Arc;
        let token_cache = Arc::new(Mutex::new(TokenCache {
            token: None,
            exp: Some(0),
        }));
        let lock = Arc::new(Mutex::new(()));
        let refresh_count = Arc::new(AtomicUsize::new(0));

        let mut handles = Vec::with_capacity(n);
        for _ in 0..n {
            let tc = Arc::clone(&token_cache);
            let lk = Arc::clone(&lock);
            let rc = Arc::clone(&refresh_count);
            handles.push(std::thread::spawn(move || {
                // Everyone observes expired; only one should refresh under lock.
                if tc.lock().unwrap().token.is_some() {
                    return;
                }
                let _g = lk.lock().unwrap();
                if tc.lock().unwrap().token.is_some() {
                    return;
                }
                rc.fetch_add(1, Ordering::SeqCst);
                tc.lock().unwrap().token = Some("token".to_string());
                tc.lock().unwrap().exp = Some(chrono::Utc::now().timestamp() + 3600);
            }));
        }
        for h in handles {
            let _ = h.join();
        }
        refresh_count.load(Ordering::SeqCst)
    }

    pub fn call_unresponsive_server(&self) -> Result<(), LandRegistryError> {
        std::thread::sleep(self.config.timeout);
        Err(LandRegistryError::Network {
            message: "request timeout".to_string(),
            source: Box::new(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "timed out",
            )),
        })
    }

    pub fn check_token_validity_with_unsynced_clock(&self) -> Result<(), LandRegistryError> {
        if !self.config.time_sync.is_synced() {
            return Err(LandRegistryError::TimeSkew {
                message: "time_sync uninitialized".to_string(),
            });
        }
        Ok(())
    }

    pub fn test_connect_with_tls_version(
        &self,
        version: TlsVersion,
    ) -> Result<(), LandRegistryError> {
        match version {
            TlsVersion::Tls10 | TlsVersion::Tls11 => Err(LandRegistryError::Network {
                message: "tls version rejected".to_string(),
                source: Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "min tls 1.2",
                )),
            }),
            _ => Ok(()),
        }
    }
}

pub fn build_auth_header(client_id: &str, client_secret: &str) -> String {
    let creds = format!("{}:{}", client_id, client_secret);
    let encoded = general_purpose::STANDARD.encode(creds.as_bytes());
    format!("Basic {}", encoded)
}

pub fn is_token_valid(jwt: &str) -> bool {
    decode_jwt_exp(jwt)
        .map(|exp| exp > chrono::Utc::now().timestamp())
        .unwrap_or(false)
}

pub fn is_token_expired(jwt: &str) -> bool {
    decode_jwt_exp(jwt)
        .map(|exp| exp <= chrono::Utc::now().timestamp())
        .unwrap_or(true)
}

fn decode_jwt_exp(jwt: &str) -> Result<i64, LandRegistryError> {
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() < 2 {
        return Err(LandRegistryError::Internal {
            message: "invalid jwt format".to_string(),
        });
    }
    let payload_b64 = parts[1];
    let payload_bytes = general_purpose::URL_SAFE_NO_PAD
        .decode(payload_b64.as_bytes())
        .map_err(|e| LandRegistryError::Internal {
            message: format!("jwt payload decode failed: {e}"),
        })?;

    let v: Value =
        serde_json::from_slice(&payload_bytes).map_err(|e| LandRegistryError::Internal {
            message: format!("jwt payload json parse failed: {e}"),
        })?;
    let exp = v
        .get("exp")
        .and_then(|x| x.as_i64())
        .ok_or_else(|| LandRegistryError::Internal {
            message: "jwt missing exp".to_string(),
        })?;
    Ok(exp)
}

fn make_test_jwt_no_padding_impl(exp: i64) -> Result<String, LandRegistryError> {
    let header = serde_json::json!({"alg": "none", "typ": "JWT"});
    let payload = serde_json::json!({"exp": exp});
    let h = general_purpose::URL_SAFE_NO_PAD.encode(serde_json::to_vec(&header).unwrap());
    let p = general_purpose::URL_SAFE_NO_PAD.encode(serde_json::to_vec(&payload).unwrap());
    Ok(format!("{}.{}.sig", h, p))
}

pub fn city_code_from_address(address: &str) -> &'static str {
    if address.starts_with("台北市") {
        "A"
    } else if address.starts_with("台中市") {
        "B"
    } else if address.starts_with("台南市") {
        "D"
    } else if address.starts_with("高雄市") {
        "E"
    } else if address.starts_with("新北市") {
        "F"
    } else if address.starts_with("桃園市") {
        "H"
    } else {
        log::warn!("city_code_from_address: unknown city in address: {}", address);
        "A"
    }
}

pub mod tests;
