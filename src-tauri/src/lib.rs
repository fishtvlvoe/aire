// AIRE 桌面 App — Tauri 主應用程式組裝
//
// Task 1.1 階段只放最小骨架；Task 1.2 會加入 greet 命令、
// Task 1.3 會加入 paths::ensure_app_dirs 的啟動 hook。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running AIRE application");
}
