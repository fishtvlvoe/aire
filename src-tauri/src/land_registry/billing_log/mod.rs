use chrono::{DateTime, Local, Utc};
use std::sync::{Arc, Mutex};

use crate::land_registry::disk_resilience::DiskGuard;
use crate::land_registry::errors::LandRegistryError;
use crate::land_registry::time_sync::SyncedClock;

#[derive(Debug, Clone)]
pub struct BillingLogEntry {
    parcel_id: String,
    endpoint: String,
    cost: f64,
    timestamp: String,
    transaction_id: String,
}

impl BillingLogEntry {
    pub fn new(parcel_id: impl Into<String>, endpoint: impl Into<String>, cost: f64, transaction_id: impl Into<String>) -> Self {
        Self {
            parcel_id: parcel_id.into(),
            endpoint: endpoint.into(),
            cost,
            timestamp: Utc::now().to_rfc3339(),
            transaction_id: transaction_id.into(),
        }
    }

    pub fn transaction_id(&self) -> &str {
        &self.transaction_id
    }

    pub fn api_id(&self) -> &str {
        &self.endpoint
    }

    pub fn cost(&self) -> f64 {
        self.cost
    }

    pub fn timestamp(&self) -> &str {
        &self.timestamp
    }

    pub fn extract_transaction_id(headers: &[(&str, &str)]) -> Option<String> {
        headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case("x-transaction-id"))
            .map(|(_, v)| (*v).to_string())
    }
}

#[derive(Clone)]
pub struct BillingLog {
    entries: Arc<Mutex<Vec<BillingLogEntry>>>,
    disk_guard: DiskGuard,
    clock: SyncedClock,
}

impl BillingLog {
    pub fn new_in_memory() -> Self {
        Self {
            entries: Arc::new(Mutex::new(Vec::new())),
            disk_guard: DiskGuard::unrestricted(),
            clock: SyncedClock::with_fixed_offset(0),
        }
    }

    pub fn new_with_disk_guard(disk_guard: DiskGuard) -> Self {
        Self {
            entries: Arc::new(Mutex::new(Vec::new())),
            disk_guard,
            clock: SyncedClock::with_fixed_offset(0),
        }
    }

    pub fn new_with_clock(clock: SyncedClock) -> Self {
        Self {
            entries: Arc::new(Mutex::new(Vec::new())),
            disk_guard: DiskGuard::unrestricted(),
            clock,
        }
    }

    pub fn record_call(&self, parcel_id: &str, endpoint: &str, cost: f64, transaction_id: &str) -> Result<(), LandRegistryError> {
        self.disk_guard.check_before_write(1)?;
        let mut entries = self.entries.lock().map_err(|_| LandRegistryError::Internal {
            message: "billing log lock poisoned".to_string(),
        })?;
        entries.push(BillingLogEntry {
            parcel_id: parcel_id.to_string(),
            endpoint: endpoint.to_string(),
            cost,
            timestamp: self.clock.synced_now().to_rfc3339(),
            transaction_id: transaction_id.to_string(),
        });
        Ok(())
    }

    pub fn record_failed_call(
        &self,
        parcel_id: &str,
        endpoint: &str,
        _error: LandRegistryError,
        transaction_id: &str,
    ) -> Result<(), LandRegistryError> {
        self.record_call(parcel_id, endpoint, 0.0, transaction_id)
    }

    pub fn record_and_passthrough<T>(
        &self,
        parcel_id: &str,
        endpoint: &str,
        cost: f64,
        transaction_id: &str,
        business_result: Result<T, LandRegistryError>,
    ) -> Result<T, LandRegistryError> {
        let _ = self.record_call(parcel_id, endpoint, cost, transaction_id);
        business_result
    }

    pub fn get_entries_for(&self, parcel_id: &str) -> Vec<BillingLogEntry> {
        self.entries
            .lock()
            .map(|v| v.iter().filter(|e| e.parcel_id == parcel_id).cloned().collect())
            .unwrap_or_default()
    }

    pub fn aggregate_daily(&self, date_yyyy_mm_dd: &str) -> f64 {
        let entries = self.entries.lock().ok();
        entries
            .as_deref()
            .map_or(&[][..], |v| v.as_slice())
            .iter()
            .filter(|e| to_local_date(&e.timestamp) == date_yyyy_mm_dd)
            .map(|e| e.cost)
            .sum()
    }

    pub fn aggregate_range(&self, start_date: &str, end_date: &str) -> f64 {
        if start_date > end_date {
            return 0.0;
        }
        let entries = self.entries.lock().ok();
        entries
            .as_deref()
            .map_or(&[][..], |v| v.as_slice())
            .iter()
            .filter(|e| {
                let d = to_local_date(&e.timestamp);
                d.as_str() >= start_date && d.as_str() <= end_date
            })
            .map(|e| e.cost)
            .sum()
    }
}

fn to_local_date(ts: &str) -> String {
    DateTime::parse_from_rfc3339(ts)
        .map(|dt| dt.with_timezone(&Local).date_naive().to_string())
        .unwrap_or_else(|_| Utc::now().with_timezone(&Local).date_naive().to_string())
}

pub fn aggregate_daily_cost(entries: &[BillingLogEntry], date_yyyy_mm_dd: &str) -> f64 {
    entries
        .iter()
        .filter(|e| to_local_date(&e.timestamp) == date_yyyy_mm_dd)
        .map(|e| e.cost)
        .sum()
}

pub fn write_billing_entry(log: &BillingLog, entry: BillingLogEntry) -> Result<(), LandRegistryError> {
    log.record_call(&entry.parcel_id, &entry.endpoint, entry.cost, &entry.transaction_id)
}

pub fn monthly_total(log: &BillingLog, prefix_yyyy_mm: &str) -> f64 {
    log.entries
        .lock()
        .map(|v| {
            v.iter()
                .filter(|e| to_local_date(&e.timestamp).starts_with(prefix_yyyy_mm))
                .map(|e| e.cost)
                .sum()
        })
        .unwrap_or(0.0)
}

pub fn monthly_count(log: &BillingLog, prefix_yyyy_mm: &str) -> usize {
    log.entries
        .lock()
        .map(|v| {
            v.iter()
                .filter(|e| to_local_date(&e.timestamp).starts_with(prefix_yyyy_mm))
                .count()
        })
        .unwrap_or(0)
}

pub fn available_balance(total_credit: f64, spent: f64) -> f64 {
    total_credit - spent
}

#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod tests;
