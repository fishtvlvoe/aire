## Why

目前 AIRE 桌面 App 僅打包 NSIS 安裝程式（.exe）。NSIS 因長期被惡意軟體濫用，導致 Windows Defender 與多款防毒軟體誤報率極高，嚴重影響房仲客戶的下載安裝體驗。根據社群實測與 Tauri 官方文件，MSI（WiX）安裝程式的防毒誤報率顯著低於 NSIS，且企業環境對 MSI 接受度更高。

## What Changes

- 修改 `src-tauri/tauri.conf.json` 的 `bundle.targets`，由 `"all"` 改為 `["nsis", "msi"]`，同時產出 NSIS 與 MSI 兩種 Windows 安裝格式
- 將 MSI 設為預設推薦格式（下載頁面、文件優先導向 MSI）
- 調整 `bundle.windows.webviewInstallMode` 為 `embedBootstrapper`（已設定，確認維持不變），確保 MSI 與 NSIS 皆內嵌 WebView2 bootstrapper，支援離線與 Windows 7 環境
- 更新 GitHub Actions Release workflow，同時上傳 `.msi` 與 `.exe` 兩種 artifact
- 更新相關建置腳本與文件，說明 MSI 為推薦格式

## Non-Goals

- 不引入程式碼簽署（Code Signing）——簽署規劃另案處理
- 不改變 macOS 或 Linux 的打包格式
- 不調整安裝路徑或安裝模式（維持 `currentUser`）
- 不修改 updater 機制（維持現有 Tauri updater 設定）

## Capabilities

### New Capabilities

（無新增產品功能，此變更為建置與發佈流程調整）

### Modified Capabilities

- `desktop-shell`: 明確要求 Windows 建置同時產出 `.msi`（WiX）與 `.exe`（NSIS）兩種安裝格式，並將 `.msi` 設為預設推薦下載選項

## Impact

- Affected specs: `desktop-shell`（修改 Windows installer 產出要求）
- Affected code:
  - Modified: `src-tauri/tauri.conf.json`（bundle.targets、windows 安裝設定）
  - Modified: `.github/workflows/release.yml`（若存在，需新增 MSI artifact 上傳；若不存在則標記為待建）
  - Modified: 下載頁面或發佈文件（標註 MSI 為推薦格式）
  - New: （無新檔案）
  - Removed: （無刪除檔案）
- Dependencies: 無新增 runtime dependency
- 環境變數: 無新增
- 限制: MSI 安裝程式僅能在 Windows 主機或 Windows runner（如 GitHub Actions `windows-latest`）上建置，無法跨平台編譯
