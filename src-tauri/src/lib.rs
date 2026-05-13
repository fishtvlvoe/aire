// AIRE 桌面 App — Tauri 主應用程式組裝
//
// Task 1.2：greet IPC 命令用於 Tauri ⇄ Next.js 整合 spike。
// Task 1.3：ensure_app_dirs 啟動時建立應用資料目錄。
// Task 1.4：依 Cargo.toml 注入版本號到主視窗標題。
// Task 2.x：SQLite schema + migration runner，啟動時初始化 aire.db。
// Task 3.x：secrets 模組封裝 OS keychain。

pub mod db;
pub mod paths;
pub mod secrets;

/// 整合 spike 用的 hello-world IPC 命令。
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! AIRE 桌面 App 已啟動。")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = paths::ensure_app_dirs()
                .map_err(|err| format!("failed to ensure app data directories: {err}"))?;

            let db_path = app_dir.join("aire.db");
            let _conn = db::init_db(&db_path)
                .map_err(|err| format!("failed to init SQLite db: {err}"))?;

            let version = app.package_info().version.to_string();
            let title = format!("AIRE {version}");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title(&title);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running AIRE application");
}

use tauri::Manager;
