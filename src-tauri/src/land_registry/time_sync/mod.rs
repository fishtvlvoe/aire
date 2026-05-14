use chrono::{DateTime, Utc};

#[derive(Clone, Debug)]
pub struct TimeSyncState {
    offset_seconds: Option<i64>,
}

impl TimeSyncState {
    pub fn uninitialized() -> Self {
        Self { offset_seconds: None }
    }

    pub fn is_synced(&self) -> bool {
        self.offset_seconds.is_some()
    }
}

#[derive(Clone, Debug)]
pub struct SyncedClock {
    offset_seconds: i64,
}

impl SyncedClock {
    pub fn with_fixed_offset(offset_seconds: i64) -> Self {
        Self { offset_seconds }
    }

    pub fn synced_now(&self) -> DateTime<Utc> {
        Utc::now() + chrono::Duration::seconds(self.offset_seconds)
    }

    pub fn synced_date(&self) -> String {
        self.synced_now().date_naive().to_string()
    }
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
