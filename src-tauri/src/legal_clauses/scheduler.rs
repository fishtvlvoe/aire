use std::sync::Arc;
use std::time::Duration;

use tokio::task::JoinHandle;

use crate::legal_clauses::sync::sync_legal_clauses;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClockSource {
    WallClock,
    Monotonic,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerConfig {
    pub interval_days: u32,
    pub clock_source: ClockSource,
}

pub struct SchedulerHandle {
    join: JoinHandle<()>,
}

impl SchedulerHandle {
    pub fn abort(self) {
        self.join.abort();
    }
}

pub fn should_trigger_sync_now(last_synced_at: &str, now: &str, interval_days: i64) -> bool {
    let last = chrono::DateTime::parse_from_rfc3339(last_synced_at).ok();
    let now = chrono::DateTime::parse_from_rfc3339(now).ok();
    match (last, now) {
        (Some(l), Some(n)) => {
            let age = n.signed_duration_since(l);
            age > chrono::Duration::days(interval_days)
        }
        _ => true,
    }
}

pub async fn start_sync_scheduler(
    db: Arc<tokio::sync::Mutex<rusqlite::Connection>>,
    config: SchedulerConfig,
    endpoint: &str,
) -> SchedulerHandle {
    let endpoint = endpoint.to_string();

    let join = tokio::spawn(async move {
        let dur = Duration::from_secs(24 * 60 * 60 * config.interval_days.max(1) as u64);
        let mut ticker = tokio::time::interval(dur);
        // Consume initial immediate tick so the first sync happens after one full interval.
        ticker.tick().await;

        loop {
            ticker.tick().await;
            let conn = match db.lock().await.try_clone() {
                Ok(c) => c,
                Err(_) => continue,
            };
            let endpoint = endpoint.clone();
            let _ = tokio::task::spawn_blocking(move || sync_legal_clauses(&conn, &endpoint)).await;
        }
    });

    SchedulerHandle { join }
}

#[cfg(test)]
include!("scheduler/tests.rs");
