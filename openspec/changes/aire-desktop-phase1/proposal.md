## Why

不動產仲介製作說明書要花助理 2-3 小時，且過程含屋主個資（謄本、稅費、權狀），傳統做法靠人工抄寫易出錯、外洩風險高。AIRE 桌面 App 將輸入地號 → 拉地政 API → 補填現況 → 產出 PDF 自動化，且資料全留本機保護隱私。**Phase 1** 目的：讓 Fish 到客戶現場安裝後，助理能完成一張成屋或土地說明書並輸出可印 PDF（明文版），先驗證流程跑得通再加安全層。

## What Changes

- 新增 Tauri 2.x + Next.js 16 桌面 App 骨架（src/ + src-tauri/），打包目標 Windows .msi 與 macOS .dmg
- 新增 SQLite 資料庫初始化與 schema migrations（cases 表、disclosure_drafts 表、settings 表）
- 新增啟動時序號驗證流程：呼叫 OPCOS 平台 POST /api/license/verify、POST /api/license/activate；驗證失敗顯示啟用畫面
- 新增本機 API Key 安全儲存（OS keychain 或 Tauri stronghold），客戶輸入後加密保存
- 新增案件 CRUD UI：列表頁、新增頁、編輯頁，欄位含地號、地址、客戶資訊、物件類型（成屋/土地）
- 新增說明書欄位表單（兩種模板）：成屋版欄位（建物標示、土地標示、稅費、現況勾選結果）；土地版欄位（土地標示、稅費、現況勾選結果）
- 新增 PDF 產出器：用既有 19 頁底板（resources/templates/）渲染欄位 → 輸出本機 .pdf 檔（**Phase 1 為明文 PDF，加密留 Phase 2**）
- 新增繁體中文 UI（所有頁面、表單、錯誤訊息）
- 新增基本日誌（操作紀錄寫到本機 logs/aire.log，含時間、序號、動作）

## Non-Goals

- IP 鎖定（Phase 2 處理；Phase 1 連網僅檢查序號）
- PDF 加密與密碼保護（Phase 2 處理；Phase 1 輸出明文 PDF）
- 地政 API 串接（Phase 3 處理；Phase 1 所有欄位由助理手動輸入）
- 角色權限分層（Phase 2 處理；Phase 1 單一使用者）
- 自動更新機制（Phase 4 處理；Phase 1 手動重新安裝）
- 現況調查表紙本列印（Phase 3 處理；Phase 1 助理直接在表單勾選）
- 多裝置授權管理（在 OPCOS 平台 opcos-platform-phase1 處理，AIRE 只消費 API）
- 線上付費購買（OPCOS 平台未開放購買入口，前期 Fish 現場安裝）
- LLM 整合（保留端口未來加值用，Phase 1 不含）
- Linux 平台支援（僅 Windows + macOS）

## Capabilities

### New Capabilities

- `desktop-shell`: Tauri 2.x 殼架構、Next.js 整合、視窗管理、首次啟動流程、打包設定
- `local-database`: SQLite 初始化、migrations、cases / disclosure_drafts / settings 表結構與 CRUD repository
- `license-activation`: 啟動時序號驗證、呼叫 OPCOS API、本機儲存授權狀態、啟用畫面 UI
- `secure-credential-storage`: API Key 與授權 token 的 OS keychain / stronghold 加密儲存
- `disclosure-form-residential`: 成屋說明書表單欄位、驗證、儲存草稿、提交流程
- `disclosure-form-land`: 土地說明書表單欄位、驗證、儲存草稿、提交流程
- `disclosure-pdf-render`: 套用 19 頁底板渲染表單資料、輸出明文 PDF 到本機檔案
- `case-management`: 案件列表 / 新增 / 編輯 / 刪除 / 切換物件類型 UI
- `operation-log`: 本機操作日誌（時間、序號、動作、結果）寫入 logs/aire.log
- `ui-design-system`: 與 OPCOS 共用設計 token（顏色、字型、Tailwind 設定、icon 風格），桌面 App 自寫元件但視覺一致
- `ux-interaction-patterns`: 與 OPCOS 共用互動模式（草稿自動儲存策略、錯誤訊息語氣、loading/empty/error 三態 UI、確認對話框觸發條件、Toast 行為、鍵盤快捷鍵）

### Modified Capabilities

(none — AIRE 桌面 App 為全新架構，與現有 specs/ 目錄下舊顧問案規格無重用關係)

## Impact

- Affected specs: 11 個新 capabilities（見上）
- Affected code:
  - New: src-tauri/Cargo.toml、src-tauri/tauri.conf.json、src-tauri/src/main.rs、src-tauri/src/commands/mod.rs、src-tauri/src/commands/license.rs、src-tauri/src/commands/cases.rs、src-tauri/src/commands/pdf.rs、src-tauri/src/db/mod.rs、src-tauri/src/db/migrations.rs、src-tauri/src/secrets.rs、src-tauri/migrations/001_initial.sql、src/app/layout.tsx、src/app/page.tsx、src/app/cases/page.tsx、src/app/cases/new/page.tsx、src/app/cases/[id]/page.tsx、src/app/activation/page.tsx、src/components/disclosure-form-residential.tsx、src/components/disclosure-form-land.tsx、src/components/case-list.tsx、src/lib/ipc.ts、src/lib/types.ts、resources/templates/residential.pdf、resources/templates/land.pdf、package.json、next.config.ts、tsconfig.json
  - Modified: AIRE 為全新 Tauri 架構，現有 products/AIRE/ 下舊 Next.js Web 版檔案標記為 deprecated，不在 Phase 1 修改範圍
  - Removed: (none — 舊檔案不刪，保留作參考)
- Dependencies 新增:
  - 前端: next@16、react@19、typescript、@tauri-apps/api、tailwindcss、zod（表單驗證）、pdf-lib（PDF 產生）、lucide-react（icon）
  - Rust 端: tauri@2、tauri-plugin-sql、rusqlite、serde、tokio、reqwest、keyring 或 tauri-plugin-stronghold
- 環境變數新增:
  - OPCOS_API_BASE_URL（指向 OPCOS 雲端，預設 https://opcos.example.com）
  - 客戶 API Key 不走 env，存 OS keychain
