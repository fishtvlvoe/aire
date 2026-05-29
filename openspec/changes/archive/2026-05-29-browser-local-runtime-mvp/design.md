# Design

## Decision 1: Browser Local Runtime first

MVP 不使用 Tauri/Rust，也不使用 Electron。Windows 安裝器安裝一個 launcher、官方 Node runtime、Next standalone server、必要 assets。launcher 啟動 `127.0.0.1` server 後開系統預設瀏覽器。

**Reason:** 這是最短路徑，可保留目前 Next Web UI 與 `/api/local/*` server route，並消除 Tauri IPC 分裂。

## Decision 2: 客戶不需要原始碼

安裝包只包含 production runtime 產物：

- `node.exe`
- Next standalone `server.js`
- `.next/static`
- `public`
- production `node_modules`
- AIRE launcher

不包含 repo、`src/`、`pnpm`、測試檔或開發設定。

## Decision 3: Local-only security boundary

runtime 只綁定 `127.0.0.1`，不使用 `0.0.0.0`，不接受 LAN 存取。後續實作必須加上本機 session token 或等效保護，避免其他本機網頁任意呼叫 AIRE API。

## Decision 4: 本機資料目錄為唯一客戶資料位置

Windows 預設使用 `%LOCALAPPDATA%\\AIRE\\`：

- SQLite DB
- COP API 設定/加密檔
- 上傳檔案
- PDF 輸出暫存與成品
- runtime logs

此 change 不把客戶案件資料上傳雲端。授權/更新可另走雲端，但不得混入案件資料。

## Decision 5: MVP 先以 Node 實作本機能力

原本在 Rust IPC 的必要能力，要搬到 Next/Node server route 或 Node service module。第一版只搬 MVP 必需項目：settings、COP credential save/test、address discovery、formal pull、case persistence、PDF/export 或 PDF check 所需資料產出。

## Decision 6: build 模式翻轉是先決架構里程碑（破壞性變更）

走本路線前，必須先把 Next build 從現況翻轉，這不是普通 task 而是架構里程碑：

- 現況（已核實）：`next.config.ts` production `output: "export"`（static export，給 Tauri `frontendDist` 用）；`/api/local/address-discovery`、`/api/local/formal-pull-data` 皆 `force-static` 且 production 主動回 `local_proxy_unavailable`。
- 翻轉後：production `output: "standalone"`，兩個 local route 改 `force-dynamic` 並移除 production guard。

**影響：** 翻轉後現有 Tauri production build 會失效。Fish 已決議走 A 方案——正式 park Tauri、不再維護 Tauri App build。`src-tauri/` 程式碼保留可恢復，但退出 production pipeline。

**連帶失效（park Tauri 的下游，必須一併搬遷）：**

- **Installer**：現況用 Tauri bundler 的 NSIS（`src-tauri/tauri.conf.json` `bundle.windows.nsis`）。park Tauri bundler 後失效，改用獨立 NSIS 腳本，見 Decision 8。
- **PDF 寫檔**：現況為前端 `pdf-lib` 渲染 → Rust `export_pdf` IPC 原子寫檔（`src-tauri/src/commands/pdf.rs`）。park Tauri 後 Rust command 消失，前端渲染保留、寫檔搬 Node，見 Decision 9。

**Reason:** static export 與 standalone server 是互斥的打包模式，同一 `next.config` 只能擇一。不先翻轉，Wave 2+ 的本機 API 與 launcher 在 packaged runtime 全部無法執行——這正是先前「本機 Web 找不到地段」「改 A 壞 B」的根因（API 在 production 被故意關閉走 IPC）。

## Decision 7: COP credential 在 Node 端的安全儲存

COP 帳密目前只存在 Rust OS keychain（`src-tauri/src/land_registry/api_key_storage.rs`，`keyring` crate 呼叫 Windows Credential Manager），Node 端無等效實作。MVP Node 方案二選一：

- **首選：Windows DPAPI** 加密後存 `%LOCALAPPDATA%\AIRE\cop-credential.enc`，綁定當前 Windows 使用者帳號，跨機無法解密。
- **備選：對稱加密 JSON**，金鑰由 launcher 每次啟動以本機熵生成 + 安全存放。

**禁止：** 明碼存 credential、把 credential 放進可被其他本機網頁讀取的位置（與 Decision 3 session token 一併防護）。

## Decision 8: Windows installer 採獨立 NSIS（非 Tauri bundler、非 WiX）

park Tauri（Decision 6）後不能再用 Tauri bundler 的 NSIS。MVP 改用**獨立 NSIS 腳本**打包 launcher + bundled Node runtime + Next standalone 產物。

**Reason:**

- 團隊既有路線就是 NSIS（先前透過 Tauri bundler），延續成本最低。
- NSIS 比 WiX 輕、學習曲線低，適合 MVP 單機安裝。
- WiX 產 MSI 適合企業 GPO 大量派送，本 MVP 不需要；若未來客戶有 MSI/GPO 需求再另評估。

**禁止：** 要求客戶自行安裝 Node——Node runtime 必須打包進 installer（與 Decision 2 一致）。

## Decision 9: PDF 完整搬 Node — 一份文件、兩階段產出

**業務模型（Fish 確認）：** 草稿與說明書是**同一份文件**，差別在產出時間點，不是兩套模板：

- **草稿**：第一次調閱便民系統（地政 API）查出的資料即時產出，業務帶去現場簽約。
- **說明書**：簽約回來後，業務手動把補件資料 key 進系統，在草稿基礎上延續產出（前面內容不變，往後加補件與客戶簽名頁）。

**技術決策：**

- 同一條 `pdf-lib` 前端渲染管線，吃不同階段的資料快照（草稿＝API 資料；說明書＝API 資料＋手動補件＋簽名頁），不寫兩套渲染邏輯。
- 前端渲染保留；Rust `export_pdf` 原子寫檔 → 由 Node route 取代，輸出到 `%LOCALAPPDATA%\AIRE\`（與 Decision 4 統一資料目錄一致）。
- 補件以嵌入頁面方式併入文件，非 popup（符合 AIRE 業務邏輯）。

**Reason:** PDF 是 MVP 交付物（Fish 拍板納入完整範圍）。把寫檔層從 Rust 搬 Node 是 park Tauri 的必然連帶，渲染層維持現狀可降低風險。

## Risks

- Next standalone + production node_modules 仍可能偏大，但比 Electron 少一整包 Chromium。
- Windows installer 與 launcher 需要真機/VM fullflow 驗收，不能只驗 build。
- **build 翻轉是破壞性變更（Decision 6）**：翻轉瞬間 Tauri build 失效，transition 期間兩種模式不可共存同一 config，需明確切換時機。
- **Decision 5 搬遷量被低估**：案件 CRUD 完全在 Rust SQLite（13 migration / ~2.6k 行 DB layer），Node 側目前零 SQLite。MVP 最小集（case CRUD + COP credential + session token）估 ~500-800 行 Node 新碼；切勿一次搬完整 58 個 IPC command。
- **COP credential 跨平台**：DPAPI 僅 Windows；若未來要 macOS 客戶，credential storage 需再抽象。
- **`land_registry_paid_address_resolver`**：前端有呼叫但 Rust 無對應 command，需先確認是 dead code 還是待實作（tasks 3.7）。
- **PDF 完整搬遷被低估**：Decision 9 雖維持 `pdf-lib` 渲染層，但兩階段資料快照（草稿 vs 說明書）、補件嵌入、簽名頁、Node 端原子寫檔取代 Rust `export_pdf`，都是新工作量。原 3.8「先決待界定」已關閉，但實作量隨完整範圍上升，Wave 3 任務數增加。
- **Installer 從 Tauri bundler 改獨立 NSIS（Decision 8）**：失去 Tauri 自動處理的 Node 打包/捷徑/uninstall，需在獨立 NSIS 腳本重建，且 launcher 與 bundled Node 的相對路徑要在 packaged 環境驗證。
