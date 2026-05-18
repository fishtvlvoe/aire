// Tauri build script — 在編譯期注入產品 metadata 與處理 icon
fn main() {
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let force_release = std::env::var("AIRE_RELEASE_BUILD").map_or(false, |v| v == "1");
    if profile == "release" || force_release {
        println!("cargo:rustc-env=OPCOS_API_BASE_URL=https://aire.opcos.me");
    }
    tauri_build::build()
}
