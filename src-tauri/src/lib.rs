// AIRE 桌面 App — Tauri 主應用程式組裝
//
// Task 1.2：greet IPC 命令用於 Tauri ⇄ Next.js 整合 spike。
// Task 1.3：ensure_app_dirs 啟動時建立應用資料目錄。
// Task 1.4：依 Cargo.toml 注入版本號到主視窗標題。

pub mod paths;

/// 整合 spike 用的 hello-world IPC 命令。
///
/// 前端呼叫範例：
/// ```ts
/// import { invoke } from "@tauri-apps/api/core";
/// const msg: string = await invoke("greet", { name: "AIRE" });
/// // msg === "Hello, AIRE! AIRE 桌面 App 已啟動。"
/// ```
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! AIRE 桌面 App 已啟動。")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Task 1.3：首次啟動建立 app data 與 logs 目錄
            paths::ensure_app_dirs()
                .map_err(|err| format!("failed to ensure app data directories: {err}"))?;

            // Task 1.4：主視窗標題注入版本號（從 Cargo.toml 透過 PackageInfo 取得）
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

// 啟用 get_webview_window
use tauri::Manager;
