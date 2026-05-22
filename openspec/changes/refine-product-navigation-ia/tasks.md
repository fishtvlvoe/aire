# refine-product-navigation-ia — Tasks

## 1. Contract 與測試基準

- [ ] 1.1 Product navigation SHALL follow a three-level information architecture / Decision 1: 使用三層導覽模型 — 新增 navigation model contract test，驗證一級、二級、三級項目不混層；以 `pnpm test src/lib/__tests__/product-navigation-ia.test.ts` 驗證。
- [ ] 1.2 Navigation entries SHALL have one click meaning / Decision 3: 案件列只有一個主進入動作 — 新增測試驗證案件列只有一個 primary action，且 row click 與可見主 CTA 不產生不同語意；以 `pnpm test 'src/app/(dashboard)/cases/__tests__/page.test.tsx'` 驗證。
- [ ] 1.3 Customer-facing labels SHALL hide implementation enums / Decision 5: 方案與工程語彙只在設定或 admin 顯示 — 新增文字 audit 測試，禁止 `/cases` 與 `/cases/:id` 顯示 `BASIC/pro/advanced/MOI_API_`；以相關 Vitest 與 Playwright 驗證。

## 2. 側欄與案件總覽 IA 修正

- [ ] 2.1 Two-item sidebar navigation / Decision 1: 使用三層導覽模型 — 修改側欄資料來源，讓一級資料夾只代表產品模組、二級項目只導向模組頁，並明確取代舊的兩項導覽契約；以 `src/components/__tests__/AppSidebar.test.tsx` 驗證。
- [ ] 2.2 Page-level navigation SHALL not duplicate parent navigation / Decision 2: 案件總覽只負責選案件與看狀態 — 修改 `/cases`，移除與側欄重複的「案件總覽、說明書工作台、補件清單」頁內 tabs；以 component test 與 Playwright 截圖驗證。
- [ ] 2.3 Case list view / Decision 2: 案件總覽只負責選案件與看狀態 — 保留案件狀態摘要與搜尋/篩選入口，但不展示案件內工具；以 `/cases` E2E 驗證沒有 `現場必問工作台`。
- [ ] 2.4 Primary actions SHALL be visually and behaviorally unique / Decision 3: 案件列只有一個主進入動作 — 移除或降級重複的「開啟工作台」按鈕，確保案件列主動作唯一；以 Playwright click-flow 驗證 row 進入 `/cases/:id`。

## 3. 案件內三級工作台整理

- [ ] 3.1 Case-scoped tools SHALL not appear before selecting a case / Decision 4: 現場必問是案件內三級模組 — 將現場必問入口限定在 `/cases/:id` 工作台內；以 Playwright 驗證 `/cases` 看不到完整現場必問面板、`/cases/:id` 看得到入口。
- [ ] 3.2 Case workbench SHALL use progressive disclosure / Decision 4: 現場必問是案件內三級模組 — 將現況調查表、位置圖、產權注意事項、稅務附註歸入案件內三級選項；以 `HouseMvpWorkbench` component tests 驗證。
- [ ] 3.3 Direct links that require a case ask for case selection / Decision 1: 使用三層導覽模型 — 對沒有 case id 的 case-scoped 二級入口顯示「請先選擇案件」或導向案件選擇；以 Playwright 驗證直接開 `/cases?view=workbench` 不出現 placeholder 工作台。

## 4. 客戶文案與升級狀態降噪

- [ ] 4.1 Customer-facing labels SHALL hide implementation enums / Decision 5: 方案與工程語彙只在設定或 admin 顯示 — 將 BASIC/pro/advanced 轉為「基本方案/進階方案/尚未升級」；以文字 audit 測試驗證。
- [ ] 4.2 Customer-facing copy SHALL use business terms / Decision 5: 方案與工程語彙只在設定或 admin 顯示 — 將自動化功能卡片改成客戶可理解的中文狀態，不在工作台顯示工程方案名稱；以 component tests 驗證。

## 5. 瀏覽器驗收與 SR Gate

- [ ] 5.1 Product navigation SHALL follow a three-level information architecture — 新增 Playwright 流程 `/cases` → 選案件 → `/cases/:id` → 現場必問，驗證三層點擊行為；以 `E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-navigation-ia.spec.ts --project=chromium-tauri` 驗證。
- [ ] 5.2 Page-level navigation SHALL not duplicate parent navigation — 產出 1440px 與 768px 截圖，人工確認側欄與主內容沒有同名導覽重複；以 Playwright screenshot artifact 驗證。
- [ ] 5.3 執行完整驗收：`pnpm type-check`、`pnpm test`、`pnpm build`、`spectra analyze refine-product-navigation-ia --json`、`spectra validate refine-product-navigation-ia`，全部 exit code 0 才能交付。
