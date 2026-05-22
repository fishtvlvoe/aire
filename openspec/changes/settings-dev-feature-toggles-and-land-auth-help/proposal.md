## Why

目前「方案與升級」把測試版功能寫成已開啟，會讓正式客戶誤以為進階圖資已經包含在基本方案；「地政授權」也缺少直接申請入口，客戶不知道要去哪裡註冊地政查詢帳號。

## What Changes

- 修改方案功能清單，改為顯示六個功能項目：Google 地圖、空拍圖、街景參考、AI 格局圖整理、地籍圖整理、實價登錄。
- 修改功能狀態文案，所有功能項目只標示「開發中」，不再顯示測試版或正式版歸屬說明。
- 修改功能開關行為，預設狀態全部關閉；只有超級管理員身分可以手動開啟或關閉。
- 新增實價登錄的同款 toggle 控制，避免它只像靜態文字。
- 修改地政授權申請說明，加入地政註冊網址與自然人憑證／工商憑證申請文案。

## Non-Goals

- 不在本次串接正式付費金流或 OPCOS 方案訂閱狀態。
- 不在本次改動地政 API 實際查詢流程、扣款邏輯或憑證儲存方式。
- 不在本次實作 Google 地圖、空拍圖、街景、AI 格局圖或實價登錄的正式資料串接。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `settings-page`: 方案與升級頁的可用功能顯示、開關權限與實價登錄項目。
- `land-registry-api-key-settings`: 地政授權頁的申請入口與憑證申請說明。

## Impact

- Affected specs: settings-page, land-registry-api-key-settings
- Affected code:
  - Modified: src/lib/product-ui-demo-alignment.ts
  - Modified: src/app/(dashboard)/settings/page.tsx
  - Modified: src/components/settings/LandApiSection.tsx
  - Modified: src/lib/mock-backend.ts
  - Modified: src/app/(dashboard)/settings/__tests__/page.test.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - Modified: src/lib/__tests__/product-ui-demo-alignment.test.ts
  - Modified: e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - Modified: e2e/product-auth-functional-flow.spec.ts
  - Modified: e2e/product-ui-demo-alignment.spec.ts
- Dependencies 新增: none
- 環境變數新增: none
