use crate::land_registry::disk_resilience::DiskGuard;
use crate::land_registry::errors::LandRegistryError;
use crate::land_registry::time_sync::SyncedClock;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey(pub String);

#[derive(Debug, Clone)]
pub struct CacheEntry {
    pub key: CacheKey,
    pub payload: Value,
}

#[derive(Clone)]
pub struct LandRegistryCache {
    map: Arc<Mutex<HashMap<String, Value>>>,
    inflight: Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>>,
    clock: SyncedClock,
    disk_guard: DiskGuard,
}

impl LandRegistryCache {
    pub fn new_in_memory() -> Self {
        Self {
            map: Arc::new(Mutex::new(HashMap::new())),
            inflight: Arc::new(Mutex::new(HashMap::new())),
            clock: SyncedClock::with_fixed_offset(0),
            disk_guard: DiskGuard::unrestricted(),
        }
    }

    pub fn new_with_clock(clock: SyncedClock) -> Self {
        Self {
            clock,
            ..Self::new_in_memory()
        }
    }

    pub fn new_with_disk_guard(disk_guard: DiskGuard) -> Self {
        Self {
            disk_guard,
            ..Self::new_in_memory()
        }
    }

    pub fn new_with_keychain(keychain: crate::encryption::KeychainState) -> Result<Self, LandRegistryError> {
        if !keychain.is_available() {
            return Err(LandRegistryError::Internal {
                message: "encryption init failed".to_string(),
            });
        }
        Ok(Self::new_in_memory())
    }

    pub fn current_query_date(&self) -> String {
        self.clock.synced_date()
    }

    pub fn store(
        &self,
        parcel_id: &str,
        api_id: &str,
        query_date: &str,
        payload: &Value,
    ) -> Result<(), LandRegistryError> {
        if self.disk_guard.available_bytes() == 0 {
            return Err(LandRegistryError::DiskFull {
                available_bytes: 0,
                required_bytes: 1,
            });
        }

        let key = generate_cache_key(parcel_id, api_id, query_date);
        let mut map = self.map.lock().map_err(|_| LandRegistryError::Internal {
            message: "cache mutex poisoned".to_string(),
        })?;
        map.insert(key, payload.clone());
        Ok(())
    }

    pub fn get(&self, parcel_id: &str, api_id: &str, query_date: &str) -> Option<Value> {
        let key = generate_cache_key(parcel_id, api_id, query_date);
        self.map.lock().ok()?.get(&key).cloned()
    }

    pub fn invalidate(&self, parcel_id: &str, api_id: Option<&str>) -> Result<(), LandRegistryError> {
        let parcel_norm = normalize_parcel_id(parcel_id);
        let mut map = self.map.lock().map_err(|_| LandRegistryError::Internal {
            message: "cache mutex poisoned".to_string(),
        })?;

        match api_id {
            None => {
                map.retain(|k, _| !k.starts_with(&format!("{}|", parcel_norm)));
            }
            Some(api) => {
                let prefix = format!("{}|{}|", parcel_norm, api.to_uppercase());
                map.retain(|k, _| !k.starts_with(&prefix));
            }
        }
        Ok(())
    }

    pub fn count_entries(&self, parcel_id: &str) -> usize {
        let parcel_norm = normalize_parcel_id(parcel_id);
        self.map
            .lock()
            .map(|m| m.keys().filter(|k| k.starts_with(&format!("{}|", parcel_norm))).count())
            .unwrap_or(0)
    }

    pub fn get_or_fetch<F>(
        &self,
        parcel_id: &str,
        api_id: &str,
        query_date: &str,
        fetch: F,
    ) -> Result<Value, LandRegistryError>
    where
        F: FnOnce() -> Result<Value, LandRegistryError>,
    {
        if let Some(v) = self.get(parcel_id, api_id, query_date) {
            return Ok(v);
        }

        let key = generate_cache_key(parcel_id, api_id, query_date);
        let per_key_lock = {
            let mut locks = self.inflight.lock().map_err(|_| LandRegistryError::Internal {
                message: "inflight mutex poisoned".to_string(),
            })?;
            locks
                .entry(key.clone())
                .or_insert_with(|| Arc::new(Mutex::new(())))
                .clone()
        };

        let _g = per_key_lock.lock().map_err(|_| LandRegistryError::Internal {
            message: "per-key lock poisoned".to_string(),
        })?;

        if let Some(v) = self.get(parcel_id, api_id, query_date) {
            return Ok(v);
        }

        let v = fetch()?;
        let _ = self.store(parcel_id, api_id, query_date, &v);
        Ok(v)
    }
}

pub fn generate_cache_key(parcel_id: &str, api_id: &str, query_date: &str) -> String {
    let parcel_norm = normalize_parcel_id(parcel_id);
    format!("{}|{}|{}", parcel_norm, api_id.to_uppercase(), query_date)
}

fn normalize_parcel_id(parcel_id: &str) -> String {
    parcel_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect::<String>()
        .to_uppercase()
}

pub mod tests;
