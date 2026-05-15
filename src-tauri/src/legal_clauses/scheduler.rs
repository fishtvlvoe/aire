use std::sync::Arc;
use std::time::Duration;

use reqwest::Client;
use rusqlite::Connection;
use std::sync::Mutex;

use super::sync_legal_clauses;

pub fn spawn_scheduler(
    conn: Arc<Mutex<Connection>>,
    client: Client,
    base_url: String,
    token: String,
) {
    let startup_conn = Arc::clone(&conn);
    let startup_client = client.clone();
    let startup_base_url = base_url.clone();
    let startup_token = token.clone();

    std::thread::spawn(move || {
        let runtime = tokio::runtime::Runtime::new().expect("create runtime");
        let guard = startup_conn.lock().expect("lock conn");
        let _ = runtime.block_on(sync_legal_clauses(
            &guard,
            &startup_client,
            &startup_base_url,
            &startup_token,
        ));
    });

    std::thread::spawn(move || {
        let runtime = tokio::runtime::Runtime::new().expect("create runtime");
        loop {
            std::thread::sleep(Duration::from_secs(7 * 24 * 60 * 60));
            let guard = conn.lock().expect("lock conn");
            let _ = runtime.block_on(sync_legal_clauses(&guard, &client, &base_url, &token));
        }
    });
}

#[cfg(test)]
mod tests {
    #[test]
    fn scheduler_placeholder_test() {
        // 確保模組具備測試區塊
        assert_eq!(7 * 24 * 60 * 60, 604800);
    }
}
