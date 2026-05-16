# Tasks — aire-ux-wizard-refactor

## 1. 資料層擴充（D2: 地政資料持久化 — mock-backend 擴充 cases 表、D5: 欄位統一命名 — 「所有權人」）

- [x] 1.1 擴充 mock-backend cases 資料結構：新增 `land_registry_data` (JSON | null)、`case_name` (string | null)、`current_step` (number, default 1) 欄位。`update_case` 方法接受這三個新參數。[Tool: copilot] 驗證：呼叫 `update_case({ land_registry_data: { lot: '123' } })` 後 `get_case` 回傳含該資料；呼叫 `update_case({ case_name: '和平東路案' })` 後 `get_case` 回傳含 `case_name`。對應 requirement: Case data includes land registry data, Case data includes case name
- [x] 1.2 修改 `PullParcelDataButton` 元件：查詢成功後顯示結果預覽 + 「確認儲存」按鈕。點「確認儲存」呼叫 `update_case` 寫入 `land_registry_data`，顯示「已儲存」確認訊息。對應 requirement: Land registry data persistence。[Tool: copilot] 驗證：點拉謄本→結果顯示→點確認儲存→reload 頁面→顯示已儲存資料而非「尚未查詢」
- [x] 1.3 修改 `assemble-dossier-data.ts`：匯出時先讀 case 的 `land_registry_data`，有值直接用，null 時 fallback 呼叫 API。對應 requirement: PDF export reads persisted data、design D2。[Tool: copilot] 驗證：案件有 `land_registry_data` 時匯出 PDF 不呼叫 API，PDF 內容與儲存資料一致

## 2. 案件列表重設計（D3: 列表操作按鈕 — 純 SVG Icon + Tooltip、列表操作行為）

- [x] 2.1 建立 `CaseListActions` 元件：渲染 5 個 Lucide SVG icon 按鈕（PlusCircle=補件、Eye=查看、Pencil=修改、Trash2=刪除、Download=下載），每個按鈕有 `title` tooltip，每個 `onClick` 含 `e.stopPropagation()`。對應 requirement: SVG icon action buttons。[Tool: copilot] 驗證：元件渲染 5 個 `<button>` 各含正確 SVG icon，hover 顯示 tooltip 文字
- [x] 2.2 建立 `DeleteConfirmDialog` 元件：接收 `open`、`onConfirm`、`onCancel` props。顯示「確定要刪除此案件？此操作無法還原。」+ 確認刪除/取消按鈕。對應 requirement: Delete confirmation dialog。[Tool: copilot] 驗證：開啟 dialog→點取消→dialog 關閉案件不變；點確認刪除→呼叫 onConfirm callback
- [x] 2.3 重構案件列表頁 `src/app/(dashboard)/cases/page.tsx`：(a) 欄位改為「案件名稱/地址+所有權人/案件類型/狀態/建立日期/操作」(b) 整列 `<tr onClick>` 導航到 `/cases/[id]` (c) 操作欄渲染 `CaseListActions` (d) 刪除按鈕開 `DeleteConfirmDialog`。對應 requirement: Case list view, Row click navigation, Case list column layout, Field label uses "所有權人"。[Tool: sonnet] 驗證：列表顯示新欄位→點列跳轉→點按鈕不觸發列跳轉→刪除有確認框→欄位標籤為「所有權人」

## 3. Wizard 向導式流程（D1: Wizard 實作方式 — 同頁 Step 切換（非路由切換）、D6: Wizard 步驟條件邏輯、Wizard 元件行為）

- [x] 3.1 建立 `CaseWizard` 元件：接收 `caseId`，管理 `currentStep` state，頂部渲染 Stepper（4 步驟圓點+連線+標籤），底部渲染上一步/下一步按鈕。載入時讀 case 的 `current_step` 恢復步驟。切步驟時自動 `update_case({ current_step })` 持久化。對應 requirement: Wizard step navigation, Step persistence across page refresh。[Tool: sonnet] 驗證：載入→顯示 Stepper 4 步→Step 1 active→切 Step 2→reload→恢復 Step 2
- [x] 3.2 建立 `CaseWizardStep1` 元件：顯示基本資料表單（所有權人、地址、案件名稱、案件編號）。成屋案件不顯示地號/建號欄位。地址必填驗證通過才能點「下一步」。對應 requirement: Auto-fill land lot and building lot numbers (Step 1 form fields scenario)、design D5。[Tool: copilot] 驗證：成屋案件 Step 1 無地號/建號欄位→地址空白時「下一步」disabled→填地址後可進 Step 2
- [x] 3.3 建立 `CaseWizardStep2` 元件：整合 `PullParcelDataButton`，查詢成功+確認儲存後自動填入 `land_lot_no`/`building_lot_no` 為唯讀欄位。對應 requirement: Auto-fill land lot and building lot numbers (After land registry pull scenario)、Land registry data persistence。[Tool: copilot] 驗證：拉謄本→確認儲存→地號/建號自動填入且 readonly→可進下一步
- [x] 3.4 建立 `CaseWizardStep3` 元件：實價登錄 UI 框架。讀 `premium_real_price_enabled` feature flag，false 時自動跳過。對應 requirement: Step 3 conditional display。[Tool: copilot] 驗證：flag=false → Step 2 完成直接到 Step 4，Stepper 顯示 Step 3 為「跳過」
- [x] 3.5 建立 `CaseWizardStep4` 元件：預覽/匯出功能。「匯出」按鈕呼叫 PDF 產出流程。對應 design D1（Step 4 下一步改為「匯出」）。[Tool: copilot] 驗證：Step 4 顯示匯出按鈕→點擊觸發 PDF 產出
- [x] 3.6 重構 `src/app/(dashboard)/cases/[id]/page.tsx`：移除原有單頁表單，改為渲染 `CaseWizard` 元件。移除案件類型 dropdown（只保留 tab 切換）。對應 requirement: Property type selection、design D1。[Tool: sonnet] 驗證：案件詳情頁顯示 Wizard 而非原有單頁表單→無 dropdown→有 tab 切換

## 4. 補件功能（D4: 「補件」功能 — Dialog 彈窗、補件 Dialog 行為）

- [x] 4.1 建立 `CaseSupplementDialog` 元件：(a) 接收 `caseId`+`open`+`onClose` (b) 上傳區支援 drag-and-drop + 檔案選擇（accept: `.pdf,.jpg,.jpeg,.png,.doc,.docx`，拒絕其他格式顯示「不支援此檔案格式」）(c) 下半部列出缺少必填欄位可直接填寫 (d) 儲存後 `update_case` 更新。對應 requirement: Supplement dialog, File upload, Supplement field completion。[Tool: sonnet] 驗證：開啟 dialog→上傳 PDF 成功→上傳 exe 被拒→填寫缺少欄位→儲存→案件資料更新
- [x] 4.2 在 `CaseListActions` 的補件按鈕連接 `CaseSupplementDialog`：點補件 icon → 開 dialog → 關閉後刷新列表。[Tool: copilot] 驗證：列表點補件 icon→dialog 開啟→儲存關閉→列表資料更新

## 5. 文案修正與收尾（接受標準、範圍界限驗證、資料持久化行為確認）

- [x] 5.1 全站搜尋替換欄位標籤：「屋主姓名」→「所有權人」、「物件名稱 / 屋主」→「所有權人」、「物件名稱 / 地主」→「所有權人」。對應 requirement: Field label uses "所有權人"。[Tool: copilot] 驗證：`grep -r "屋主\|地主\|物件名稱 / " src/` 回傳 0 結果
- [x] 5.2 修正 placeholder 錯字：「其他備注事項」→「其他備註事項」。對應 requirement: Typo correction in placeholder text。[Tool: copilot] 驗證：`grep -r "備注" src/` 回傳 0 結果
- [x] 5.3 新增案件頁 `src/app/(dashboard)/cases/new/page.tsx`：「屋主姓名（選填）」改為「所有權人（選填）」，新增「案件名稱（選填）」欄位，地號欄位改為選填（成屋不需手填）。對應 requirement: Create case flow。[Tool: copilot] 驗證：新增案件頁顯示「所有權人（選填）」+「案件名稱（選填）」→成屋模式地號非必填
- [x] 5.4 下載按鈕功能連接：`CaseListActions` 的下載按鈕觸發 PDF 匯出下載流程。對應 requirement: Download button triggers PDF export。[Tool: copilot] 驗證：點下載 icon→觸發 PDF 匯出並下載檔案
