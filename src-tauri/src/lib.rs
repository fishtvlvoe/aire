// AIRE 桌面 App — Tauri 主應用程式組裝
//
// Task 1.2：greet IPC 命令用於 Tauri ⇄ Next.js 整合 spike。
// Task 1.3：ensure_app_dirs 啟動時建立應用資料目錄。
// Task 1.4：依 Cargo.toml 注入版本號到主視窗標題。
// Task 2.x：SQLite schema + migration runner，啟動時初始化 aire.db。
// Task 3.x：secrets 模組封裝 OS keychain。
// Task 4.x：opcos / license IPC commands、device_id 生成、啟動決策樹。
// Task 6.3/6.4/7.2：drafts IPC（save_draft / get_draft）支援 autosave。
// Task 8.4：pdf IPC（export_pdf）寫檔 + 更新 cases.status。
// Task 9.x：operation_log writer + list_recent_logs 查詢 IPC。
// Stage 1-4（#1d）：legal_clauses / realtor_license IPC + 排程器。

pub mod branding;
pub mod commands;
pub mod crypto;
pub mod db;
pub mod legal_clauses;
pub mod log;
pub mod opcos;
pub mod paths;
pub mod realtor_license;
pub mod secrets;
pub mod startup;

// Phase 3：land_registry
pub mod land_registry;

// Phase 2 紅燈測試模組（sqlite_encryption）仍保留在 feature gate 之後。
#[cfg(all(test, feature = "phase2-red-tests"))]
pub mod encryption;

// Stage 1 需要用到 crate::encryption::KeychainState（供 land_registry cache 測試）。
#[cfg(not(feature = "phase2-red-tests"))]
pub mod encryption {
    #[derive(Debug, Clone)]
    pub struct KeychainState {
        available: bool,
    }

    impl KeychainState {
        pub fn unavailable() -> Self {
            Self { available: false }
        }

        pub fn available() -> Self {
            Self { available: true }
        }

        pub fn is_available(&self) -> bool {
            self.available
        }
    }
}

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use tauri::Manager;

/// 共享狀態：DB connection（包在 Mutex，Tauri IPC 多執行緒安全）。
pub struct DbState(pub Mutex<Connection>);

/// 共享狀態：keychain backend（trait object，方便測試與替換）。
pub struct KeyringState(pub Box<dyn secrets::KeyringBackend>);

/// 共享狀態：DB 路徑 + OPCOS 設定（供 async IPC 在 spawn_blocking 內開新連線使用）。
/// rusqlite::Connection 不實作 Send，async fn 持有 &Connection 跨 .await 會違反 Send bound。
/// 解法：async IPC 不持有 Connection，改在 spawn_blocking 內重新開連線執行同步操作。
pub struct AsyncIpcState {
    pub db_path: PathBuf,
    pub http_client: reqwest::Client,
    pub opcos_base_url: String,
    pub opcos_token: String,
}

/// 整合 spike 用的 hello-world IPC 命令。
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! AIRE 桌面 App 已啟動。")
}

// ── legal_clauses IPC commands ────────────────────────────────────────────────

/// 從本地快取取得單筆法條（同步，無 HTTP）
#[tauri::command]
fn get_legal_clause(
    db: tauri::State<'_, DbState>,
    law_id: String,
) -> Result<Option<legal_clauses::LegalClause>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    legal_clauses::cache::get_law(&conn, &law_id).map_err(|e| e.to_string())
}

/// 列出所有已快取法條（同步，無 HTTP）
#[tauri::command]
fn list_legal_clauses(
    db: tauri::State<'_, DbState>,
) -> Result<Vec<legal_clauses::LegalClause>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    legal_clauses::cache::list_laws(&conn).map_err(|e| e.to_string())
}

/// 手動觸發法條同步（呼叫 OPCOS，需要 spawn_blocking 避免 Connection !Send 問題）
#[tauri::command]
async fn sync_legal_clauses(
    ipc: tauri::State<'_, AsyncIpcState>,
) -> Result<legal_clauses::SyncResult, String> {
    let db_path = ipc.db_path.clone();
    let client = ipc.http_client.clone();
    let base_url = ipc.opcos_base_url.clone();
    let token = ipc.opcos_token.clone();

    tauri::async_runtime::spawn_blocking(move || {
        // 在 blocking 執行緒內開新連線，避免 MutexGuard 跨 await
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|e| e.to_string())?;
        rt.block_on(legal_clauses::sync_legal_clauses(
            &conn, &client, &base_url, &token,
        ))
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ── realtor_license IPC command ───────────────────────────────────────────────

/// 驗證不動產經紀人執照（cache hit 優先，否則呼叫 OPCOS）
#[tauri::command]
async fn verify_realtor_license(
    ipc: tauri::State<'_, AsyncIpcState>,
    license_number: String,
) -> Result<realtor_license::LicenseVerificationResult, String> {
    let db_path = ipc.db_path.clone();
    let client = ipc.http_client.clone();
    let base_url = ipc.opcos_base_url.clone();
    let token = ipc.opcos_token.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|e| e.to_string())?;
        rt.block_on(realtor_license::verify_realtor_license(
            &conn,
            &client,
            &base_url,
            &token,
            &license_number,
        ))
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = paths::ensure_app_dirs()
                .map_err(|err| format!("failed to ensure app data directories: {err}"))?;

            let db_path = app_dir.join("aire.db");
            let conn = db::init_db(&db_path)
                .map_err(|err| format!("failed to init SQLite db: {err}"))?;

            // device_id 首次啟動產生（Task 4.2）
            commands::license::ensure_device_id(&conn)
                .map_err(|e| format!("failed to ensure device_id: {e}"))?;

            // 啟動決策樹（Task 4.4）— 寫 operation_log，UI 依 license_runtime_state 決定首頁
            let _ = startup::run_startup_decision(&conn);

            // 讀取 OPCOS 設定（環境變數，生產環境應由 keychain 取得）
            let opcos_base_url = std::env::var("OPCOS_BASE_URL")
                .unwrap_or_else(|_| "https://opcos.aiver.me".to_string());
            let opcos_token = std::env::var("OPCOS_TOKEN").unwrap_or_default();
            let http_client = reqwest::Client::new();

            // 啟動法條同步排程（startup 立即同步 + 每 7 天 interval）
            // scheduler 用獨立的 DB 連線（Arc<Mutex<Connection>>）
            {
                let scheduler_conn = Arc::new(Mutex::new(
                    Connection::open(&db_path)
                        .map_err(|e| format!("failed to open scheduler db conn: {e}"))?,
                ));
                legal_clauses::scheduler::spawn_scheduler(
                    scheduler_conn,
                    http_client.clone(),
                    opcos_base_url.clone(),
                    opcos_token.clone(),
                );
            }

            app.manage(DbState(Mutex::new(conn)));
            app.manage(KeyringState(Box::new(secrets::OsKeyring)));
            app.manage(AsyncIpcState {
                db_path,
                http_client,
                opcos_base_url,
                opcos_token,
            });

            let version = app.package_info().version.to_string();
            let title = format!("AIRE {version}");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title(&title);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::license::activate_license,
            commands::license::verify_license,
            commands::license::get_license_status,
            commands::cases::list_cases,
            commands::cases::get_case,
            commands::cases::create_case,
            commands::cases::update_case,
            commands::cases::delete_case,
            commands::cases::mark_completed,
            commands::drafts::save_draft,
            commands::drafts::get_draft,
            commands::pdf::export_pdf,
            commands::log::list_recent_logs,
            branding::save_logo,
            branding::load_logo,
            branding::delete_logo,
            branding::set_theme,
            branding::get_theme,
            // Stage 1-4 IPC commands（#1d legal-clauses-autofill）
            get_legal_clause,
            list_legal_clauses,
            sync_legal_clauses,
            verify_realtor_license,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AIRE application");
}
