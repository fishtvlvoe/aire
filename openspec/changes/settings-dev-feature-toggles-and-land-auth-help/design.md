## Goals

- 讓客戶看到的升級功能狀態簡單一致：只有功能名稱與「開發中」。
- 讓一般使用者不會誤會測試版功能等於正式可用方案。
- 讓超級管理員在測試或內部驗收時可以用同一組 iOS-like toggle 開啟或關閉所有預留功能。
- 讓地政授權頁直接提供官方註冊入口與憑證申請提示。

## Non-Goals

- 不實作正式權限方案判斷；本次只以現有 `sessionUser.role === "admin"` 作為本機超級管理員測試身分。
- 不把「開發中」功能接到正式 API。
- 不調整側邊欄 IA 或其他設定頁面的分類。

## Design Decisions

### 1. 功能清單來源仍由 product UI contract 提供

`src/lib/product-ui-demo-alignment.ts` 已經是設定頁方案與升級資訊的集中來源。本次沿用 `getEntitlementFeatures()`，但資料改成：

- 六個獨立項目：Google 地圖、空拍圖、街景參考、AI 格局圖整理、地籍圖整理、實價登錄。
- `description` 固定為「開發中」。
- `enabled` 預設為 `false`。
- 每個項目有穩定 feature flag id，供設定頁從 mock backend 讀取與 toggle。

### 2. 超級管理員才可切換

設定頁載入 `get_session` 與 `get_feature_flags`。若目前使用者是 admin，視為本機超級管理員，可以切換六個功能。非 admin 或未登入時：

- switch 顯示關閉。
- switch disabled。
- 不顯示工程用語或 Super Admin 區塊。

### 3. 實價登錄納入同一組 feature toggle

實價登錄不再用 MCP Hub 或文字區塊呈現；它與其他預留功能共用同一種 toggle UI，降低使用者理解成本。

### 4. 地政授權申請入口是普通客服導向文案

`LandApiSection` 的「申請說明」改成正式內容：

- 連結文字指向地政官方註冊頁。
- 顯示「請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。」
- 保留 Client ID、安全碼、儲存、測試連線。

## Implementation Contract

### Feature controls

- `getEntitlementFeatures()` SHALL return exactly six items in this order: Google 地圖、空拍圖、街景參考、AI 格局圖整理、地籍圖整理、實價登錄。
- Each feature row SHALL display `開發中` and SHALL NOT display `測試版已開啟` or `正式版歸在`.
- Non-admin users SHALL see all six switches disabled and off.
- Admin users SHALL be able to click each switch and see the visual state update.
- Feature flag state SHALL persist through `toggle_feature_flag` in the mock backend for browser-dev validation.

### Land registry authorization help

- `LandApiSection` SHALL render a link to `https://cop.moi.gov.tw/Register`.
- The help section SHALL display `請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。`
- The help section SHALL NOT render the generic `敬請期待` card for application instructions.

## Risks

- Existing tests currently expect `Google 地圖已開啟`; these tests must be updated to assert the new default-off and admin-toggle behavior.
- Existing feature flags only include a partial set; mock defaults must add the six customer-facing ids so toggles can persist.
