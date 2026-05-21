## Why

AIRE 子網站已經能把使用者導到 OPCOS 帳號中心，但目前升級只是 query intent 與人工說明，沒有後端申請紀錄、admin 審核核發、桌面 App 啟用驗證的完整閉環。現在要先做可測的非付費升級流程，讓 Fish 能從後台核發 AIRE VIP 授權並讓使用者實際啟用桌面 App。

## What Changes

- 新增 OPCOS AIRE 升級申請後端資料模型與 API，登入使用者可送出 AIRE VIP 測試/升級申請，系統會保存申請狀態與關聯帳號/組織。
- 新增 OPCOS admin 升級審核與核發流程，admin 可查看待處理申請並一鍵核發 AIRE license，不經過金流。
- 修改 OPCOS AIRE 產品管理頁，依申請狀態與授權狀態顯示「可申請、審核中、已開通」三種狀態，只有已開通才顯示下載與序號。
- 修改 OPCOS license activate/verify API，使其接受 AIRE desktop 目前送出的欄位或明確的 production contract，並回傳 AIRE desktop 可持久化的授權回應。
- 修改 AIRE desktop OPCOS license client，使用正確 production base URL 與 OPCOS 後端欄位契約，處理已啟用、裝置額度、撤銷、IP 不符、網路錯誤。
- 新增/更新測試，覆蓋升級申請、admin 核發、產品頁狀態、license activate/verify API、AIRE desktop client payload。

## Non-Goals

- 不接 Stripe、藍新、綠界或任何實際付款流程。
- 不做訂閱扣款、發票、退款、方案計價頁或金流 webhook。
- 不上傳 AIRE 案件資料、屋主資料、PDF 或地政查詢內容到 OPCOS。
- 不重做既有 AIRE 本機 SQLite、PDF 產出、地政 API 或離線 grace 規格。
- 不把 AIRE desktop 改成瀏覽器 SaaS；本次只串授權/升級後端。

## Capabilities

### New Capabilities

- `opcos-aire-upgrade-request`: OPCOS 帳號中心保存 AIRE 升級申請，使用者與 admin 都能讀到可驗證狀態。
- `opcos-aire-license-fulfillment`: OPCOS admin 可從升級申請核發 AIRE 授權，並將授權綁定至使用者目前組織。

### Modified Capabilities

- `license-activation`: AIRE desktop 與 OPCOS production license API 的 base URL、request/response 欄位與錯誤碼契約改為可端到端互通。
- `settings-premium-unlock`: AIRE 端升級入口改成開啟 OPCOS AIRE 產品管理/升級申請入口，不直接假設已接金流 checkout。

## Impact

- Affected specs: `opcos-aire-upgrade-request`, `opcos-aire-license-fulfillment`, `license-activation`, `settings-premium-unlock`
- Affected code:
  - New: `openspec/changes/aire-opcos-license-upgrade-flow/specs/opcos-aire-upgrade-request/spec.md`, `openspec/changes/aire-opcos-license-upgrade-flow/specs/opcos-aire-license-fulfillment/spec.md`
  - Modified: `src-tauri/src/opcos.rs`, `src-tauri/src/commands/license.rs`, `src-tauri/build.rs`, `src/components/settings/PremiumUnlockSection.tsx`, `src/lib/land-registry-api.ts`, `src/lib/mock-backend.ts`
  - External OPCOS repo modified: `/Users/fishtv/Development/products/opcos.me/packages/database/prisma/schema.prisma`, `/Users/fishtv/Development/products/opcos.me/packages/api/modules/license`, `/Users/fishtv/Development/products/opcos.me/apps/opcos/app/api/license`, `/Users/fishtv/Development/products/opcos.me/apps/opcos/app/(authenticated)/(main)/(account)/products/aire`, `/Users/fishtv/Development/products/opcos.me/apps/opcos/app/(authenticated)/(main)/(account)/admin/licenses`, `/Users/fishtv/Development/products/opcos.me/apps/opcos/modules/aire`, `/Users/fishtv/Development/products/opcos.me/apps/opcos/modules/admin`
  - Removed: none
- Dependencies 新增: none planned
- 環境變數新增: none; AIRE release build SHALL use `https://opcos.me` as OPCOS API base unless overridden by existing `OPCOS_API_BASE_URL`
