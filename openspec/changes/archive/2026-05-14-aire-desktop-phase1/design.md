## Context

AIRE Phase 1 是 OPCOS 平台底下首個 App，採用 Tauri 桌面架構而非 Web SaaS，主要驅動因素是不動產說明書內含屋主個資（謄本、地號、稅費），雲端集中儲存有外洩風險與法遵壓力。Tauri 提供 5-15MB 安裝檔與跨平台原生打包能力，相較 Electron 體積小一個量級，符合「現場安裝、單機運作」場景。

現況：products/AIRE/ 下既有 Next.js Web 顧問案實作累積大量 specs/，但屬另一條技術路線。Phase 1 從 Tauri 殼從頭建構，舊檔案保留作參考但不沿用。OPCOS 雲端平台已於 opcos-platform-phase1 規劃序號發放與裝置綁定 API。

限制：
- 目標客戶以 Windows 機台為主（macOS 為輔）；Linux 不支援
- Phase 1 需在 Fish 到客戶現場安裝場景下能跑：開機 → 啟用序號 → 開一張說明書 → 輸出 PDF
- PDF 必須與既有 19 頁底板（資料夾 不動產說明書/）排版一致，避免客戶嫌「跟原本格式不一樣」
- 表單欄位多（成屋約 80 欄、土地約 60 欄），UX 必須支援草稿自動儲存避免助理輸入到一半當機損失

## Goals / Non-Goals

**Goals:**

- 跑得通的最小桌面 App：安裝 → 啟用 → 建案 → 輸入 → 輸出 PDF
- SQLite schema 可演進（後續 phase 加欄位用 ALTER TABLE，不破壞舊資料）
- 序號驗證流程清楚且容錯（網路斷線時的行為明確）
- PDF 輸出排版與既有 19 頁底板一致（先用 pdf-lib 疊欄位到底板 PDF）
- Windows 與 macOS 雙平台打包腳本可在 GitHub Actions 跑

**Non-Goals:**

- IP 鎖定、PDF 加密、地政 API 串接（後續 phase）
- 多使用者角色、多裝置同步（後續 phase / OPCOS 平台）
- 進階表單 UX（如自動填入相似案件資料、聯想欄位）
- 國際化（i18n）— Phase 1 寫死繁中
- 整合測試自動跑 PDF 視覺對比（手動驗收即可）

## Decisions

### D1：Tauri + Next.js 整合方式 — Static Export 模式

Phase 1 採用 Tauri 的 frontendDist 指向 Next.js static export（out/ 目錄）模式，原因：

- Next.js App Router 在 Tauri 內跑 server 模式需另開 sidecar 進程，複雜度高
- Phase 1 不需要 SSR / API routes（後端邏輯走 Tauri IPC → Rust）
- static export 打包後即一組 HTML + JS，Tauri WebView 載入無延遲

設定要點：
- next.config.ts 設 output: 'export'、images.unoptimized: true
- 不使用 Next.js 的 API routes，所有後端呼叫走 Tauri invoke()
- 不使用 next/image 的優化（static export 不支援動態優化）

**被否決方案：**

- **Electron + Vite + React**：安裝檔 150MB+ 過大，違反 Phase 1「小巧現場安裝」目標
- **Tauri + Next.js server 模式**：需 sidecar，啟動延遲且打包步驟複雜
- **純 React + Vite（無 Next.js）**：放棄 Next.js 的路由與 layout 系統，UI 開發成本變高

### D2：SQLite Schema 與 Migration 策略

採用 rusqlite + tauri-plugin-sql，DB 檔案存於 OS 標準資料夾（macOS: ~/Library/Application Support/aire/aire.db；Windows: %APPDATA%/aire/aire.db）。

Migration 策略：純檔案式 SQL（src-tauri/migrations/001_initial.sql、002_*.sql），啟動時讀 user_version pragma，按序套用。Phase 1 只有 001_initial.sql。

```sql
-- 001_initial.sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,              -- UUID v4
  case_no TEXT,                     -- 案件編號（助理自填）
  property_type TEXT NOT NULL CHECK(property_type IN ('residential','land')),
  land_lot_no TEXT NOT NULL,        -- 地號
  address TEXT NOT NULL,            -- 地址
  owner_name TEXT,                  -- 屋主姓名
  status TEXT NOT NULL CHECK(status IN ('draft','completed','exported')) DEFAULT 'draft',
  created_at INTEGER NOT NULL,      -- Unix timestamp (秒)
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_cases_updated_at ON cases(updated_at DESC);

CREATE TABLE disclosure_drafts (
  case_id TEXT PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
  payload_json TEXT NOT NULL,       -- 表單欄位序列化（依 property_type 不同 schema）
  schema_version INTEGER NOT NULL DEFAULT 1,
  saved_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
-- 預期 settings keys: license_status, license_key, license_verified_at, company_name, company_address, company_phone

CREATE TABLE operation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  action TEXT NOT NULL,             -- 'license_verify','case_create','pdf_export', ...
  payload TEXT,                     -- JSON 附加資訊
  result TEXT NOT NULL CHECK(result IN ('ok','error'))
);
CREATE INDEX idx_op_log_ts ON operation_log(ts DESC);

PRAGMA user_version = 1;
```

時區一律 Asia/Taipei；資料庫存 Unix timestamp（秒），顯示時前端轉換。

**被否決方案：**

- **Prisma 或 Drizzle ORM**：增加 JS 端 ORM 依賴，且需 build step，與 Tauri Rust 邏輯隔閡
- **單一 JSON 檔儲存所有資料**：欄位查詢、排序需手寫，案件變多後效能差
- **加密 SQLite（SQLCipher）**：Phase 1 不上加密層，留 Phase 2

### D3：序號驗證流程與離線容錯

啟動序列：

```
App 啟動
  ├─ 讀 settings.license_status
  ├─ 若 = 'activated'
  │    ├─ 讀 settings.license_verified_at
  │    ├─ 若距離現在 < 7 天 → 直接進入主畫面（離線寬限）
  │    └─ 否則嘗試呼叫 OPCOS POST /api/license/verify
  │         ├─ 成功 → 更新 license_verified_at，進主畫面
  │         ├─ 失敗（網路斷）→ 仍進主畫面（離線寬限期內，最長 30 天）
  │         └─ 失敗（401/403 序號失效）→ 跳到啟用畫面
  └─ 若 ≠ 'activated' → 跳到啟用畫面

啟用畫面流程：
  助理輸入序號
    → 呼叫 OPCOS POST /api/license/activate { license_key, device_id }
    → device_id = 本機產生 UUID v4（首次啟動產生，存 settings.device_id）
    → 成功（200 + 授權資料）：寫入 settings、進主畫面
    → 失敗（已綁定其他裝置 / 序號無效 / 額度滿）：顯示對應錯誤訊息
```

離線寬限規則：
- 已啟用後，連續 30 天沒成功 verify → 鎖定，要求重新驗證
- < 7 天不重試（減少網路請求）；7-30 天每次啟動嘗試一次

**被否決方案：**

- **嚴格線上模式**（每次啟動都必須 verify 成功）：客戶網路不穩會無法工作，現場使用體驗差
- **首次啟用後永久離線**：序號被外洩無法遠端撤銷，與「IP 鎖定」目標衝突
- **JWT 自驗證**（不打 API）：Token 過期或失效時無法即時生效

### D4：API Key 與 Token 的本機安全儲存

採用 OS 原生 keychain（macOS Keychain Services / Windows Credential Manager），由 Rust 端 keyring crate 統一封裝。儲存項目：

- AIRE 授權序號 license_key
- AIRE 授權 token（OPCOS 回傳的 JWT，用於後續 verify 呼叫）
- 客戶地政 API Key（Phase 1 預留欄位，Phase 3 使用）

不使用 Tauri stronghold plugin（Phase 1 簡化依賴），改用 keyring 直連 OS。

**被否決方案：**

- **存明文於 settings 表**：DB 檔被複製即外洩
- **AES 加密存 SQLite**：金鑰要存哪？仍回到「金鑰存哪」的相同問題
- **Tauri stronghold**：Phase 1 不需要 mnemonic 與分層儲存能力，過度設計

### D5：PDF 產出器選型 — pdf-lib + 既有底板疊圖

選用 JS 端 pdf-lib，原因：

- 既有 19 頁不動產說明書底板（PDF 格式）已存在於 不動產說明書/ 目錄，需在底板上疊文字而非從零排版
- pdf-lib 支援 loadPDF + drawText，輕量無 Chromium 依賴
- 渲染邏輯在前端跑（不需 Tauri IPC 來回），可在輸出前用 Canvas 預覽

設定要點：
- 底板複製到 src/resources/templates/residential.pdf 與 land.pdf
- 用 fontkit + 內嵌繁中字型（思源黑體 Noto Sans TC 子集，~2MB）
- 欄位座標寫死於 src/lib/pdf-layout.ts（residential 與 land 各一份座標表）

**被否決方案：**

- **react-pdf**：適合從零排版，但已有現成底板的場景，疊圖更省事
- **Puppeteer / headless Chromium**：依賴 Chromium binary（150MB+），違反小安裝檔目標
- **wkhtmltopdf**：CLI 工具，需外部 binary，跨平台打包麻煩
- **Rust 端的 printpdf**：繁中字型支援差，需手刻 CJK shape

### D6：表單草稿自動儲存

成屋表單約 80 欄、土地約 60 欄，助理輸入過程當機或誤關視窗會損失資料。Phase 1 用 debounce 自動儲存策略：

- 表單欄位改動 → 1 秒 debounce → 呼叫 Tauri IPC save_draft → UPSERT 到 disclosure_drafts 表
- 視窗關閉時強制 flush 一次
- 開啟既有案件時讀 disclosure_drafts.payload_json 還原欄位

payload_json 結構依 property_type 不同：
- residential：依 product/AIRE/docs/extracted-dossier-schema.md 的成屋欄位（建物標示、土地標示、稅費、現況勾選結果）
- land：土地版欄位（土地標示、稅費、現況勾選結果）

schema_version 預留欄位，後續 phase 加欄位時用此判斷是否需 migrate payload。

### D7：UI 設計系統 — 與 OPCOS 共用視覺 token

AIRE 桌面 App 與 OPCOS 雲端網頁需呈現「同一家公司產品」的一致觀感（顏色、字型、按鈕樣式、icon 風格），但兩邊架構不同（桌面 vs 網頁、欄位完全不同），不能共用元件程式碼。採用「共用設計 token、各自實作元件」策略。

**共用範圍（一致）：**

- 顏色 palette（主色、次色、灰階、語意色 success/warning/error）
- 字型（繁中：Noto Sans TC；英數：Inter；等寬：JetBrains Mono）
- Tailwind 設定（spacing scale、border radius、shadow、breakpoint）
- icon 風格（統一用 Lucide React，禁用 emoji 與多套 icon 混用）
- 按鈕、表單欄位、卡片等 atomic 元件的 padding / radius / hover 樣式規則

**不共用（各自實作）：**

- 具體 React 元件（OPCOS 用 Supastarter 原生元件、AIRE 自己寫桌面用的元件）
- 頁面結構與資訊架構（兩邊用戶情境不同）
- 響應式 breakpoint 行為（OPCOS 要 RWD、AIRE 桌面固定最小 1280x800）

**實作步驟：**

1. 從 OPCOS Phase 1 完工後的 `apps/saas/tailwind.config.ts` 抽出 `theme.extend` 區塊 — 含 colors、fontFamily、borderRadius、boxShadow
2. 寫成獨立檔 `src/styles/design-tokens.json`（純資料、無 JS code）放於 AIRE 專案
3. AIRE 的 `tailwind.config.ts` 載入該 JSON，套入 `theme.extend`
4. AIRE 自寫元件（按鈕、輸入框、卡片）時用相同 Tailwind class 名（如 `bg-primary text-primary-foreground rounded-md px-4 py-2`）
5. 視覺對齊驗收：拿 OPCOS 與 AIRE 截圖並排，主色、按鈕高度、圓角應視覺一致

**被否決方案：**

- **完全共用 React 元件庫（monorepo）**：AIRE 是 Tauri 桌面、OPCOS 是 Next.js SaaS 雲端，分屬不同 repo，做 monorepo 須整合 Supastarter 內部結構，工程量大
- **AIRE 自由設計、不對齊 OPCOS**：兩邊風格不一，客戶不會把它們視為同家公司產品，傷品牌
- **共用 Tailwind config 檔（symlink）**：兩個 repo 共用檔案需設 git submodule 或 monorepo，前期不必要的耦合

### D8：UX 互動模式 — 與 OPCOS 共用行為規則

UI 視覺一致只是表面，操作行為一致才是讓使用者「真的覺得是同家公司產品」的關鍵。AIRE 桌面 App 與 OPCOS 雲端網頁需共用一組互動 pattern：怎麼顯示載入中、空狀態長怎樣、什麼時候跳確認框、錯誤訊息怎麼寫、Toast 何時用、鍵盤快捷鍵綁哪些鍵。

**共用範圍（一致）：**

- 三態 UI（loading / empty / error）的視覺與文案模板
- 草稿自動儲存策略（1000ms debounce、右上角狀態指示器）
- 確認對話框觸發政策（僅針對不可逆 / 多筆影響 / 網路狀態變更）
- 錯誤訊息文案模板（不暴露 stack trace、不出現英文錯誤碼）
- Toast / 通知行為（成功 3 秒、警告 5 秒、嚴重錯誤不用 toast）
- 鍵盤快捷鍵約定（Cmd/Ctrl+N 新增、Cmd/Ctrl+S 強制儲存、Esc 關閉 modal）

**不共用（場景差異）：**

- 具體頁面流程（OPCOS 是 dashboard、AIRE 是案件管理）
- 桌面 App 特有的視窗行為（onCloseRequested、托盤）
- 雲端 SaaS 特有的多人 / 即時行為（不適用桌面 App）

**實作步驟：**

1. 寫一份 `docs/ux-patterns.md`（繁中），列出 6 大類 pattern 的規則與範例（三態 UI 模板、autosave 行為、confirmation 觸發表、error message 模板、toast policy、shortcut table）
2. 該文件 OPCOS 與 AIRE 兩邊都引用（OPCOS 寫類似版本後可比對合併）
3. AIRE 寫 atomic 元件（LoadingState、EmptyState、ErrorState、ConfirmDialog、Toast 容器）時嚴格遵循 patterns 文件
4. UX 互動驗收：依 patterns 文件做 e2e 互動 checklist（人工或 Playwright），逐項打勾

**被否決方案：**

- **不寫 UX patterns 文件、靠 code review 把關**：規則隱於程式碼，新元件容易偏離；多人協作會散
- **直接套 shadcn/ui 或 Radix 預設行為**：行為偏向通用 SaaS，與台灣不動產仲介場景（年長使用者、輸入習慣）不完全契合
- **OPCOS 與 AIRE 各自定義**：兩邊不一致，違反「同一公司產品」品牌目標

## Implementation Contract

### Behavior（使用者觀察到的行為）

- **首次安裝啟動**：顯示啟用畫面，輸入序號 → 成功啟用後進入主畫面（案件列表，空清單）
- **已啟用啟動**：直接進入主畫面，顯示案件列表（依 updated_at 倒序）
- **新增案件**：選擇物件類型（成屋/土地）→ 輸入地號 + 地址 + 屋主姓名 → 進入對應表單頁面
- **表單填寫**：欄位修改 1 秒後自動存草稿，介面右上角顯示「已儲存」狀態
- **匯出 PDF**：點「匯出」→ 選輸出目錄 → 系統產出 .pdf 並開啟所在資料夾
- **離線啟動**：已啟用 < 7 天 → 不打 API 直接進主畫面；7-30 天 → 嘗試 verify，失敗仍可用；> 30 天 → 強制重驗
- **序號被遠端撤銷**：下次 verify 收 401/403 → 跳啟用畫面，本機資料保留

### Interface / Data Shape

**Tauri IPC commands**（src-tauri/src/commands/）：

```
license:
  verify_license() -> Result<LicenseStatus, Error>
  activate_license(key: String) -> Result<LicenseStatus, Error>
  get_license_status() -> Result<LicenseStatus, Error>

cases:
  list_cases() -> Result<Vec<CaseSummary>, Error>
  get_case(id: String) -> Result<Case, Error>
  create_case(input: CreateCaseInput) -> Result<Case, Error>
  update_case(id: String, input: UpdateCaseInput) -> Result<Case, Error>
  delete_case(id: String) -> Result<(), Error>

drafts:
  save_draft(case_id: String, payload: serde_json::Value) -> Result<(), Error>
  load_draft(case_id: String) -> Result<Option<DraftData>, Error>

pdf:
  export_pdf(case_id: String, output_path: String) -> Result<String, Error>

settings:
  get_setting(key: String) -> Result<Option<String>, Error>
  set_setting(key: String, value: String) -> Result<(), Error>

log:
  write_log(action: String, payload: Option<String>, result: String) -> Result<(), Error>
```

**OPCOS API contracts**（Phase 1 消費）：

```
POST /api/license/verify
  Request: { license_key, device_id }
  Response 200: { status: 'active', valid_until, last_verified_at }
  Response 401/403: { error: 'invalid_license' | 'revoked' | 'device_mismatch' }

POST /api/license/activate
  Request: { license_key, device_id, device_name, os_version }
  Response 200: { status: 'active', token, valid_until }
  Response 409: { error: 'already_activated_other_device' }
  Response 422: { error: 'invalid_key' | 'quota_exhausted' }
```

**SQLite schema** — 見 D2 完整 DDL

**Draft payload JSON schema**：
- residential 範例鍵：`building_lot_no`, `floor_area`, `building_age`, `tax_land_value`, `condition_leakage`, `condition_renovation`, ...
- land 範例鍵：`land_lot_no`, `land_area`, `zoning_use`, `tax_land_value`, `condition_access`, `condition_boundary`, ...
- 完整欄位清單列於 src/lib/disclosure-schema.ts

### Failure Modes

- **OPCOS API 5xx / 網路斷**：在離線寬限期內 → 進入主畫面、operation_log 寫 result=error reason=network_failed；超過寬限 → 啟用畫面顯示「無法連線 OPCOS，請檢查網路」
- **序號驗證 401/403**：跳啟用畫面，顯示具體錯誤（撤銷 / 裝置不符 / 過期），本機 SQLite 資料不刪除
- **SQLite write failure**（磁碟滿）：UI 顯示「儲存失敗」紅色提示，當下不可繼續，operation_log 記下；草稿不寫入但前端 state 保留以便重試
- **PDF 匯出失敗**（檔案被佔用、字型載入失敗）：彈出錯誤訊息、operation_log 記下失敗原因，使用者可重試
- **OS keychain 寫入失敗**：啟用流程顯示「無法寫入系統憑證儲存區，請以管理員身份開啟」，不允許繼續

### Acceptance Criteria

- `pnpm tauri build` 在 macOS arm64 與 Windows x64 各產出可執行安裝檔（驗證方式：產物存在於 src-tauri/target/release/bundle/）
- 啟用流程：手動測試 — 全新安裝 → 輸入測試序號 → 進入主畫面（驗證方式：人工測試 + operation_log 表有 license_activate result=ok）
- 案件 CRUD：建立 1 件成屋 + 1 件土地，列表正確顯示、編輯後 updated_at 更新（驗證方式：SQL 查詢 cases 表 + UI 列表）
- 草稿自動儲存：填入欄位後關閉視窗、重開案件 → 欄位資料保留（驗證方式：人工測試 + 查詢 disclosure_drafts 表）
- PDF 輸出：成屋與土地各匯出 1 份，PDF 開啟後欄位位置與既有 19 頁底板對齊（驗證方式：人工視覺對照不動產說明書/ 目錄下的範本）
- 離線寬限：拔網路後啟動 → 仍可進主畫面（驗證方式：人工測試）
- 序號撤銷：在 OPCOS 後台撤銷序號 → 下次啟動跳啟用畫面（驗證方式：搭配 opcos-platform-phase1 完成後手動測試）

### Scope Boundaries

**In scope (Phase 1)：**

- Tauri 殼 + Next.js static export 整合
- SQLite schema 與 migrations
- 序號驗證（含離線寬限）
- 案件 CRUD UI
- 兩種說明書表單（成屋 + 土地）含草稿自動儲存
- pdf-lib 疊圖輸出明文 PDF
- 繁中 UI、繁中字型嵌入
- Windows + macOS 打包腳本

**Out of scope (Phase 1，留待後續 phase)：**

- IP 鎖定（Phase 2）
- PDF 加密與密碼保護（Phase 2）
- 角色權限（老闆/助理/業務員）（Phase 2）
- 地政 API 串接、自動填入謄本（Phase 3）
- 現況調查表紙本列印（Phase 3）
- 自動更新機制（Phase 4）
- Linux 平台
- 多裝置綁定 / 換機流程（在 OPCOS 平台）
- LLM 整合

## Risks / Trade-offs

- **[Risk] Next.js 16 + Tauri 2.x 整合相容性未驗證** → Mitigation：第一個 task 即建一個 Hello World 整合 spike，跑通 dev + build 才繼續其他 task；若失敗回退 Next.js 15 LTS
- **[Risk] pdf-lib 中文字型嵌入體積爆掉（思源黑體完整版 14MB）** → Mitigation：用子集化工具（fonttools subset）只保留說明書會用到的字（5000 字以內），目標壓到 2MB 以下；若仍失敗改用內建 PDF 字型（無法繁中）配合圖片化方案
- **[Risk] 既有 19 頁底板座標表手刻易錯** → Mitigation：每一頁分批視覺驗收，先做封面 + 第一頁找對座標，後續類比；建立 src/lib/pdf-layout.ts 集中管理，方便後續微調
- **[Risk] 表單欄位多（成屋 80 欄）UX 過長** → Mitigation：分 5-6 個 tab（標示 / 權利 / 稅費 / 現況 / 附件），每 tab 約 15 欄；Phase 1 不做進階搜尋與聯想，先求能輸入完整
- **[Risk] keyring crate 在某些 Windows 版本（如未啟用 Credential Manager 的精簡版）失敗** → Mitigation：偵測到失敗時 fallback 到本機加密檔（DPAPI on Windows / Keychain on macOS）；Phase 1 不全測，假定主流 Windows 10/11 與 macOS 13+ 有 keychain
- **[Trade-off] static export 模式無法用 Next.js API routes** → 接受，所有後端邏輯走 Tauri IPC，與本案目標一致（運算在本機）
- **[Trade-off] 離線寬限 30 天可能讓被撤銷的序號繼續用 30 天** → 接受，IP 鎖定（Phase 2）會補強這個缺口；Phase 1 客戶都是 Fish 手動安裝可信任
