use chrono::Utc;
use std::sync::{Arc, Mutex};

use crate::encryption::KeychainState;
use crate::land_registry::errors::LandRegistryError;
use crate::land_registry::time_sync::{synced_now, SyncedClock, TimeSyncModule};

#[derive(Clone, Debug)]
pub struct GraceConfig {
    pub grace_period_days: i64,
}

impl Default for GraceConfig {
    fn default() -> Self {
        Self {
            grace_period_days: 7,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct OfflineGraceState {
    last_verified_at: Option<i64>,
    last_verified_serial: String,
}

impl OfflineGraceState {
    pub fn last_verified_at(&self) -> Option<i64> {
        self.last_verified_at
    }

    pub fn last_verified_serial(&self) -> &str {
        &self.last_verified_serial
    }
}

#[derive(Clone)]
pub struct OfflineGraceChecker {
    state: Arc<Mutex<OfflineGraceState>>,
    clock: SyncedClock,
    config: GraceConfig,
    keychain: KeychainState,
    time_sync: Option<TimeSyncModule>,
}

impl OfflineGraceChecker {
    pub fn new_in_memory() -> Self {
        Self {
            state: Arc::new(Mutex::new(OfflineGraceState::default())),
            clock: SyncedClock::with_fixed_offset(0),
            config: GraceConfig::default(),
            keychain: KeychainState::available(),
            time_sync: None,
        }
    }

    pub fn new_with_expired_grace() -> Self {
        let checker = Self::new_in_memory();
        if let Ok(mut s) = checker.state.lock() {
            s.last_verified_at = Some(Utc::now().timestamp() - 10 * 86_400);
        }
        checker
    }

    pub fn new_with_clock_and_config(clock: SyncedClock, config: GraceConfig) -> Self {
        Self {
            state: Arc::new(Mutex::new(OfflineGraceState::default())),
            clock,
            config,
            keychain: KeychainState::available(),
            time_sync: None,
        }
    }

    pub fn new_with_time_sync(time_sync: TimeSyncModule) -> Self {
        let mut s = Self::new_in_memory();
        s.time_sync = Some(time_sync);
        s
    }

    pub fn new_with_keychain(keychain: KeychainState) -> Self {
        let mut s = Self::new_in_memory();
        s.keychain = keychain;
        s
    }

    pub fn record_successful_verification(&self, serial: &str) -> Result<(), LandRegistryError> {
        let mut state = self.state.lock().map_err(|_| LandRegistryError::Internal {
            message: "offline grace state lock poisoned".to_string(),
        })?;
        state.last_verified_at = Some(self.clock.synced_now().timestamp());
        state.last_verified_serial = serial.to_string();
        Ok(())
    }

    pub fn get_state(&self) -> Option<OfflineGraceState> {
        self.state.lock().ok().map(|s| s.clone())
    }

    pub fn compute_days_remaining_from_ts(&self, last_verified_ts: i64) -> i64 {
        self.clock
            .compute_grace_days_remaining_from_ts(last_verified_ts, self.config.grace_period_days)
    }

    pub fn check_with_auth_failed_response(&self) -> Result<(), LandRegistryError> {
        Err(LandRegistryError::GracePeriodExpired)
    }

    pub fn check_grace_period(&self) -> Result<(), LandRegistryError> {
        if let Some(ts) = &self.time_sync {
            ts.initialize();
        }
        if !self.keychain.is_available() {
            return Err(LandRegistryError::Internal {
                message: "keychain unavailable".to_string(),
            });
        }

        let state = self.state.lock().map_err(|_| LandRegistryError::Internal {
            message: "offline grace state lock poisoned".to_string(),
        })?;

        if let Some(last) = state.last_verified_at {
            if self.compute_days_remaining_from_ts(last) < 0 {
                return Err(LandRegistryError::GracePeriodExpired);
            }
        }
        Ok(())
    }

    pub fn check_grace_period_from_ts(
        &self,
        last_verified_ts: i64,
    ) -> Result<(), LandRegistryError> {
        if self.compute_days_remaining_from_ts(last_verified_ts) < 0 {
            Err(LandRegistryError::GracePeriodExpired)
        } else {
            Ok(())
        }
    }

    pub fn evaluate_opcos_status(
        &self,
        status: u16,
        is_timeout: bool,
    ) -> Result<(), LandRegistryError> {
        if (400..500).contains(&status) {
            return Err(LandRegistryError::GracePeriodExpired);
        }
        if is_timeout || (500..600).contains(&status) {
            let st = self.state.lock().map_err(|_| LandRegistryError::Internal {
                message: "offline grace state lock poisoned".to_string(),
            })?;
            let last = st
                .last_verified_at
                .unwrap_or_else(|| synced_now().timestamp());
            drop(st);
            return self.check_grace_period_from_ts(last);
        }
        Ok(())
    }
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
