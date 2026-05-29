## 1. 建置配置調整

- [x] 1.1 為滿足 `Tauri shell with Next.js frontend` 的 Windows 安裝格式要求，修改 `src-tauri/tauri.conf.json` 的 `bundle.targets`，由 `"all"` 改為 `["nsis", "msi"]`，確保 Windows 建置同時產出 NSIS `.exe` 與 WiX `.msi` 兩種安裝格式。驗證方式：於 Windows 環境執行 `pnpm tauri build` 後，`src-tauri/target/release/bundle/msi/` 與 `src-tauri/target/release/bundle/nsis/` 皆存在安裝檔，且兩者皆可正常安裝執行。
- [x] 1.2 確認 `bundle.windows.webviewInstallMode` 維持 `embedBootstrapper`（`silent: true`），確保 MSI 與 NSIS 皆內嵌 WebView2 bootstrapper，無需額外網路下載即可安裝。驗證方式：檢查 `tauri.conf.json` 中 `webviewInstallMode` 設定與現行一致，並於離線 Windows 環境測試安裝流程可完成。
- [x] 1.3 確認 `bundle.windows.nsis.installMode` 維持 `currentUser`，避免改為 `perMachine` 導致安裝路徑或權限變更。驗證方式：檢查 `tauri.conf.json` 中 `nsis.installMode` 未變動，安裝後應用程式位於 `%LOCALAPPDATA%\Programs\AIRE\`。

## 2. CI/CD 與發佈流程更新

- [x] 2.1 更新 `.github/workflows/release.yml` 的「Locate Windows installer」步驟，改為同時定位 `.msi` 與 `*setup.exe` 兩種安裝檔，並將路徑寫入環境變數供後續步驟使用。驗證方式：觸發 release workflow 後，Windows job 的 log 中正確輸出 MSI 與 NSIS 兩個安裝檔的完整路徑。
- [x] 2.2 更新 `.github/workflows/release.yml`，使 `tauri-apps/tauri-action` 上傳的 release assets 同時包含 `.msi` 與 `.exe`（NSIS）兩種 artifact。驗證方式：於 GitHub Release draft 頁面可見兩個 Windows 安裝檔，檔名分別符合 `AIRE_*_x64-setup.exe` 與 `AIRE_*_x64.msi`（或對應命名規則）。
- [x] 2.3 更新 `.github/workflows/release.yml` 的「Windows runtime smoke」步驟註解或文件，說明目前 runtime smoke 僅針對 NSIS `.exe` 進行（MSI 安裝測試另案規劃）。驗證方式：檢視 workflow 檔案，相關步驟有明確註解說明測試範圍限制。

## 3. 文件與下載導向更新

- [x] 3.1 更新下載頁面或發佈相關文件（如 `README.md`、OPCOS 下載頁），明確標註「Windows 用戶請優先下載 `.msi` 安裝檔，防毒軟體誤報率較低；如無法安裝再選用 `.exe`」。驗證方式：文件內容審查，確認 MSI 被明確標示為推薦格式，且兩種格式皆有下載連結。
- [x] 3.2 更新開發者文件或建置腳本註解，說明 Windows 打包現行產出雙格式，以及 MSI 僅能在 Windows 主機或 Windows CI runner 上建置的限制。驗證方式：文件內容審查，確認開發者知悉建置限制與輸出位置。

## 4. 驗證與 Review

- [x] 4.1 於 Windows 環境執行完整建置，確認 `src-tauri/target/release/bundle/` 下同時存在 `.msi` 與 `.exe`，兩者皆可成功安裝並啟動 AIRE。驗證方式：手動執行安裝程式，確認應用程式可正常啟動並顯示主視窗（1280x800）。
- [x] 4.2 確認 macOS 建置不受影響，`pnpm tauri build` 於 macOS 仍正常產出 `.dmg` 與 `.app`。驗證方式：於 macOS 環境執行建置，確認 `src-tauri/target/release/bundle/dmg/` 存在 `.dmg` 檔案。
