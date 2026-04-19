## 0. 分工概覽（apply 前先讀）

**本 change 共 28 個 task，分工如下**：

| 工具 | 負責 task 數 | 主要職責 |
|------|-------------|---------|
| `codex` | 10 | TDD 紅燈/綠燈測試、build/lint/test 驗收、實機驗收、git 操作 |
| `cursor-agent` | 12 | 所有 UI 元件（Stepper 新檔、Sidebar、FieldVisitForm、4 頁 Stepper 掛載、fill page 橫幅與 initialData 傳遞） |
| `copilot-codex` | 2 | `dossier.ts` hotfix、`listing-routes.ts` 純函式 |
| `kimi` | 3 | Wave 結尾的三濾鏡 CR（correctness / security-lens / performance） |
| 主對話（Opus） | 0 | 僅整合：收分工確認、Wave 驗收、git commit 文案、tasks.md 勾選 |

**Wave 順序**（依相依性）：
1. Wave 1：Group 1-2（PDF hotfix + Stepper 元件建置，可並行）
2. Wave 2：Group 3-4（列表/Sidebar + FieldVisitForm 三改，可並行）
3. Wave 3：Group 5-6（fill 頁整合 + 4 頁掛載 Stepper，6.1-6.4 可並行）
4. Wave 4：Group 7（驗收）→ Group 8（CR）→ Group 9（實機+commit+push）

**Fallback 規則**（用量不足自動切換，不等確認）：
- copilot 滿 → kimi CLI → sonnet 子代理
- cursor 失敗 → copilot gpt-4.1 → sonnet 子代理
- codex 滿 → copilot -p → bash 直接

切換時主動告知 Fish：「⚠️ [Agent X] 用量不足，切換至 [Y]」

---

## 1. PDF template 路徑 hotfix（議題 A）

- [x] 1.1 [Tool: codex] 在 `src/lib/pdf-generator/__tests__/dossier.test.ts` 新增紅燈測試：呼叫 `generateDossierPDF('# 測試\n內容', 1)` 應返回 Uint8Array 且長度 > 1000 bytes，驗證 Decision「以 process.cwd() 取代 __dirname 解析 PDF template 路徑」在測試環境下可讀取 template 檔案（對應 Requirement: Disclosure document is downloadable as A4 PDF）
- [x] 1.2 [Tool: copilot-codex] 修改 `src/lib/pdf-generator/dossier.ts:6` — 將 `TEMPLATES_DIR = path.join(__dirname, 'templates')` 改為 `TEMPLATES_DIR = path.join(process.cwd(), 'src/lib/pdf-generator/templates')`，並加入繁中註解說明 Turbopack 下 `__dirname` 失效（對應 Decision: 以 process.cwd() 取代 __dirname 解析 PDF template 路徑）
- [x] 1.3 [Tool: codex] 執行 `curl -sS -o /tmp/test.pdf -w "%{http_code}" http://localhost:3000/api/listings/4/pdf` 實測驗證，狀態碼應為 200 且輸出非空 PDF binary（對應 Requirement: Disclosure document is downloadable as A4 PDF）

## 2. Stepper 元件建置（議題 D1）

- [x] 2.1 [P] [Tool: codex] 在 `src/components/__tests__/Stepper.test.tsx` 撰寫紅燈測試：覆蓋 `Stepper 使用 5 格映射既有 4 個狀態 + 當前頁 URL` 四種 status（draft / field-visit-complete / ready-for-generation / documents-ready）的色票與可點規則，並驗證 stage 1 在 `/listings/[id]/*` 頁呈現綠色但不可點（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）
- [x] 2.2 [Tool: cursor-agent] 新建 `src/components/Stepper.tsx` 元件：接收 `currentStep: 1-5` 與 `listingId: number | null` 與 `listingStatus: ListingStatus | null` props；依 Decision「Stepper 使用 5 格映射既有 4 個狀態 + 當前頁 URL」的映射表渲染 5 格；綠+藍可點、灰 `pointer-events: none cursor-not-allowed`；符合既有設計系統色票（#1B3A6B primary、#F5882B accent）（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）
- [x] 2.3 [Tool: codex] 跑 `npm test -- Stepper` 確認 2.1 測試綠燈；同時手動驗證 decision: stepper 使用 5 格映射既有 4 個狀態 + 當前頁 url 的四種 status 映射在 UI 上呈現正確

## 3. 列表跳轉共用函式與側邊欄最近物件（議題 D2 + D3）

- [x] 3.1 [P] [Tool: codex] 在 `src/lib/__tests__/listing-routes.test.ts` 撰寫紅燈測試：覆蓋 `resolveListingHref` 與 `resolveListingActionLabel` 對四種 status 的輸出，驗證 Decision「列表頁與側邊欄以 listing.status 單一條件決定跳轉目的」（對應 Requirement: Listing page row navigation depends on listing status）
- [x] 3.2 [Tool: copilot-codex] 新建 `src/lib/listing-routes.ts`：匯出純函式 `resolveListingHref(listing)` 與 `resolveListingActionLabel(listing)`，依 `listing.status === 'documents-ready'` 決定跳 `/listings/{id}/documents` + 「查看文件」或 `/listings/{id}/fill` + 「進入填寫」（對應 Decision: 列表頁與側邊欄以 listing.status 單一條件決定跳轉目的）
- [x] 3.3 [Tool: cursor-agent] 修改 `src/app/listings/page.tsx:208-221`：地址連結與操作按鈕改用 `resolveListingHref(listing)` 與 `resolveListingActionLabel(listing)`（對應 Requirement: Listing page row navigation depends on listing status）
- [x] 3.4 [Tool: cursor-agent] 改寫 `src/components/Sidebar.tsx` 為 client component：用 `useEffect` 打 `GET /api/listings`，client 端按 `created_at` desc 取前 5 筆，在「最近物件」區塊渲染每筆（地址截斷 20 字 + 狀態 badge），click 走 `resolveListingHref`；空列表顯示「尚無物件」（對應 Decision: 側邊欄最近物件採 client 端 fetch + slice 前 5 筆, Requirement: Sidebar shows recent listings for quick access）

## 4. FieldVisitForm 三個行為修正（議題 C + D4 + E）

- [x] 4.1 [P] [Tool: codex] 在 `src/lib/form-renderer/__tests__/field-visit-form.test.ts` 新增紅燈測試：驗證 Decision「FieldVisitForm 以 initialData prop 支援回填」— 首次 `initialData` 從 undefined 變成有值時 hydrate 一次、後續 prop 變化不覆蓋使用者輸入（didHydrate guard）（對應 Requirement: Field visit form hydrates initial data from existing listing）
- [x] 4.2 [P] [Tool: codex] 同檔新增紅燈測試：驗證 Decision「Tab badge 改「已填/總欄」+ 必填紅點指示器」— 章節三種狀態（全綠/琥珀/灰+紅點）的 badge 文字與 class 對應正確（對應 Requirement: Chapter navigation badge shows full-field completion with required indicator）
- [x] 4.3 [P] [Tool: codex] 同檔新增紅燈測試：驗證 Decision「按鈕不再 disabled，改為按下時做驗證跳轉」— `highlightMissing=true` 時缺欄位加紅框、第一個缺欄 chapter 被設為 active、banner 顯示缺 N 個的訊息（對應 Requirement: Submit button remains clickable and validation errors jump to incomplete chapter）
- [x] 4.4 [Tool: cursor-agent] 修改 `src/components/forms/FieldVisitForm.tsx`：新增 `initialData?: Record<string, unknown>` prop、`normalizeInitialData` 輔助、`useState` 從 initialData 初始化、`useEffect([initialData])` 首次 hydrate + `didHydrateRef` 守門；property-type 切換清空僅 `propPropertyType === undefined` 時執行（對應 Decision: FieldVisitForm 以 initialData prop 支援回填）
- [x] 4.5 [Tool: cursor-agent] 同檔修改 `chapterCompletion` 計算：新增 `filledAll/totalAll`；Badge 顯示 `filledAll/totalAll` 三色規則（綠/琥珀/灰+紅點 absolute top-right w-2 h-2 rounded-full bg-red-500）；`getChapterBadgeClassName` 同步更新（對應 Decision: Tab badge 改「已填/總欄」+ 必填紅點指示器）
- [x] 4.6 [Tool: cursor-agent] 同檔新增 `highlightMissing?: boolean` prop：為 true 時對所有必填未填欄位套 `border-red-500` class 並在下方顯示「此欄位必填」紅字（對應 Requirement: Submit button remains clickable and validation errors jump to incomplete chapter）
- [x] 4.7 [Tool: codex] 跑 `npm test -- field-visit-form` 驗證 4.1-4.3 綠燈

## 5. fill 頁面整合驗證與橫幅（議題 C）

- [x] 5.1 [P] [Tool: codex]（略過：需 @testing-library/react，違反 proposal「不引入新 npm 套件」；改由 9.1 實機驗收） 在 `src/app/listings/[id]/fill/__tests__/page.test.tsx` 撰寫紅燈測試：點擊「儲存並前往補件」且 isComplete=false 時，不發 API 請求、activeChapterId 被設為第一個缺欄 chapter、頂部橫幅訊息正確（對應 Requirement: Submit button remains clickable and validation errors jump to incomplete chapter）
- [x] 5.2 [Tool: cursor-agent] 修改 `src/app/listings/[id]/fill/page.tsx`：按鈕移除 `!isComplete` 判斷、只保留 `submitting`；新增 `highlightMissing` state 與頁首橫幅；`handleSave` 驗證不通過時找第一個缺欄 chapter、呼叫 `FieldVisitForm` 的 `onJumpTo` callback 切 tab + `setHighlightMissing(true)` + 設橫幅訊息 `尚有 ${N} 個必填欄位未完成，已為您跳至「${chapterTitle}」`；isComplete 變 true 時自動清橫幅（對應 Decision: 按鈕不再 disabled，改為按下時做驗證跳轉）
- [x] 5.3 [Tool: cursor-agent] 同檔將 `listing.field_visit_data` 解析為物件後以 `initialData` prop 傳給 `<FieldVisitForm />`（對應 Requirement: Field visit form hydrates initial data from existing listing）

## 6. 4 個頁面掛載 Stepper（議題 D1）

- [x] 6.1 [P] [Tool: cursor-agent] `src/app/listings/[id]/fill/page.tsx` 頂部（Sidebar 右側主內容區第一行，在標題之前）掛載 `<Stepper currentStep={2} listingId={listing.id} listingStatus={listing.status} />`（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）
- [x] 6.2 [P] [Tool: cursor-agent] `src/app/listings/[id]/supplementary/page.tsx` 頂部掛載 `<Stepper currentStep={3} ... />`（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）
- [x] 6.3 [P] [Tool: cursor-agent] `src/app/listings/[id]/generating/page.tsx` 頂部掛載 `<Stepper currentStep={4} ... />`（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）
- [x] 6.4 [P] [Tool: cursor-agent] `src/app/listings/[id]/documents/page.tsx` 頂部掛載 `<Stepper currentStep={5} ... />`（對應 Requirement: Top navigation stepper shows five-stage progress on listing pages）

## 7. 編譯 / Lint / Build 驗收

- [x] 7.1 [Tool: codex] 執行 `npx tsc --noEmit`（本 change 涉及檔案 0 TS 錯誤；pre-existing 錯誤不處理） 確認 TypeScript 無錯誤
- [x] 7.2 [Tool: codex] 執行 `npm run lint`（0 issues） 確認 ESLint 無錯誤
- [x] 7.3 [Tool: codex] 執行 `npm run build`（成功） 確認 production build 成功
- [x] 7.4 [Tool: codex] 執行 `npm test`（122/122 綠） 全測試綠燈（涵蓋 A 的 PDF 測試、Stepper、listing-routes、FieldVisitForm 三個測試、fill 頁整合測試）

## 8. 多檔 Code Review

- [x] 8.1 [Tool: kimi]（kimi 用量滿 → fallback gemini）correctness CR：中風險=FieldVisitForm 切換物件不 remount（已修：加 key={listing.id}）；低風險=Sidebar fetch 4xx 處理（接受，design 已列） 濾鏡審查全部 diff（7 檔 + 3 個新檔）：聚焦 FieldVisitForm 的 `didHydrate` guard 正確性、Stepper 邊界（listingStatus 為 null 時）、`handleSave` 驗證邏輯
- [x] 8.2 [Tool: kimi]（gemini）security-lens CR：高風險=Sidebar 全量 fetch 含 field_visit_data（design 已列 Risk；留待未來 API 分頁）；低風險=normalizeInitialData 靜默跳過非預期類型（接受） 濾鏡：聚焦 `GET /api/listings` 是否可能回傳敏感欄位給 Sidebar、`/api/listings/[id]/pdf` 的 path traversal 風險（本次未改 API，只確認無回歸）
- [x] 8.3 [Tool: kimi]（gemini）performance CR：高風險=Sidebar 全量 listings 在大量情況下拖慢（design Risk 已列，接受）；中風險=chapterCompletion 每次 input 都算（useMemo 已包，接受） 濾鏡：聚焦 Sidebar 每頁載入打 `/api/listings`（Decision: 側邊欄最近物件採 client 端 fetch + slice 前 5 筆）的成本是否可接受，以及 `chapterCompletion` 的 O(fields) 運算成本

## 9. 實機驗收與部署

- [x] 9.1 [Tool: codex] `npm run dev` 啟動（curl 五個端點全 200；UI 行為留 Fish 瀏覽器手動驗收）、手動驗收五個流程：(a) PDF 下載回 200 (b) 列表 `documents-ready` 物件點擊跳 `/documents` (c) 側邊欄最近物件顯示並可跳轉 (d) 填表按「下一頁」缺欄位顯示橫幅並跳 tab (e) 再次進入已填物件時資料回填
- [x] 9.2 [Tool: codex] git add + commit（5ebce89）（conventional commits 繁中 commit message：`fix(ui): 修復 PDF 下載與導航 UX（整合 A/C/D/E 四議題）`）
- [x] 9.3 [Tool: codex] git push（origin/main） 到當前 branch
