## 1. SDD 與紅燈測試

- [x] 1.1 [Tool: codex] 建立 registry preview / field survey / supplement workbench 的 UI-SDD，引用 `aire-license-local-vault-architecture` 內的 Page Contract 與 source extract artifacts。
- [x] 1.2 [Tool: codex] [P] Registry pull preview shows imported disclosure fields：先補測試，拉謄本後顯示完整欄位預覽、缺漏欄位、可保存狀態，不只顯示地號 / 建號。
- [x] 1.3 [Tool: codex] [P] Field survey is separate from case setup / Formal supplement workbench supports post-commission editing / Supplement workbench reuses Page Contracts：先補測試，現場必問與秘書後補不出現在案件建立 UI，且可用同一 case/page contract 資料輸出 PDF。
- [x] 1.4 [Tool: codex] [P] Advanced automation controls use SaaS entitlement：先補測試，Basic / Pro / Advanced entitlement 控制自動化按鈕可見與 disabled 狀態。
- [x] 1.5 [Tool: codex] Design topics data boundary / ui surfaces / entitlement model / verification strategy：實作前確認任務仍遵守本機資料邊界、四個 UI surfaces、entitlement model 與 verification strategy。

## 2. 謄本資料預覽與本機持久化

- [x] 2.1 [Tool: codex] Registry payload is durable in local storage：驗證真實 Tauri 路徑，拉謄本、重開案件、檢查 `land_registry_data` 是否仍存在，並把結果寫入 SDD。
- [x] 2.2 [Tool: codex] 實作「謄本資料預覽」面板，依來源分組顯示土地標示、土地所有權、建物標示、建物所有權、他項權利與缺漏欄位。
- [x] 2.3 [Tool: codex] Registry payload can be saved locally as a file：謄本 payload 可另存本機檔案，方便未來重用與客服排查，但不得上傳雲端。

## 3. 現場必問工作台

- [x] 3.1 [Tool: codex] House property types have distinct survey fields：建立房屋類型欄位 schema：大樓華廈、公寓、透天別墅、店面、套房、農舍、廠房。
- [x] 3.2 [Tool: codex] 實作現場必問工作台 UI，包含共通欄位、類型差異欄位、優點缺點、照片上傳。
- [x] 3.3 [Tool: codex] Image upload labels match page purpose：圖片上傳標籤要依頁面語意顯示：公司 Logo、格局圖 / 土地規劃圖、建物外觀、位置圖 / 周邊圖、現場調查照片；不得每頁都叫格局圖。

## 4. 秘書後補工作台

- [x] 4.1 [Tool: codex] 實作秘書後補工作台 UI，支援共通後補欄位與類型差異後補欄位。
- [x] 4.2 [Tool: codex] Supplement workbench reuses Page Contracts：補件資料與草稿資料共用同一份 Page Contract，不建立第二套 PDF schema。
- [x] 4.3 [Tool: codex] Fixed template preview and PDF stay consistent：補件後重新產生預覽與 PDF，確認預覽與下載 PDF 內容一致。

## 5. 方案權限與進階功能

- [x] 5.1 [Tool: codex] Advanced automation controls use SaaS entitlement：將進階自動化按鈕改由 entitlement payload 控制，不再只靠 mock feature flag。
- [x] 5.2 [Tool: codex] Basic 允許手動上傳圖片與手動補資料，但不可啟用實價登錄、周邊行情、地籍圖、空拍、街景、格局圖處理的自動 API。
- [x] 5.3 [Tool: codex] Pro / Advanced 的差異依 `license-entitlement-boundary.md` 的 Plan Feature Map 顯示。

## 6. PDF / 列印驗收

- [x] 6.1 [Tool: codex] 固定模板 PDF 不輸出 `待補`，空白欄位要可手寫。
- [x] 6.2 [Tool: codex] 移除不必要頁碼，避免補件插頁後頁碼混亂。
- [x] 6.3 [Tool: codex] 驗證列印 spacing：至少檢查封面、建物標示、生活機能、現況調查表。

## 7. 收尾

- [x] 7.1 [Tool: codex] 跑目標測試、`pnpm type-check`、`spectra analyze aire-house-disclosure-workbench-mvp`、`spectra validate --strict`。
- [x] 7.2 [Tool: codex] 將剩餘外部依賴列入 SDD：COP token、地址轉建號訂閱、最新 MOI 法規、法律文字審查。

## 8. Desktop Distribution Boundary / Tauri 桌面版 / Windows on Mac 驗收計畫

- [x] 8.1 [Tool: codex] 建立 Tauri Windows on Mac SDD：記錄目前 macOS `.dmg` 已存在、Windows 安裝檔尚未驗證、Electron release workflow 已過時、Windows 測試主路線為 UTM VM 或 GitHub Actions。
- [x] 8.2 [Tool: codex] [P] 更新 `.github/workflows/release.yml`：移除 Electron / npm / electron-builder 流程，改成 Tauri / pnpm / `tauri-apps/tauri-action`，matrix 至少產 macOS 與 Windows release draft。
- [x] 8.3 [Tool: codex] [P] 建立 `docs/tauri-utm-windows-test-plan.md`：用非工程師也能照做的方式寫出 UTM Windows VM 安裝、共享資料夾、Windows 依賴、打包、安裝與驗收流程。
- [x] 8.4 [Tool: codex] [P] 檢查並補齊 `src-tauri/tauri.conf.json` 的 Windows installer 策略：確認 `targets`、WebView2 安裝模式、Windows icon 與 installer 輸出路徑，並在 SDD 記錄決策。
- [ ] 8.5 [Tool: codex] 在 UTM Windows VM 執行 `pnpm install`、`pnpm type-check`、`pnpm test`、`pnpm tauri build`，記錄 `.msi` 或 `*-setup.exe` 輸出路徑與錯誤。
- [ ] 8.6 [Tool: codex] 在 UTM Windows VM 安裝 Windows 版 AIRE，驗證啟動、授權、建立案件、拉謄本、謄本預覽、另存謄本、重開資料仍存在。
- [ ] 8.7 [Tool: codex] 在 UTM Windows VM 驗證 PDF：預覽與下載內容一致、Noto Sans TC 不亂碼、無 `待補` / `未填`、無不必要頁碼、圖片與生活機能排版不跑版。
- [x] 8.8 [Tool: codex] 若 UTM 或 CI 不可用，且使用者同意安裝全域 build 工具，再嘗試 macOS 交叉編譯 Windows NSIS：已安裝 `makensis`、`rustup`、`cargo-xwin`，並以 `pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --no-sign` 產出 `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`；產物仍必須回到 Windows VM 安裝驗收。
