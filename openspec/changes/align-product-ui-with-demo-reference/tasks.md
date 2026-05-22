# align-product-ui-with-demo-reference — Tasks

## 1. Demo 對照與測試基準

- [x] 1.0 Requirement: Product UI SHALL use the demo HTML files as the source of truth — 將兩個 demo HTML 登錄為本 SR 的 UI/UX 基準，所有主流程實作與驗收都必須引用它們。
- [x] 1.1 新增 demo reference smoke test，確認 `registry-autofill-workbench.html` 與 `registry-autofill-settings.html` 存在且包含必要標題與分類。
- [x] 1.2 新增產品 UI contract test，鎖定 sidebar 一級資料夾與子選單文案。
- [x] 1.3 新增前台文字 audit test，禁止客戶路由出現 `MOI_API_`、`COP309`、`BASIC`、`pro`、`advanced`、backend enum。

## 2. 主殼層與導覽

- [x] 2.0 Requirement: Sidebar SHALL provide folder navigation, collapse, and profile entry — 導覽必須對齊 demo 的資料夾結構、收合按鈕與個人設定入口。
- [x] 2.1 重做 `AppSidebar` 為 demo 的資料夾式一級選單與子選單。
- [x] 2.2 保留收合按鈕與個人設定入口，移除主選單底部設定說明卡。
- [x] 2.3 將「地政資料 / 費用紀錄 / 產出文件 / 系統設定」接到明確路由或 disabled-ready route。

## 3. 新增案件與地政判斷

- [x] 3.0 Requirement: New case flow SHALL be address-first with registry fallback — 新增案件必須先用地址或地政識別資料查詢，查不到才人工選。
- [x] 3.1 新增 address-first case creation tests：成功、自動分類、查不到、多候選 fallback。
- [x] 3.2 修改 `src/app/(dashboard)/cases/new/page.tsx`，先輸入地址與地政識別資料，再由 registry classification 決定土地/建物/農舍章節。
- [x] 3.3 只有查不到或多候選時顯示人工物件類型選擇。
- [x] 3.4 建立 registry classification adapter mock，回傳 demo 所需的「土地 2 筆、建物 1 筆、農舍、門牌需人工確認」資料。

## 4. 說明書工作台

- [x] 4.0 Requirement: Workbench SHALL show customer-facing field review, supplement, source, and cost states — 工作台必須顯示案件/章節、欄位審核、資料來源、補件、費用與 PDF 檢查。
- [x] 4.1 新增 `DemoAlignedWorkbench` component tests，驗證左欄案件/章節與右欄欄位審核存在。
- [x] 4.2 將案件 detail 主路由改成 demo-aligned workbench，舊 `CaseWizard` 降為 legacy/dev/過渡 route。
- [x] 4.3 實作左欄：案件卡、地址與地政判斷、章節 pills、本章完成度。
- [x] 4.4 實作右欄 tabs：欄位、資料來源、補件、費用、PDF 檢查。
- [x] 4.5 整合 `HouseMvpWorkbench` 的欄位/補件/現場確認能力，但移除工作台常駐的升級與規則說明。
- [x] 4.6 整合 `CaseWizardStep2` / registry preview 的資料來源，改成工作台欄位審核資料。

## 5. 客戶文案與欄位審核

- [x] 5.1 建立中文服務名稱 mapping：例如「建物所有權資料」、「門牌建號查詢」、「所有權人比對服務」。
- [x] 5.2 欄位列顯示欄位名稱、目前值、資料來源、狀態、補件動作、費用影響。
- [x] 5.3 前台狀態統一為「地政已帶入、需人工提供、待資料、查詢未成功、待系統補齊」等中文文案。
- [x] 5.4 將原始 API code、transaction id、raw error code 只放在 admin/log/費用明細展開區。

## 6. 系統設定對齊 demo

- [x] 6.0 Requirement: Settings SHALL contain upgrade, registry rules, billing, PDF assets, and authorization categories — 設定必須集中授權升級、地政規則、費用帳務、PDF 圖資欄位與地政授權。
- [x] 6.1 新增 settings category tests，驗證「授權與升級、地政資料規則、費用與帳務、PDF 圖資欄位、地政授權」。
- [x] 6.2 重排 `settings/page.tsx` 為 demo 的左側設定分類 + 右側設定內容。
- [x] 6.3 實作 iOS-style entitlement toggles：未升級 disabled 灰色，已升級可開關。
- [x] 6.4 將屋主資料邊界、費用歸屬、PDF 圖資欄位移到 settings，不在工作台常駐。
- [x] 6.5 保留現有 license、land API key、premium unlock、logs，但移入對應分類或 admin/dev-only 區。

## 7. 費用紀錄與升級端口

- [x] 7.0 Requirement: Cost and outcome ledger SHALL have visible customer and admin surfaces — 費用紀錄必須讓客戶看懂成功、失敗、免費、0 元、扣款原因，也要保留 admin 稽核細節。
- [x] 7.1 新增 usage ledger adapter contract tests：成功、失敗、免費、0 元、回傳筆數、扣款金額。
- [x] 7.2 建立「地政資料 → 費用紀錄」頁面或 route-ready view。
- [x] 7.3 建立 entitlement adapter contract：Google 地圖、空拍/街景、AI 格局圖整理、地籍圖整理。
- [x] 7.4 PDF 圖資欄位保留地籍圖、地標圖、空拍圖、格局圖 slot，是否可用由 entitlement 決定。

## 8. 視覺對照與瀏覽器驗證

- [x] 8.0 Requirement: Existing product-only capabilities SHALL be classified before reuse — 現有但 demo 沒有的功能必須先分類，再決定移到設定、admin、legacy 或另開 SR。
- [x] 8.0a Requirement: Visual verification SHALL compare implementation against the demo reference — 完成前必須用瀏覽器截圖對照 demo reference。
- [x] 8.1 以 Playwright 或 browser tool 開啟 demo reference 與正式產品，截 1440px、1024px、768px。
- [x] 8.2 檢查 sidebar、工作台兩欄、settings 分類、toggle、欄位列、文字不重疊。
- [x] 8.3 修正與 demo 明顯不一致的黑框、間距、配色、字級、按鈕與卡片樣式。

## 9. SR Gate 與交付

- [x] 9.1 跑 `spectra analyze align-product-ui-with-demo-reference --json` 並修完 Critical/Warning。
- [x] 9.2 跑 `spectra validate align-product-ui-with-demo-reference`。
- [x] 9.3 跑相關 frontend tests、browser screenshots、文字 audit。
- [x] 9.4 commit 並 push 本 SR 與後續實作變更。
- [x] 9.5 新增測試帳號登入 E2E，覆蓋 admin、一般 user、錯誤帳密、過期帳號，並將發現的 bug 記錄到 `BUGS.md`。
