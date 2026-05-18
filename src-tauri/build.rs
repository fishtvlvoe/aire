// Tauri build script — 在編譯期注入產品 metadata 與處理 icon
fn main() {
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let force_release = std::env::var("AIRE_RELEASE_BUILD").map_or(false, |v| v == "1");
    if profile == "release" || force_release {
        // 允許 CI / 測試版 override（例如指向 workers.dev）
        let base_url = std::env::var("OPCOS_API_BASE_URL_OVERRIDE")
            .unwrap_or_else(|_| "https://aire.opcos.me".to_string());
        println!("cargo:rustc-env=OPCOS_API_BASE_URL={base_url}");
    }
    tauri_build::build()
}
