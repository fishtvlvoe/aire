# Tauri Windows on Mac Test Plan

日期：2026-05-21

目的：把 AIRE 桌面版的 macOS / Windows 打包、mac 上驗證 Windows 版、UTM 實機測試與備援路線寫成可執行計畫，避免之後只知道「要做 Windows 版」但不知道怎麼驗收。

## 目前狀態

- AIRE 目前已是 Tauri v2 專案，`package.json` 有 `pnpm tauri:dev` 與 `pnpm tauri:build`。
- `src-tauri/tauri.conf.json` 已設定 `bundle.active = true`、`bundle.targets = "all"`，並包含 macOS `icon.icns` 與 Windows `icon.ico`。
- 本機目前已找到 macOS Apple Silicon 安裝檔：
  - `src-tauri/target/debug/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
  - `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
- 2026-05-21 已用 macOS 交叉編譯產出 Windows NSIS `setup.exe`；尚未在 Windows VM 安裝驗收。
- `.github/workflows/release.yml` 仍是舊 Electron 發版流程，使用 `npm ci`、`electron:compile`、`electron-builder`，不符合目前 Tauri / pnpm 專案。
- 2026-05-21 已將 release workflow 改為 Tauri / pnpm / GitHub Actions matrix，產物先進 draft release。
- 2026-05-21 已補 `src-tauri/tauri.conf.json` Windows installer 策略：
  - `targets` 保持 `all`，讓 Windows runner 產 `.msi` 與 NSIS `*-setup.exe`。
  - `webviewInstallMode.type = embedBootstrapper`，安裝檔增加約 1.8MB，但比純下載 bootstrapper 更穩。
  - `webviewInstallMode.silent = true`。
  - `allowDowngrades = false`，避免客戶誤裝舊版覆蓋新版。
  - `nsis.installMode = currentUser`，第一版避免要求系統管理員權限。
- 2026-05-21 本機驗證結果：
  - `.github/workflows/release.yml` 可被 YAML parser 解析。
  - `pnpm tauri info` 可讀取目前 Tauri config。
  - `pnpm type-check` 通過。
  - `pnpm test` 通過：108 個 test files、531 個 tests。
  - `pnpm build` 通過。
  - `pnpm tauri:build` 通過，重新產出：
    - `src-tauri/target/release/bundle/macos/AIRE.app`
    - `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`
  - Rust build 仍有既有 dead-code warnings，未阻塞 macOS bundle。
  - `src/components/case-wizard/__tests__/CaseWizardStep5.test.tsx` 已補強：iframe 預覽與匯出下載使用同一個 PDF Blob，避免預覽與下載兩套輸出再次漂移。
  - `LifeAmenitiesPage` 已補列印用資料壓縮，PDF 端限制生活機能輸出數量：學校 1、醫療 1、公園 1、捷運 1、市場 2，避免單頁排版被過多資料撐爆。
  - 目標測試已通過：`life-amenities.test.tsx`、`overpass-client.test.ts`、`CaseWizardStep5.test.tsx`。
- 2026-05-21 Windows-on-Mac 檢查結果：
  - `/Applications/UTM.app` 存在。
  - 預設 UTM 文件位置未找到 `.utm` VM，因此目前不能直接做 8.5 到 8.7。
  - 本機有 Homebrew 與 `llvm`。
  - 使用者同意後，已安裝交叉編譯工具：
    - `makensis` v3.12
    - `rustup` 1.29.0
    - `rustc` 1.95.0 stable
    - `cargo-xwin` 0.22.0
    - `llvm-rc` 位於 `/opt/homebrew/opt/llvm/bin/llvm-rc`
  - 已執行 `rustup target add x86_64-pc-windows-msvc`。
  - 已執行 `pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --no-sign`。
  - 交叉編譯成功產出：
    - Windows 主程式：`src-tauri/target/x86_64-pc-windows-msvc/release/aire.exe`
    - Windows NSIS 安裝檔：`src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`
  - Tauri 明確警告 cross-platform compilation 仍屬 experimental，且簽章預設只支援 Windows host；本次 installer 未簽章。
  - macOS 交叉編譯會忽略 MSI；`.msi` 仍需 Windows runner 或 Windows VM 產出。
  - 8.5 到 8.7 仍未完成，因為目前沒有可直接使用的 UTM Windows VM 做安裝與 PDF 驗收。

## 判斷結論

建議主路線如下：

1. macOS 版在 Mac 本機直接打包與驗收。
2. Windows 版用 GitHub Actions 或 UTM 內的 Windows VM 打包。
3. Windows 版一定要在 Windows 環境實際安裝、開啟、操作案件、匯出 PDF 才能算通過。
4. macOS 上交叉編譯 Windows 只當備援，不能取代 Windows VM 或 CI 驗收。

原因：

- Tauri 官方文件指出 Windows `.msi` 由 WiX Toolset 建立，`.msi` 只能在 Windows 上產生。
- Tauri 官方文件也指出 Linux / macOS 交叉編譯 Windows 可行但有限制，主要是 NSIS installer，且不如本機 VM 或 CI 穩定。
- 本機 2026-05-21 已證實 macOS 可以產 NSIS `AIRE_0.1.0_x64-setup.exe`，但這只代表建置成功，不代表 Windows 客戶端已驗收。
- Windows 版使用 WebView2；Windows 10 / 11 通常已有 WebView2，但安裝檔策略仍需確認 `downloadBootstrapper`、`embedBootstrapper` 或 `offlineInstaller`。
- 使用者最後買到的是 Windows 安裝檔，不是 macOS 交叉編譯成功訊息；所以最終驗收必須在 Windows 裡跑。

## 路線 A：Mac 本機驗證 macOS 版

使用時機：

- 每次功能改完，要先確認 macOS 版 App 能開、資料能存、PDF 能匯出。

步驟：

1. 在 Mac 執行 `pnpm install`。
2. 執行 `pnpm type-check`。
3. 執行 `pnpm test`。
4. 執行 `pnpm tauri:build`。
5. 安裝 `src-tauri/target/release/bundle/dmg/AIRE_0.1.0_aarch64.dmg`。
6. 開啟 AIRE App。
7. 建立案件。
8. 拉謄本。
9. 確認謄本資料預覽可看到土地標示、土地所有權、建物標示、建物所有權與缺漏欄位。
10. 另存謄本 payload。
11. 關閉並重開 App，確認 `land_registry_data` 仍存在。
12. 填寫現場必問與秘書後補。
13. 匯出 PDF，確認預覽與下載 PDF 一致。

通過條件：

- App 可安裝與開啟。
- 本機資料可持久保存。
- PDF 沒有亂碼、沒有 `待補`、沒有不需要的頁碼。
- 圖片與文字不跑版。

## 路線 B：UTM Windows VM 打包與測試

使用時機：

- 要在 Mac 上實際測 Windows 版。
- 要確認 Windows 客戶端安裝後能否正常使用。

建議 VM：

- Apple Silicon Mac：優先建立 Windows 11 ARM VM。
- Intel Mac：建立 Windows 11 x64 VM。

準備步驟：

1. 安裝 UTM。
2. 建立 Windows 11 VM。
3. 安裝 UTM SPICE Guest Tools。
4. 啟用共享資料夾；Windows 建議使用 SPICE WebDAV，UTM 文件說這對 Windows 支援較好。
5. 在 Windows VM 安裝 Git。
6. 在 Windows VM 安裝 Node.js 22。
7. 在 Windows VM 啟用 pnpm，例如 `corepack enable` 後使用 `pnpm --version` 確認。
8. 在 Windows VM 安裝 Rust stable。
9. 在 Windows VM 安裝 Visual Studio Build Tools，勾選 `Desktop development with C++`。
10. 確認 WebView2 Runtime；Windows 10 / 11 通常已內建，但仍要能查到。
11. 若要產 `.msi`，確認 Windows Optional Features 的 VBSCRIPT 啟用。

打包步驟：

1. 在 Windows VM clone 或透過共享資料夾複製 AIRE 專案。
2. 執行 `pnpm install`。
3. 執行 `pnpm type-check`。
4. 執行 `pnpm test`。
5. 執行 `pnpm tauri build`。
6. 檢查輸出：
   - MSI：`src-tauri\target\release\bundle\msi\*.msi`
   - NSIS：`src-tauri\target\release\bundle\nsis\*-setup.exe`

Windows 安裝驗收：

1. 安裝 `.msi` 或 `*-setup.exe`。
2. 從 Start Menu 或桌面捷徑開啟 AIRE。
3. 登入或啟用授權。
4. 建立案件。
5. 拉謄本並確認預覽資料完整。
6. 另存謄本 payload。
7. 關閉 App，重新開啟案件，確認謄本資料仍存在。
8. 操作現場必問工作台。
9. 操作秘書後補工作台。
10. 匯出 PDF。
11. 開啟 PDF，確認文字沒有亂碼、生活機能不超量、頁碼不殘留、現況調查表保留可手寫空白。

通過條件：

- Windows 安裝檔可正常安裝。
- App 可正常啟動，不只是在 Windows 裡 build 成功。
- Windows 本機資料保存與 Mac 行為一致。
- PDF 輸出與 iframe 預覽一致。

## 路線 C：GitHub Actions 產 Windows 安裝檔

使用時機：

- 要穩定產出給客戶下載的 macOS / Windows 安裝檔。
- 不想每次在 UTM VM 內手動打包。

需修改：

- `.github/workflows/release.yml` 已從 Electron Release 改成 Tauri Release。
- 使用 pnpm，不使用 npm。
- 使用 `tauri-apps/tauri-action`。
- matrix 至少包含：
  - `macos-latest`：Apple Silicon。
  - `macos-13`：Intel Mac。
  - `windows-latest`
- Release 先設為 draft，人工確認後再發布。

驗收：

1. 推 tag 或手動 workflow dispatch。
2. GitHub Actions macOS job 成功。
3. GitHub Actions Windows job 成功。
4. Release draft 有 macOS `.dmg` 與 Windows `.msi` / `*-setup.exe`。
5. 下載 Windows 安裝檔到 UTM Windows VM。
6. 跑完整 Windows 安裝驗收。

## 路線 D：macOS 交叉編譯 Windows NSIS 備援

使用時機：

- UTM VM 或 GitHub Actions 暫時不可用。
- 只需要快速產一個 Windows NSIS `setup.exe` 做初步測試。
- 使用者同意安裝或調整本機全域 build 工具。

限制：

- 不能產正式 `.msi`。
- 官方說 macOS / Linux 交叉編譯 Windows 不如 Windows VM 或 CI 穩。
- 交叉編譯成功不代表 Windows 客戶端可用；仍需丟進 UTM Windows VM 安裝測試。

初步命令：

```bash
brew install nsis llvm
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add x86_64-pc-windows-msvc
cargo install --locked cargo-xwin
pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --no-sign
```

2026-05-21 實測結果：

- Homebrew 實際安裝套件名稱為 `makensis`。
- 需在當次 shell 加上 PATH：`export PATH="$HOME/.cargo/bin:/opt/homebrew/opt/llvm/bin:$PATH"`。
- 成功產出 `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`。
- 產物未簽章，且尚未在 Windows VM 安裝測試。

驗收：

- 產出 `*-setup.exe` 後，必須複製到 UTM Windows VM。
- 在 Windows VM 安裝與執行完整 Windows 安裝驗收。

## 需要寫入開發任務

1. GitHub release workflow 已移除 Electron 發版流程，改成 Tauri / pnpm / matrix build；仍需 GitHub Actions 實跑驗收。
2. `src-tauri/tauri.conf.json` 已明確設定 Windows installer 策略；第一版保留 `targets = "all"`。
3. 已補一份 `docs/tauri-utm-windows-test-plan.md` 給未來實際操作使用。
4. 在 UTM Windows VM 實測 `pnpm tauri build`。
5. 在 UTM Windows VM 實測安裝檔。
6. 在 UTM Windows VM 驗證授權、謄本本機保存、另存謄本、預覽與 PDF 一致。
7. 將 Windows 實測結果回寫此 SDD，包含成功輸出路徑、失敗錯誤、修正方式與最後可交付安裝檔名稱。

## 今天如果無法進 UTM，仍可先完成

- 修正 `.github/workflows/release.yml`，讓 CI 之後能產 Windows 安裝檔。
- 建立 `docs/tauri-utm-windows-test-plan.md`。
- 檢查 `src-tauri/tauri.conf.json` 的 Windows installer 設定。
- 補上 release checklist。
- 保留任務未完成狀態，等實際 Windows VM 驗收後再勾選完成。

## 來源依據

- Tauri prerequisites：Windows 開發需要 Microsoft C++ Build Tools 與 WebView2，MSI 需要 VBSCRIPT。
- Tauri Windows Installer：Windows app 可輸出 `.msi` 或 NSIS `-setup.exe`；`.msi` 只能在 Windows 上建立；macOS / Linux 交叉編譯 Windows 可行但應作為 VM / CI 不可用時的備案。
- Tauri Windows Installer：WebView2 可使用 download bootstrapper、embedded bootstrapper、offline installer 或 fixed runtime。
- UTM Sharing：Windows 共享資料夾建議使用 SPICE WebDAV，需安裝 SPICE Guest Tools。
- tauri-apps/tauri-action：可用 GitHub Actions matrix 建 macOS、Windows 與 Linux 發版 assets。
