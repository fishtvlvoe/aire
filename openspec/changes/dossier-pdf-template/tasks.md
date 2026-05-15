## 1. 紅燈測試（TDD Phase — 先跑後寫實作）

- [x] [P] 1.1 為 `PdfTokens` 和 `getThemePdfTokens` 建立紅燈測試：在 `src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx` 新增測試，斷言 `getThemePdfTokens("theme-a-minimal")` 回傳含 `primary`/`text`/`bg` 等欄位的物件，`getThemePdfTokens("unknown")` 回傳 theme-a tokens（覆蓋規格「System SHALL export a getThemePdfTokens function」）；此時函式不存在，測試 MUST 失敗（Cannot find module 或 TypeError）。驗證：`pnpm vitest run react-pdf-components` 顯示 FAILED。
- [x] [P] 1.2 為基底元件建立紅燈測試：在同一測試檔新增，用 `@react-pdf/renderer` 的 `renderToBuffer` 跑 render，斷言 PdfCover/PdfPageHeader/PdfPageFooter/PdfSection 各渲染不報錯，PdfFieldTable 空值顯示「待補」（覆蓋「System SHALL provide a PdfCover component for document covers」「System SHALL provide a PdfPageHeader component」「System SHALL provide a PdfPageFooter component」「System SHALL provide a PdfSection component」「System SHALL provide a PdfFieldTable component for field-value pairs」「Components SHALL consume PdfTokens for all color and font values」）；此時元件不存在，測試 MUST 失敗。驗證：`pnpm vitest run react-pdf-components` 顯示 FAILED。
- [x] [P] 1.3 為 `PdfDocument` 建立紅燈測試：在 `src/lib/pdf-engine/__tests__/document.test.tsx` 新增測試，斷言 `property_type:'land'` 產出 blob size > 1 KB（覆蓋「System SHALL render a 7-page 土地版 PDF for property_type = 'land'」），`property_type:'building'` 產出含「建物版說明書（建置中）」的 blob（覆蓋「System SHALL render 建物版 placeholder for property_type = 'building'」），並斷言 themeId prop 被正確傳入（覆蓋「PdfDocument SHALL accept a themeId prop and apply corresponding tokens」）；此時 `PdfDocument` 是 stub，測試 MUST 失敗。驗證：`pnpm vitest run document` 顯示 FAILED。
- [x] 1.4 為 `renderDossier` 建立紅燈測試：在 `src/lib/pdf-engine/__tests__/engine.test.ts`（已有）新增測試，斷言 `renderDossier({ data: validCaseDossierData, themeId: "theme-a-minimal" })` 解析為 blob size > 1 KB（覆蓋「Engine render function SHALL accept themeId and render PdfDocument」「RenderOptions SHALL be extended with optional caseData and themeId fields」）；此時函式不存在，測試 MUST 失敗。驗證：`pnpm vitest run engine` 顯示 FAILED（新測試紅燈）。

## 2. 實作基底元件庫（react-pdf-components.tsx）

- [x] 2.1 建立 `src/lib/pdf-engine/react-pdf-components.tsx`（Decision 1：新增 `react-pdf-components.tsx` 而非替換既有 theme components），實作 `PdfTokens` interface 和 `getThemePdfTokens(themeId): PdfTokens`，從 `theme-a/b/c` 的 `ThemeTokens` 轉換（primary/text/bg/bgAlt/border/fontFamily）；未知 themeId 回傳 theme-a tokens（覆蓋「System SHALL export a getThemePdfTokens function」）。驗證：任務 1.1 的紅燈測試轉為綠燈（`pnpm vitest run react-pdf-components` PASSED 對應測試）。
- [x] 2.2 在 `react-pdf-components.tsx` 實作 `PdfCover` 元件（覆蓋「System SHALL provide a PdfCover component for document covers」）：用 `@react-pdf/renderer` View/Text/Image，接收 `tokens`/`caseNo`/`address`/`propertyType`/`companyName`/`generatedAt`/`logoBytes?`，標題列使用 `tokens.primary` 為背景色（覆蓋「Components SHALL consume PdfTokens for all color and font values」），無 logoBytes 時留空不報錯。驗證：任務 1.2 中 PdfCover 相關斷言通過。
- [x] 2.3 在 `react-pdf-components.tsx` 實作 `PdfPageHeader`（覆蓋「System SHALL provide a PdfPageHeader component」，顯示 caseNo + 頁碼）、`PdfPageFooter`（覆蓋「System SHALL provide a PdfPageFooter component」，顯示 generatedAt）、`PdfSection`（覆蓋「System SHALL provide a PdfSection component」，帶標題列的 section wrapper）。驗證：任務 1.2 中 PdfPageHeader/PdfPageFooter/PdfSection 相關斷言通過。
- [x] 2.4 在 `react-pdf-components.tsx` 實作 `PdfFieldTable`（覆蓋「System SHALL provide a PdfFieldTable component for field-value pairs」）：接收 `rows: [string, string][]`，左欄 120pt 灰底/右欄 auto 白底，空值 `""` 或 `undefined` 顯示「待補」，CJK fixed width 避免自動換行截斷（覆蓋「missing data values SHALL display as 待補」）。驗證：任務 1.2 中「PdfFieldTable 空值顯示待補」斷言通過。

## 3. 實作文件組裝（document.tsx）

- [x] 3.1 在 `src/lib/pdf-engine/document.tsx` 定義並匯出 `CaseDossierData` interface（Decision 2：CaseDossierData 從 CaseRow 提取，缺值填「待補」）：`caseNo`/`address`/`propertyType`/`landLotNo`/`ownerName`/`companyName`/`generatedAt`/`logoBytes?`（覆蓋「System SHALL define a CaseDossierData interface for dossier rendering」）。確認 `PdfDocument` 為 named export（覆蓋「PdfDocument SHALL be exported from document.tsx」）。驗證：TypeScript `pnpm tsc --noEmit` 0 錯誤；任務 1.3 測試中使用 `CaseDossierData` 的部分 compile 成功。
- [x] 3.2 在 `document.tsx` 實作 `PdfDocument` React 元件（Decision 3：document.tsx 用 property_type switch，土地版 7 章節各一個 Page）：接收 `data: CaseDossierData` 和 `themeId: string`（覆蓋「PdfDocument SHALL accept a themeId prop and apply corresponding tokens」），當 `propertyType === 'land'` 渲染 7 個 `<Page>`（封面/法規告知/土地標示/權利他項/現況調查/稅費/成交行情），每頁使用 `PdfPageHeader`/`PdfPageFooter`（覆蓋「System SHALL render a 7-page 土地版 PDF for property_type = 'land'」）；當 `propertyType === 'building'` 渲染 1 頁含「建物版說明書（建置中）」文字（覆蓋「System SHALL render 建物版 placeholder for property_type = 'building'」）。驗證：任務 1.3 的紅燈測試全部轉為綠燈（`pnpm vitest run document` PASSED）。
- [x] 3.3 在 `document.tsx` 的 7 個子 Page 元件中補完各章節欄位，用 `PdfSection`/`PdfFieldTable` 展開資料：
  - 封面：公司名、案件編號、地址、日期、物件類型
  - 法規告知：固定條文文字（`PdfLegalBlock` 或直接 Text）
  - 土地標示：地號、地目、面積、使用分區
  - 權利/他項：所有人姓名、他項權利種類（缺值「待補」）
  - 現況調查：臨路狀況、排水、管制區域（缺值「待補」）
  - 稅費/規費：房屋稅、地價稅、登記規費（全「待補」）
  - 成交行情/設施：周遭成交均價（全「待補」）
  驗證：`pnpm vitest run document` 持續通過；「missing data values SHALL display as 待補」各欄位通過範例表斷言。

## 4. 實作引擎新方法（engine.ts）

- [x] 4.1 在 `src/lib/pdf-engine/engine.ts` 新增 `DossierRenderOptions` interface（`data: CaseDossierData`、`themeId: string`）和 `renderDossier(opts): Promise<Blob>` 非同步函式（Decision 4：engine.ts 新增 `renderDossier()` 保留原 `render()` 相容）：內部呼叫 `pdf(<PdfDocument data={opts.data} themeId={opts.themeId} />).toBlob()`，Vitest 環境回傳 `toUtf8SafePdfBlob`，其他回傳 raw blob；原 `render(options: RenderOptions)` 函式不變（覆蓋「Engine render function SHALL accept themeId and render PdfDocument」）。驗證：任務 1.4 的紅燈測試轉為綠燈（`pnpm vitest run engine` PASSED）。
- [x] 4.2 擴充 `RenderOptions` interface 加入 `themeId?: string` 和 `caseData?: CaseDossierData` 可選欄位（覆蓋「RenderOptions SHALL be extended with optional caseData and themeId fields」），並在 `PdfEngine` interface 和 `createPdfEngine` 回傳值加入 `renderDossier` 方法，使呼叫端可透過 engine instance 呼叫。驗證：`pnpm tsc --noEmit` 0 錯誤；既有 `engine.render({ caseId, content })` 呼叫仍 compile 通過（backward compat）。

## 5. 接線 preview 頁（preview/page.tsx）

- [x] 5.1 在 `src/app/(dashboard)/cases/[id]/preview/page.tsx` 查詢 SQLite CaseRow，組裝 `CaseDossierData`（覆蓋「preview/page.tsx SHALL assemble CaseDossierData from the case SQLite row」）：`caseNo = row.case_no ?? row.id.slice(0,8)`、`address = row.address ?? ""`、`propertyType = row.property_type ?? 'land'`、`ownerName = row.owner_name ?? ""`、`companyName = "建安不動產"`（Phase 1 固定值）、`generatedAt = new Date().toLocaleDateString('zh-TW')`；查無 CaseRow 時所有字串欄位設 `""`（缺值顯示「待補」）。驗證：`pnpm tsc --noEmit` 0 錯誤。
- [x] 5.2 在 `preview/page.tsx` 改呼叫 `engine.renderDossier({ data: caseDossierData, themeId })` 取代原本的 `engine.render({ caseId, content })`，並把 `themeId` 從 `PdfPreviewer` state 傳入（`PdfPreviewer` 已有 `themeId` state）。驗證：`pnpm vitest run PdfPreviewer` 持續通過；browser `pnpm dev` 開 preview 頁顯示 7 頁 PDF（頁碼 1/7 到 7/7）。

## 6. 全量驗收

- [x] 6.1 執行 `pnpm test` 全部測試套件，確認 0 失敗，含原 `engine.test.ts` 的既有測試（backward compat `render()` 路徑）。驗證：CI-style `pnpm test` exit code 0。
- [x] 6.2 執行 `pnpm tsc --noEmit`，確認 TypeScript 0 type error。驗證：exit code 0。
- [x] 6.3 手動在 `pnpm dev` 下開 preview 頁，切換主題 A/B/C，截圖確認：(1) PDF 顯示 7 頁，(2) 缺值欄位顯示「待補」，(3) 主題切換改變封面標題列顏色。驗證：3 張截圖可見正確渲染。
