use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::land_registry::errors::LandRegistryError;

#[derive(Clone, Debug)]
pub struct TimeSyncState {
    offset_seconds: i64,
    synced: bool,
}

impl TimeSyncState {
    pub fn uninitialized() -> Self {
        Self {
            offset_seconds: 0,
            synced: false,
        }
    }

    pub fn offset_seconds(&self) -> i64 {
        self.offset_seconds
    }

    pub fn is_synced(&self) -> bool {
        self.synced
    }
}

#[derive(Clone)]
pub struct SyncedClock {
    inner: Arc<Mutex<ClockInner>>,
}

#[derive(Clone, Debug)]
struct ClockInner {
    offset_seconds: i64,
    fixed_now: Option<DateTime<Utc>>,
}

impl SyncedClock {
    pub fn with_fixed_offset(offset_seconds: i64) -> Self {
        Self {
            inner: Arc::new(Mutex::new(ClockInner {
                offset_seconds,
                fixed_now: None,
            })),
        }
    }

    pub fn with_initial_offset(offset_seconds: i64) -> Self {
        Self::with_fixed_offset(offset_seconds)
    }

    pub fn with_fixed_utc_time(input: &str) -> Self {
        let fixed = DateTime::parse_from_rfc3339(input)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());
        Self {
            inner: Arc::new(Mutex::new(ClockInner {
                offset_seconds: 0,
                fixed_now: Some(fixed),
            })),
        }
    }

    pub fn update_offset(&self, offset_seconds: i64) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.offset_seconds = offset_seconds;
        }
    }

    pub fn synced_now(&self) -> DateTime<Utc> {
        let inner = self.inner.lock().expect("clock lock poisoned");
        let base = inner.fixed_now.unwrap_or_else(Utc::now);
        base + chrono::Duration::seconds(inner.offset_seconds)
    }

    pub fn synced_date(&self) -> String {
        self.synced_now().with_timezone(&Local).date_naive().to_string()
    }

    pub fn compute_grace_days_remaining(&self, grace_period_days: i64) -> i64 {
        self.compute_grace_days_remaining_from_ts(self.synced_now().timestamp(), grace_period_days)
    }

    pub fn compute_grace_days_remaining_from_ts(&self, last_verified_ts: i64, grace_period_days: i64) -> i64 {
        let now_ts = self.synced_now().timestamp();
        let elapsed = (now_ts - last_verified_ts).max(0);
        let remaining_seconds = grace_period_days.saturating_mul(86_400) - elapsed;
        if remaining_seconds < 0 {
            -1
        } else {
            remaining_seconds / 86_400
        }
    }
}

#[derive(Clone)]
pub struct TimeSyncModule {
    state: Arc<Mutex<TimeSyncState>>,
    ntp_timeout: Duration,
    always_fail_ntp: bool,
    fallback_success: bool,
    init_hook: Option<Arc<dyn Fn() + Send + Sync>>,
}

impl TimeSyncModule {
    pub fn new_in_memory_db() -> Self {
        Self {
            state: Arc::new(Mutex::new(TimeSyncState::uninitialized())),
            ntp_timeout: Duration::from_secs(3),
            always_fail_ntp: false,
            fallback_success: false,
            init_hook: None,
        }
    }

    pub fn new_fresh_offline() -> Self {
        Self::new_in_memory_db()
    }

    pub fn new_with_ntp_timeout(timeout: Duration) -> Self {
        let mut s = Self::new_in_memory_db();
        s.ntp_timeout = timeout;
        s
    }

    pub fn new_with_always_failing_ntp() -> Self {
        let mut s = Self::new_in_memory_db();
        s.always_fail_ntp = true;
        s
    }

    pub fn new_with_primary_fail_fallback_succeed(primary: Duration, _fallback: Duration) -> Self {
        let mut s = Self::new_with_ntp_timeout(primary);
        s.always_fail_ntp = true;
        s.fallback_success = true;
        s
    }

    pub fn new_with_init_hook<F>(hook: F) -> Self
    where
        F: Fn() + Send + Sync + 'static,
    {
        let mut s = Self::new_in_memory_db();
        s.init_hook = Some(Arc::new(hook));
        s
    }

    pub fn initialize(&self) {
        if let Some(hook) = &self.init_hook {
            hook();
        }
    }

    pub fn store_offset(&self, offset_seconds: i64) -> Result<(), LandRegistryError> {
        let mut state = self.state.lock().map_err(|_| LandRegistryError::Internal {
            message: "time sync state lock poisoned".to_string(),
        })?;
        state.offset_seconds = offset_seconds;
        state.synced = true;
        Ok(())
    }

    pub fn get_offset(&self) -> Result<i64, LandRegistryError> {
        let state = self.state.lock().map_err(|_| LandRegistryError::Internal {
            message: "time sync state lock poisoned".to_string(),
        })?;
        Ok(state.offset_seconds)
    }

    pub fn get_state(&self) -> TimeSyncState {
        self.state.lock().map(|s| s.clone()).unwrap_or_else(|_| TimeSyncState::uninitialized())
    }

    pub fn sync_with_mock_ntp_server(&self) -> Result<(), LandRegistryError> {
        let _ = self.ntp_timeout;
        if self.always_fail_ntp {
            return Err(LandRegistryError::from_ntp_failure("mock ntp failed"));
        }
        self.store_offset(0)
    }

    pub fn sync_with_fallback(&self) -> Result<(), LandRegistryError> {
        match self.sync_with_mock_ntp_server() {
            Ok(()) => Ok(()),
            Err(_) if self.fallback_success => self.store_offset(0),
            Err(e) => Err(e),
        }
    }

    pub fn sync_with_opcos(&self, server_ts: i64) -> Result<(), LandRegistryError> {
        let local = Utc::now().timestamp();
        self.store_offset(server_ts - local)
    }
}

pub fn parse_http_date(input: &str) -> Result<i64, LandRegistryError> {
    if let Ok(dt) = DateTime::parse_from_rfc2822(input) {
        return Ok(dt.with_timezone(&Utc).timestamp());
    }

    if let Ok(ndt) = NaiveDateTime::parse_from_str(input, "%A, %d-%b-%y %H:%M:%S GMT") {
        return Ok(Utc.from_utc_datetime(&ndt).timestamp());
    }

    if let Ok(ndt) = NaiveDateTime::parse_from_str(input, "%a %b %e %H:%M:%S %Y") {
        return Ok(Utc.from_utc_datetime(&ndt).timestamp());
    }

    Err(LandRegistryError::from_http_date_parse_failure(input))
}

pub fn synced_now() -> DateTime<Utc> {
    Utc::now()
}

pub fn sync_with_opcos(server_ts: i64) -> Result<i64, LandRegistryError> {
    Ok(server_ts - Utc::now().timestamp())
}

pub fn get_offset(server_ts: i64, local_ts: i64) -> i64 {
    server_ts - local_ts
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
