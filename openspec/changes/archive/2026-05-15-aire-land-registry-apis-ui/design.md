## Context

AIRE 桌面 App（Tauri 2.x + Next.js 16 + React 19）的核心功能是產出不動產說明書。`aire-land-registry-foundation` 已建好 SDK 地基（HTTP client、cache、errors、field-mapping、billing-log、batch、time-sync、disk-resilience、migration-rollback、opcos-offline-grace、sqlite-encryption），但尚未接任何具體業務 API endpoint，也沒有對應的 UI。

本 change 在 foundation 之上補完：
- 8 支業務 API endpoint 客戶端（address_to_parcel + 7 支 parcel_data）
- 前端設定頁（API key 輸入 + 連線測試）
- 餘額監控 UI（當月用量 + 低餘額警告）
- 屋主授權勾選 UI（個資法合規）
- 扣款前二次確認對話框
- 手填 fallback UI（API 不可用時）
- 整合進既有案件管理 + 不動產說明書表單

環境：sandbox credentials 已在 .env（CLIENT_ID, CLIENT_SECRET, BASE_URL, TOKEN_ENDPOINT）。

## Goals / Non-Goals

**Goals:**
- 8 支業務 API 全部可用，sandbox 環境可端到端測試
- 仲介可在設定頁輸入 API key + 測試連線
- 案件頁面可「拉謄本」，拉取前強制屋主授權勾選 + 扣款確認
- API 失敗時可手填，PDF 標示「手動填寫」
- 餘額即時顯示，低餘額（< 10 次）警告

**Non-Goals:**
- API key 自動採購 / OPCOS 代購
- 多帳號共享 quota
- 批次拉同社區多棟（Phase 2）
- 屋主授權書數位簽章（Phase 3）
- 即時推播餘額不足（Phase 2）

## Decisions

### D1: API endpoint 實作架構 — 每支 API 獨立 module + 共用 trait

每支業務 API（address_to_parcel、building_registry 等）獨立一個 .rs 檔在 `src-tauri/src/land_registry/apis/`，都 impl 共用的 `LandRegistryEndpoint` trait（定義 `fn endpoint_path()`, `fn parse_response()`, `fn field_mappings()`）。

**被否決**：單一大 match 分支處理所有 API → 難測試、難擴展。

**步驟**：定義 trait → 逐支實作 → 在 main.rs 註冊 IPC commands。

### D2: API key 儲存 — OS keychain（keyring crate，foundation 已有）

用 foundation 已建好的 keyring wrapper，key = `aire-land-registry-api-key`，value = JSON `{client_id, client_secret}`。前端透過 IPC `set_api_key` / `get_api_key` / `test_api_connection` 操作。

**被否決**：存 .env 或 localStorage → 不安全，桌面 App 應用 OS keychain。

### D3: 餘額監控 — 本地 billing_log 聚合 + 可選遠端查詢

先從 foundation 的 billing_log table 聚合當月已花費。若協作平台有餘額 API（Open Question），補充遠端查詢。MVP 先用本地聚合。

**被否決**：只靠遠端 API → 離線不可用。

### D4: 屋主授權 — 前端強制 checkbox + 後端時戳紀錄

每次拉謄本前，前端 OwnerAuthorizationDialog 強制勾選「客戶已書面授權查詢不動產資料」。勾選後寫入 `owner_consent_log` table（case_id, timestamp, user_email）。未勾選 → IPC command 拒絕執行。

### D5: 二次確認 — PreChargeConfirmDialog

顯示「本次預計查詢 N 支 API，預估費用 NT$X，確定要拉嗎？」。確認後才發 IPC。

### D6: 手填 fallback — ManualFallbackInput 元件

API 回 error 時（或用戶主動選擇），顯示手動輸入表單。手填的資料在 PDF 標示「手動填寫（非系統查詢）」。資料結構與 API 回傳相同，只多一個 `source: "manual" | "api"` 欄位。

### D7: 前端 IPC wrapper — src/lib/land-registry-api.ts

統一的 TypeScript wrapper，封裝所有 Tauri IPC calls（`invoke('land_registry_address_lookup', {...})`），處理 error mapping 到 UI 友善訊息。Mock backend 同步擴充對應 commands。

### D8: UI/UX 統一 — 與 OPCOS 共用視覺 token

遵循既有 design system：lucide-react icons、Noto Sans TC + Inter 字型、shadcn/ui 元件。新元件（BalanceMonitor、OwnerAuthorizationDialog 等）使用既有 Card / Dialog / Button 元件組合，不引入新 UI 框架。

## Implementation Contract

### Observable Behavior

1. 設定頁輸入 API key → 點「測試連線」→ 顯示成功/失敗
2. 案件頁點「拉謄本」→ 屋主授權 checkbox → 二次確認金額 → 開始拉取 → 結果填入表單
3. 拉取失敗 → 顯示手填 UI → 手填資料可存入案件
4. 餘額顯示在設定頁 + 案件頁 banner（低於 10 次顯示警告）
5. 所有 API call 記入 billing_log

### Interface / Data Shape

**Rust IPC commands（新增）：**
- `land_registry_address_lookup(address: String) -> Vec<ParcelInfo>`
- `land_registry_pull_data(parcel_id: String, api_ids: Vec<String>) -> PullResult`
- `land_registry_set_api_key(client_id: String, client_secret: String) -> Result<()>`
- `land_registry_get_api_key() -> Option<ApiKeyInfo>`
- `land_registry_test_connection() -> ConnectionTestResult`
- `land_registry_get_balance() -> BalanceInfo`
- `land_registry_record_consent(case_id: String) -> Result<()>`

**TypeScript types（新增）：**
- `ParcelInfo { parcel_id, address, lot_number, building_number }`
- `PullResult { results: Map<string, ApiResult>, total_cost }`
- `BalanceInfo { month_total_cost, month_query_count, low_balance_warning }`

### Failure Modes

- API key 未設定 → IPC 回 `ApiKeyNotConfigured` error，前端導向設定頁
- Token 過期 → foundation client 自動 refresh，refresh 失敗 → `AuthenticationFailed`
- 餘額不足 → `InsufficientBalance`，前端顯示提醒
- 網路斷線 → cache hit 回快取資料（標示 cached），cache miss → 手填 fallback
- 屋主授權未勾選 → IPC 拒絕，回 `ConsentRequired`

### Acceptance Criteria

- sandbox 環境 address_to_parcel 可查到結果
- 7 支 parcel_data API 各自有 integration test（wiremock）
- API key 存取走 OS keychain，明碼不落 disk
- billing_log 每筆 API call 都有紀錄
- 未授權 → 拒絕拉取（test 驗證）
- 手填資料 PDF 標示正確（test 驗證）
- mock backend 擴充所有新 IPC commands

### Scope Boundaries

**In scope：**
- `src-tauri/src/land_registry/apis/` 全部新檔
- `src-tauri/src/land_registry/api_key_storage.rs`
- `src-tauri/src/land_registry/balance.rs`
- `src/components/` 新增元件（ApiKeySettings、BalanceMonitor、OwnerAuthorizationDialog、PreChargeConfirmDialog、ManualFallbackInput、PullParcelDataButton）
- `src/lib/land-registry-api.ts`
- `src/lib/mock-backend.ts`（擴充）
- `src-tauri/src/main.rs`（註冊新 commands）

**Out of scope：**
- crypto/、db/ 模組（除 migration 新增 table）
- PDF 渲染引擎本身
- OPCOS 平台 / 雲端服務
- 主密碼 / 救援碼
