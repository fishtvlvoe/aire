## Why

目前 AIRE 桌面端已有本機授權啟用流程，OPCOS 主站也已有 AIRE license 與 upgrade request 的資料模型，但兩邊還沒有被定義成一條可驗收的正式流程。這會讓測試版看起來能用，實際上卻無法保證「主站發序號 → 使用者看到序號 → AIRE 啟用 → 方案同步」真的完成。

## What Changes

- 新增 OPCOS 與 AIRE 的授權序號串接契約，明確規定 OPCOS 是唯一正式序號來源。
- 新增 AIRE 設定頁與啟用流程的同步規則，讓 AIRE 能顯示目前授權狀態、方案與裝置啟用結果。
- 新增 OPCOS 主站的序號發放驗收流程，包含 admin 手動核發、upgrade request 核准、使用者產品頁顯示完整序號與 Mac 下載入口。
- 新增假資料測試規則，E2E 必須用乾淨 seed 重建測試狀態，不得依賴或刪除真實客戶資料。
- 修改後續實作驗收，必須跑 AIRE 本機 E2E 與 OPCOS 主站 API/UI 測試，證明同一組序號可以被 AIRE 啟用與驗證。

## Non-Goals

- 不在本 SR 直接接正式金流或自動開發票。
- 不把 AIRE 案件、屋主個資、地政查詢結果上傳到 OPCOS。
- 不讓 AIRE 桌面端自行產生正式序號。
- 不刪除本機或 production 既有資料；測試資料只能在測試 sandbox、localStorage/mock DB 或測試帳號範圍內重置。
- 不處理 GitHub Releases、R2 或自動更新檔案發布；下載入口只作為授權後可見的連結狀態。

## Capabilities

### New Capabilities

- `opcos-aire-license-serial-integration`: 定義 OPCOS 主站發序號、AIRE 桌面啟用驗證、方案同步與乾淨假資料驗收的一條龍流程。

### Modified Capabilities

(none)

## Impact

- Affected specs:
  - New: `opcos-aire-license-serial-integration`
- Affected code:
  - Modified: AIRE desktop license client and settings activation UI
  - Modified: AIRE browser mock backend and E2E seed/reset helpers
  - Modified: OPCOS main-site license API, admin license UI, AIRE product page, and upgrade request fulfillment flow
  - Modified: AIRE and OPCOS license/upgrade tests
- Dependencies 新增: 無
- 環境變數新增:
  - AIRE desktop: `OPCOS_API_BASE_URL`
  - OPCOS main site: production/staging license API base URL and public AIRE download URL, names to align with existing OPCOS env naming before implementation
