// 應用資料目錄解析與初始化（Task 1.3）
//
// macOS:   ~/Library/Application Support/aire/
// Windows: %APPDATA%\aire\
// Linux:   ~/.config/aire/（Phase 1 不支援 Linux，僅為開發環境便利）
//
// 設計依據：openspec/changes/aire-desktop-phase1/design.md D2 與
// capability spec desktop-shell — Application data directory。

use std::fs;
use std::io;
use std::path::PathBuf;

/// 取得 AIRE 的應用資料根目錄。
///
/// 跨平台規則：
/// - macOS：`$HOME/Library/Application Support/aire`
/// - Windows：`%APPDATA%\aire`（即 `C:\Users\<user>\AppData\Roaming\aire`）
/// - 其他（Linux 等開發機）：`$XDG_CONFIG_HOME/aire` 或 `$HOME/.config/aire`
///
/// 注意：本函式只計算路徑，不保證目錄存在；建立目錄請呼叫 `ensure_app_dirs`。
pub fn app_data_dir() -> io::Result<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var_os("HOME")
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "HOME not set"))?;
        Ok(PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("aire"))
    }

    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var_os("APPDATA")
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "APPDATA not set"))?;
        Ok(PathBuf::from(appdata).join("aire"))
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(xdg) = std::env::var_os("XDG_CONFIG_HOME") {
            return Ok(PathBuf::from(xdg).join("aire"));
        }
        let home = std::env::var_os("HOME")
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "HOME not set"))?;
        Ok(PathBuf::from(home).join(".config").join("aire"))
    }
}

/// 取得 logs 子目錄路徑（不保證存在）。
pub fn logs_dir() -> io::Result<PathBuf> {
    Ok(app_data_dir()?.join("logs"))
}

/// 首次啟動建立應用資料目錄與 logs 子目錄。
///
/// 已存在則為 no-op。回傳實際的 app data dir。
pub fn ensure_app_dirs() -> io::Result<PathBuf> {
    let root = app_data_dir()?;
    fs::create_dir_all(&root)?;
    fs::create_dir_all(root.join("logs"))?;
    Ok(root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_data_dir_resolves_to_non_empty_path() {
        let p = app_data_dir().expect("app data dir should resolve");
        assert!(p.ends_with("aire"), "path should end with 'aire': {p:?}");
    }

    #[test]
    fn logs_dir_is_under_app_data_dir() {
        let root = app_data_dir().unwrap();
        let logs = logs_dir().unwrap();
        assert!(logs.starts_with(&root));
        assert!(logs.ends_with("logs"));
    }
}
