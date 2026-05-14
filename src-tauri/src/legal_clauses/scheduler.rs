use std::sync::Arc;

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
        // Use tokio-cron-scheduler in production, but keep the job body simple.
        // If cron scheduler fails to start, fall back to a simple interval loop.
        let cron_expr = format!("0 0 0 */{} * *", config.interval_days.max(1));

        let mut used_cron = false;
        if let Ok(sched) = tokio_cron_scheduler::JobScheduler::new().await {
            let db_for_job = Arc::clone(&db);
            let endpoint_for_job = endpoint.clone();
            if let Ok(job) = tokio_cron_scheduler::Job::new_async(cron_expr.as_str(), move |_id, _lock| {
                let db = Arc::clone(&db_for_job);
                let endpoint = endpoint_for_job.clone();
                Box::pin(async move {
                    let conn = db.lock().await;
                    let _ = sync_legal_clauses(&*conn, &endpoint).await;
                })
            }) {
                if sched.add(job).await.is_ok() && sched.start().await.is_ok() {
                    used_cron = true;
                    // Keep task alive.
                    std::future::pending::<()>().await;
                }
            }
        }

        if !used_cron {
            let dur = tokio::time::Duration::from_secs(60 * 60 * 24 * config.interval_days.max(1) as u64);
            loop {
                tokio::time::sleep(dur).await;
                let conn = db.lock().await;
                let _ = sync_legal_clauses(&*conn, &endpoint).await;
            }
        }
    });

    SchedulerHandle { join }
}

#[cfg(test)]
include!("scheduler/tests.rs");
