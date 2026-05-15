## Why

`aire-land-registry-foundation`（#2a）只建好「客戶端 SDK 地基」（client / cache / errors / batch / field_mapping / billing_log / time_sync / disk_resilience / migration_rollback / opcos_offline_grace / sqlite_encryption），但**還沒接任何具體業務 API endpoint**，也**沒有客戶端任何 UI 配套**（API key 設定、餘額顯示、屋主授權勾選、二次確認）。#2b 在 #2a 地基上補完 8 支業務 API + 客戶端設定 UI + 屋主授權法規合規 UX，讓客戶實際能輸入地號拉到謄本資料、填進不動產說明書。

## What Changes

- 新增 `address_to_parcel` API endpoint（地址 → 地號 / 建號）
- 新增 7 支 `parcel_data` API endpoints（建物登記 / 土地登記 / 共有人 / 地價 / 抵押權 / 建物權狀 / 都市計畫使用分區）
- 新增客戶端 API key 設定頁（仲介自己輸入內政部協作平台 client_id / client_secret，加密存 OS keychain）
- 新增餘額查詢與顯示元件（即時顯示當月剩餘 query 數 + 已花費金額，避免客戶超支）
- 新增手填 fallback UI（API 拉不到時客戶可手動填入，PDF 標示「手動填寫」）
- 新增屋主授權勾選 UI（每次拉謄本前強制勾選「客戶已書面授權」確認框，符合個資法）
- 新增二次確認對話框（拉謄本扣款前再次確認「本次預計扣 NT$N，確定要拉嗎？」）
- 修改既有 `disclosure-form-residential`、`disclosure-form-land`、`case-management` 三個 capability 整合新按鈕與流程

## Non-Goals

- API key 自動採購 / OPCOS 代購（仲介自己去協作平台註冊）
- 多家仲介共享 API quota（單帳號設計）
- 批次拉同社區多棟建物（Phase 2 評估）
- 客戶端管理員後台（後台留給 OPCOS）
- 即時通知客戶餘額不足（先在 UI 顯示即可，推播 Phase 2）
- 屋主授權書數位簽章（先勾選 + 紀錄時戳即可，數位簽章 Phase 3）
- 二次確認加風險評分（高金額顯示警示 Phase 2）

## Capabilities

### New Capabilities

- `land-registry-address-lookup`: address_to_parcel API 客戶端 + 地址正規化 + 多筆結果處理
- `land-registry-parcel-apis`: 7 支 parcel_data endpoint 客戶端 + 各自欄位 mapping
- `land-registry-api-key-settings`: API key 設定頁 + OS keychain 加密儲存 + 連線測試
- `land-registry-balance-monitor`: 餘額即時顯示 + 低餘額警告 + 已花費 ledger
- `land-registry-manual-fallback`: 手填 UI + PDF「手動填寫」標示
- `owner-authorization-consent`: 屋主授權勾選 UI + 強制性 + 時戳紀錄
- `pre-charge-confirmation`: 扣款前二次確認 + 顯示預計金額

### Modified Capabilities

- `disclosure-form-residential`: 整合「拉謄本」按鈕、屋主授權勾選、手填 fallback
- `disclosure-form-land`: 同上
- `case-management`: 案件詳情頁顯示謄本資料拉取狀態、餘額警告 banner

## Impact

- Affected specs:
  - New: `land-registry-address-lookup`, `land-registry-parcel-apis`, `land-registry-api-key-settings`, `land-registry-balance-monitor`, `land-registry-manual-fallback`, `owner-authorization-consent`, `pre-charge-confirmation`
  - Modified: `disclosure-form-residential`, `disclosure-form-land`, `case-management`
- Affected code:
  - New:
    - `src-tauri/src/land_registry/apis/address_to_parcel.rs`
    - `src-tauri/src/land_registry/apis/building_registry.rs`
    - `src-tauri/src/land_registry/apis/land_registry.rs`
    - `src-tauri/src/land_registry/apis/co_owners.rs`
    - `src-tauri/src/land_registry/apis/land_value.rs`
    - `src-tauri/src/land_registry/apis/mortgages.rs`
    - `src-tauri/src/land_registry/apis/building_ownership.rs`
    - `src-tauri/src/land_registry/apis/zoning.rs`
    - `src-tauri/src/land_registry/api_key_storage.rs`（OS keychain wrapper）
    - `src-tauri/src/land_registry/balance.rs`（餘額查詢 + 警告）
    - `src/components/ApiKeySettings.tsx`
    - `src/components/BalanceMonitor.tsx`
    - `src/components/BalanceBanner.tsx`
    - `src/components/OwnerAuthorizationDialog.tsx`
    - `src/components/PreChargeConfirmDialog.tsx`
    - `src/components/ManualFallbackInput.tsx`
    - `src/components/PullParcelDataButton.tsx`
    - `src/lib/land-registry-api.ts`（前端 IPC wrapper）
    - `docs/customer-api-key-setup-guide.md`
  - Modified:
    - `src/components/disclosure-form-residential.tsx`
    - `src/components/disclosure-form-land.tsx`
    - `src/app/(dashboard)/cases/[id]/page.tsx`
    - `src/app/(dashboard)/settings/api-key/page.tsx`（新路由）
    - `src-tauri/src/main.rs`（註冊新 IPC commands）
- Dependencies 新增（Cargo）：
  - 無新增（reqwest / keyring 已有）
- 環境變數新增：
  - `LAND_REGISTRY_RATE_LIMIT_PER_MINUTE`（**Open Question 待 Fish 補**，協作平台規範未拿到，預設 60）
  - `LAND_REGISTRY_BALANCE_ENDPOINT`（**Open Question 待 Fish 補**，協作平台規範未拿到，預設 `${LAND_REGISTRY_API_BASE_URL}/account/balance`）
- Open Questions（合規 / 規格未到）：
  - 協作平台官方 rate limit 數值（每分鐘 / 每天 / 每月）— Fish 登入確認後 ingest 更新
  - 餘額查詢 endpoint 路徑與回應格式 — Fish 登入確認後 ingest 更新
  - 各 endpoint 計費單價（部分 endpoint 收費、部分免費）— Fish 確認後寫進 spec
