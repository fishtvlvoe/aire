use crate::commands::cases::IpcError;
use crate::land_registry::apis::{ApiCredentials, ApiKeyProvider};
use crate::land_registry::client::{ClientConfig, LandRegistryClient};
use crate::land_registry::errors::LandRegistryError;
use crate::secrets::{delete_credential, get_credential, set_credential, KeyringBackend};
use crate::{AsyncIpcState, KeyringState};
use serde::{Deserialize, Serialize};
use tauri::State;

pub const LAND_REGISTRY_API_KEY_NAME: &str = "aire-land-registry-api-key";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct StoredApiKey {
    client_id: String,
    client_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ApiKeyInfo {
    pub client_id_masked: String,
    pub client_secret_masked: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub message: String,
}

pub trait TokenConnectionTester {
    fn test_connection(
        &self,
        client_id: &str,
        client_secret: &str,
    ) -> Result<(), LandRegistryError>;
}

pub struct ApiKeyStorage<'a> {
    backend: &'a dyn KeyringBackend,
}

impl<'a> ApiKeyStorage<'a> {
    pub fn new(backend: &'a dyn KeyringBackend) -> Self {
        Self { backend }
    }

    pub fn set_api_key(
        &self,
        client_id: impl Into<String>,
        client_secret: impl Into<String>,
    ) -> Result<(), LandRegistryError> {
        let payload = StoredApiKey {
            client_id: client_id.into(),
            client_secret: client_secret.into(),
        };
        let raw = serde_json::to_string(&payload).map_err(|error| LandRegistryError::Internal {
            message: format!("serialize api key failed: {error}"),
        })?;

        set_credential(self.backend, LAND_REGISTRY_API_KEY_NAME, &raw).map_err(|error| {
            LandRegistryError::Internal {
                message: format!("store api key failed: {error}"),
            }
        })
    }

    pub fn get_api_key(&self) -> Result<Option<ApiKeyInfo>, LandRegistryError> {
        let stored = self.get_raw_api_key()?;
        Ok(stored.map(|item| ApiKeyInfo {
            client_id_masked: mask_keep_last4(&item.client_id),
            client_secret_masked: mask_keep_last4(&item.client_secret),
        }))
    }

    pub fn get_raw_api_key(&self) -> Result<Option<ApiCredentials>, LandRegistryError> {
        let value = get_credential(self.backend, LAND_REGISTRY_API_KEY_NAME).map_err(|error| {
            LandRegistryError::Internal {
                message: format!("read api key failed: {error}"),
            }
        })?;

        match value {
            None => Ok(None),
            Some(raw) => {
                let parsed: StoredApiKey =
                    serde_json::from_str(&raw).map_err(|error| LandRegistryError::Internal {
                        message: format!("invalid stored api key format: {error}"),
                    })?;
                Ok(Some(ApiCredentials {
                    client_id: parsed.client_id,
                    client_secret: parsed.client_secret,
                    token_endpoint: std::env::var("LAND_REGISTRY_TOKEN_ENDPOINT")
                        .unwrap_or_default(),
                }))
            }
        }
    }

    pub fn clear_api_key(&self) -> Result<(), LandRegistryError> {
        delete_credential(self.backend, LAND_REGISTRY_API_KEY_NAME).map_err(|error| {
            LandRegistryError::Internal {
                message: format!("clear api key failed: {error}"),
            }
        })
    }

    pub fn test_connection<T: TokenConnectionTester>(
        &self,
        tester: &T,
    ) -> Result<ConnectionTestResult, LandRegistryError> {
        let key = self
            .get_raw_api_key()?
            .ok_or(LandRegistryError::ApiKeyNotConfigured)?;

        match tester.test_connection(&key.client_id, &key.client_secret) {
            Ok(()) => Ok(ConnectionTestResult {
                success: true,
                message: "連線成功".to_string(),
            }),
            Err(_) => Ok(ConnectionTestResult {
                success: false,
                message: "認證失敗：請確認 Client ID 與安全碼".to_string(),
            }),
        }
    }
}

impl<'a> ApiKeyProvider for ApiKeyStorage<'a> {
    fn get_api_key(&self) -> Result<Option<ApiCredentials>, LandRegistryError> {
        self.get_raw_api_key()
    }
}

pub fn set_api_key(
    backend: &dyn KeyringBackend,
    client_id: String,
    client_secret: String,
) -> Result<(), LandRegistryError> {
    ApiKeyStorage::new(backend).set_api_key(client_id, client_secret)
}

pub fn get_api_key(backend: &dyn KeyringBackend) -> Result<Option<ApiKeyInfo>, LandRegistryError> {
    ApiKeyStorage::new(backend).get_api_key()
}

pub fn clear_api_key(backend: &dyn KeyringBackend) -> Result<(), LandRegistryError> {
    ApiKeyStorage::new(backend).clear_api_key()
}

pub fn test_connection<T: TokenConnectionTester>(
    backend: &dyn KeyringBackend,
    tester: &T,
) -> Result<ConnectionTestResult, LandRegistryError> {
    ApiKeyStorage::new(backend).test_connection(tester)
}

pub fn set_api_key_with_backend(
    backend: &dyn KeyringBackend,
    client_id: String,
    client_secret: String,
) -> Result<(), LandRegistryError> {
    set_api_key(backend, client_id, client_secret)
}

pub fn get_api_key_with_backend(
    backend: &dyn KeyringBackend,
) -> Result<Option<ApiKeyInfo>, LandRegistryError> {
    get_api_key(backend)
}

pub fn clear_api_key_with_backend(backend: &dyn KeyringBackend) -> Result<(), LandRegistryError> {
    clear_api_key(backend)
}

pub fn test_connection_with_backend<T: TokenConnectionTester>(
    backend: &dyn KeyringBackend,
    tester: &T,
) -> Result<ConnectionTestResult, LandRegistryError> {
    test_connection(backend, tester)
}

fn to_ipc_error(error: LandRegistryError) -> IpcError {
    let code = match error {
        LandRegistryError::ApiKeyNotConfigured => "ApiKeyNotConfigured",
        LandRegistryError::ConsentRequired => "ConsentRequired",
        LandRegistryError::InsufficientBalance { .. } => "InsufficientBalance",
        _ => "InternalError",
    };
    IpcError {
        code: code.to_string(),
        message: error.to_string(),
    }
}

struct RuntimeConnectionTester {
    base_url: String,
}

impl TokenConnectionTester for RuntimeConnectionTester {
    fn test_connection(
        &self,
        client_id: &str,
        client_secret: &str,
    ) -> Result<(), LandRegistryError> {
        let mut config = ClientConfig::default_test();
        config.client_id = client_id.to_string();
        config.client_secret = client_secret.to_string();
        config.base_url = self.base_url.clone();
        config.token_endpoint = format!("{}/oauth/token", self.base_url.trim_end_matches('/'));
        let client = LandRegistryClient::new(config);

        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|error| LandRegistryError::Internal {
                message: format!("create runtime failed: {error}"),
            })?;

        runtime.block_on(client.get_token()).map(|_| ())
    }
}

#[tauri::command]
pub async fn land_registry_set_api_key(
    client_id: String,
    client_secret: String,
    keyring: State<'_, KeyringState>,
) -> Result<(), IpcError> {
    set_api_key_with_backend(keyring.0.as_ref(), client_id, client_secret).map_err(to_ipc_error)
}

#[tauri::command]
pub async fn land_registry_get_api_key(
    keyring: State<'_, KeyringState>,
) -> Result<Option<ApiKeyInfo>, IpcError> {
    get_api_key_with_backend(keyring.0.as_ref()).map_err(to_ipc_error)
}

#[tauri::command]
pub async fn land_registry_test_connection(
    keyring: State<'_, KeyringState>,
    ipc: State<'_, AsyncIpcState>,
) -> Result<ConnectionTestResult, IpcError> {
    let tester = RuntimeConnectionTester {
        base_url: ipc.opcos_base_url.clone(),
    };
    test_connection_with_backend(keyring.0.as_ref(), &tester).map_err(to_ipc_error)
}

fn mask_keep_last4(input: &str) -> String {
    let chars = input.chars().collect::<Vec<_>>();
    if chars.is_empty() {
        return String::new();
    }

    let keep = chars.len().min(4);
    let visible = chars[chars.len() - keep..].iter().collect::<String>();
    let masked = "*".repeat(chars.len().saturating_sub(keep).max(4));
    format!("{}{}", masked, visible)
}

#[cfg(test)]
mod tests {
    use super::{ApiKeyStorage, TokenConnectionTester};
    use crate::land_registry::errors::LandRegistryError;
    use crate::secrets::MockKeyring;

    struct MockConnectionTester {
        should_succeed: bool,
    }

    impl TokenConnectionTester for MockConnectionTester {
        fn test_connection(
            &self,
            _client_id: &str,
            _client_secret: &str,
        ) -> Result<(), LandRegistryError> {
            if self.should_succeed {
                Ok(())
            } else {
                Err(LandRegistryError::AuthFailed {
                    message: "invalid credentials".to_string(),
                    response_body: "".to_string(),
                })
            }
        }
    }

    #[test]
    fn set_then_get_returns_masked_values() {
        let backend = MockKeyring::new();
        let storage = ApiKeyStorage::new(&backend);

        storage
            .set_api_key("9646bd7c-5abc-4be4-916c-07644e5aefd5", "secret-123456")
            .unwrap();

        let key = storage.get_api_key().unwrap().unwrap();
        assert!(key.client_id_masked.ends_with("efd5"));
        assert!(key.client_secret_masked.ends_with("3456"));
        assert!(key.client_id_masked.starts_with("****"));
    }

    #[test]
    fn clear_then_get_returns_none() {
        let backend = MockKeyring::new();
        let storage = ApiKeyStorage::new(&backend);

        storage.set_api_key("id", "secret").unwrap();
        storage.clear_api_key().unwrap();

        assert!(storage.get_api_key().unwrap().is_none());
    }

    #[test]
    fn test_connection_uses_mock_tester() {
        let backend = MockKeyring::new();
        let storage = ApiKeyStorage::new(&backend);
        storage.set_api_key("id", "secret").unwrap();

        let ok = storage
            .test_connection(&MockConnectionTester {
                should_succeed: true,
            })
            .unwrap();
        assert!(ok.success);
        assert_eq!(ok.message, "連線成功");

        let fail = storage
            .test_connection(&MockConnectionTester {
                should_succeed: false,
            })
            .unwrap();
        assert!(!fail.success);
        assert_eq!(fail.message, "認證失敗：請確認 Client ID 與安全碼");
    }
}
