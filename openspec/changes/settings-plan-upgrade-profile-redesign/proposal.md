## Why

目前 `功能開關`、`授權與升級`、底部個人設定與實價登錄升級資訊分散在不同位置，讓使用者無法判斷哪些功能是目前方案可用、哪些需要升級、哪些只是工程內部名稱。這次要把升級與個人設定改成使用者能理解的一條路徑，避免重複頁面與不能操作的假開關。

## What Changes

- 修改系統設定導覽，將 `功能開關` 與 `授權與升級` 整合為單一 `方案與升級` 頁。
- 新增三方案卡片：基本款、進階款、高級款；升級 CTA 只導向 OPCOS/網站升級，不在本機做付款。
- 修改方案功能呈現：基本款只顯示目前可用功能；測試版本可用功能要能開啟，不顯示大量灰色不可點的假 toggle。
- 移除客戶可見的 `MCP Hub` 字樣，改成 `實價登錄` 或 `實價登錄升級功能`。
- 修改底部個人設定 `/settings`，顯示帳號與授權管理、更新密碼、個人名稱與 Email、品牌色、操作紀錄摘要。
- 修正 toggle 視覺，避免開關圓點跑出容器右側。

## Non-Goals

- 不在本 SR 實作正式付費、金流、發票或訂閱管理。
- 不把實價登錄 MCP 後端完整串接完成；後端仍由既有 API/ledger SR 追蹤。
- 不新增雲端同步個資。
- 不把 Super Admin 或工程內部控制暴露給一般客戶。

## Capabilities

### New Capabilities

- `settings-plan-upgrade-profile-redesign`: 定義 AIRE 設定頁的方案升級、可用功能與個人設定體驗。

### Modified Capabilities

- `settings-page`: 設定頁預設進入個人設定，並將方案、授權與升級集中為單一頁。
- `sidebar-navigation`: 系統設定二級導覽不得同時顯示功能開關與授權升級兩個重複入口。

## Impact

- Affected specs:
  - New: `settings-plan-upgrade-profile-redesign`
  - Modified: `settings-page`, `sidebar-navigation`
- Affected code:
  - Modified: `src/lib/product-navigation-ia.ts`
  - Modified: `src/lib/product-ui-demo-alignment.ts`
  - Modified: `src/app/(dashboard)/settings/page.tsx`
  - Modified: `src/components/AppSidebar.tsx`
  - Modified: settings and navigation tests
  - Modified: E2E full product flow tests
- Dependencies 新增: 無
- 環境變數新增: 無
