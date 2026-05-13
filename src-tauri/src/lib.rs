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

pub mod commands;
pub mod db;
pub mod log;
pub mod opcos;
pub mod paths;
pub mod secrets;
pub mod startup;

use std::sync::Mutex;

use rusqlite::Connection;

/// 共享狀態：DB connection（包在 Mutex，Tauri IPC 多執行緒安全）。
pub struct DbState(pub Mutex<Connection>);

/// 共享狀態：keychain backend（trait object，方便測試與替換）。
pub struct KeyringState(pub Box<dyn secrets::KeyringBackend>);

/// 整合 spike 用的 hello-world IPC 命令。
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! AIRE 桌面 App 已啟動。")
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

            app.manage(DbState(Mutex::new(conn)));
            app.manage(KeyringState(Box::new(secrets::OsKeyring)));

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running AIRE application");
}

use tauri::Manager;
