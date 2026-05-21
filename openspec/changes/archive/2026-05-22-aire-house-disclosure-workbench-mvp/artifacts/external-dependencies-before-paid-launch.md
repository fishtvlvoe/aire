# External Dependencies Before Paid Launch

日期：2026-05-21

目的：把目前不能只靠本機程式碼完成的外部依賴獨立列出，避免把尚未確認的服務、法規或訂閱狀態誤當成已完成開發。

## COP / MOI API

需確認：

- COP production token endpoint。
- COP sandbox token endpoint。
- 現有 Basic auth `StaticApiKeyProvider::configured` 是否只是開發用。
- 各 MOI API 是否有正式商用額度、扣款方式與錯誤碼文件。
- 建物門牌 / 地址轉建號服務是否已訂閱；若未訂閱，案件建立必須保留手動建號 fallback。

目前程式策略：

- 謄本查詢條件仍保留手動地號 / 建號。
- 地址轉建號不得成為唯一主流程。
- API 查不到時，PDF 留空白，不輸出 `待補`。

## 最新 MOI / 法規格式

上線前需重新查核：

- 內政部不動產說明書最新格式是否仍與目前 105 年範例相容。
- 2026 新增欄位：太陽光電設備狀態 / 位置、建築能效狀況 / 備註。
- 成屋、土地、特殊類型物件是否有不同揭露欄位。

目前程式策略：

- `HOUSE_2026_LEGAL_UPDATE_FIELDS` 已先放入資料模型。
- 版面與正式法律文字仍需付費上線前查核。

## 法律文字審查

需外部確認：

- 臺灣個資法與不動產經紀業相關法規下，本機保存 / 雲端不保存的告知文字。
- 裝置綁定、一台電腦一個授權、多台另購授權的使用條款。
- 授權轉移一個月一次，超過需客服審核的條款。
- 客戶電腦損壞導致資料遺失由客戶自行負責的免責告知。
- 密碼、帳號、最小使用紀錄的保存與刪除政策。

目前程式策略：

- 授權 payload 白名單不含地址、地號、建號、所有權人、謄本、PDF、圖片。
- 案件資料、謄本 payload、照片與 PDF 都留在本機。

## Tauri / 本機資料驗證

需實機驗證：

- 正式 App 啟動路徑是否使用 encrypted DB。
- 拉謄本後重開 App，`land_registry_data` 是否仍可讀。
- 另存謄本資料檔是否只寫到使用者選擇路徑。
- PDF 預覽與下載輸出是否一致。

目前程式策略：

- TypeScript path 已可保存 `land_registry_data` 並顯示謄本資料預覽。
- Rust/Tauri DB path 已補檔案型 SQLite 驗證：寫入 `land_registry_data`、關閉連線、重新 `init_db` 後仍可讀回。完整 App UI 實機操作仍需在 macOS App / Windows VM 驗收。

## Tauri / Windows 發版與 Mac 上測試

已確認：

- AIRE 目前已是 Tauri v2 專案，`package.json` 有 `pnpm tauri:dev` 與 `pnpm tauri:build`。
- `src-tauri/tauri.conf.json` 已啟用 bundle，且 `targets` 目前為 `all`。
- 本機已存在 macOS Apple Silicon `.dmg`：
  - `src-tauri/target/debug/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
  - `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
- 本機已用 macOS 交叉編譯產出 Windows NSIS `*-setup.exe`；尚未在 Windows VM 安裝驗收。
- `.github/workflows/release.yml` 仍是 Electron Release，需改成 Tauri / pnpm 發版流程。
- 2026-05-21 已將 `.github/workflows/release.yml` 改成 Tauri / pnpm release workflow；仍需 GitHub Actions 實跑確認。
- 2026-05-21 已在 `src-tauri/tauri.conf.json` 補 Windows installer 設定：保留 `targets = "all"`、WebView2 使用 `embedBootstrapper`、NSIS 採 current-user 安裝、禁止降版安裝。
- 2026-05-21 已在 Mac 本機跑過 `pnpm tauri:build`，macOS `.app` 與 `.dmg` 可產出；Windows 安裝檔仍需 Windows runner 或 UTM Windows VM 實測。
- 2026-05-21 已確認 UTM App 存在，但預設位置未找到 Windows VM；因此 Windows VM 安裝與 PDF 驗收仍未完成。
- 2026-05-21 使用者同意後，已安裝 macOS 交叉編譯工具：`makensis` v3.12、`rustup` 1.29.0、`rustc` 1.95.0、`cargo-xwin` 0.22.0，並透過 `/opt/homebrew/opt/llvm/bin/llvm-rc` 完成 Windows resource toolchain。
- 2026-05-21 已執行 `pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --no-sign`，成功產出：
  - `src-tauri/target/x86_64-pc-windows-msvc/release/aire.exe`
  - `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`
- 交叉編譯產物未簽章；Tauri 也提示 cross-platform compilation 仍屬 experimental。正式交付前仍需 Windows VM 或 GitHub Actions Windows runner 驗收。
- 2026-05-21 已新增並通過 `test_land_registry_data_survives_db_reopen`，確認 Tauri DB 檔案重開後 `land_registry_data` 不會消失。

需實機或 CI 驗證：

- Windows `.msi` 或 NSIS `*-setup.exe` 可成功產出。
- Windows 安裝檔可在 UTM Windows VM 安裝。
- Windows App 可啟動、授權、建立案件、拉謄本、保存 `land_registry_data`、另存謄本 payload、預覽與匯出 PDF。
- Windows PDF 字型不可亂碼；現況調查表要保留可手寫空白，不輸出 `待補` 或 `未填`。
- GitHub Actions release workflow 可在 macOS Apple Silicon、macOS Intel、Windows runner 成功產出 draft release assets。

目前決策：

- 主路線：macOS 本機測 macOS 版；Windows 版用 GitHub Actions 或 UTM Windows VM 打包。
- 驗收路線：Windows 安裝檔必須在 UTM Windows VM 實際安裝與操作，不能只看 build 成功。
- 備援路線：macOS 交叉編譯 Windows NSIS `setup.exe` 只作臨時方案，不取代 VM / CI。
- 詳細計畫見 `tauri-windows-mac-test-plan.md`。
