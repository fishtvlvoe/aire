## Context

AIRE v0.1.0 案件詳情頁把所有功能（基本資料、拉謄本、實價登錄、匯出）塞在同一頁，用戶不知道操作順序。地政查詢結果只存 React state，頁面重整即丟失，PDF 匯出時獨立重新呼叫 API，造成資料不一致。案件列表只有「查看」文字連結，缺乏常見的操作按鈕。

目前程式碼結構：
- `src/app/(dashboard)/cases/[id]/page.tsx` — 單一大頁面，包含表單、地政查詢卡片、實價登錄按鈕
- `src/components/PullParcelDataButton.tsx` — 查詢結果存 useState，不存 DB
- `src/lib/pdf-engine/assemble-dossier-data.ts` — PDF 匯出時重新呼叫 land_registry_pull_data API
- `src/lib/mock-backend.ts` — 瀏覽器開發模式的 mock 資料層
- `src/lib/cases-api.ts` — 案件 CRUD API 封裝

## Goals / Non-Goals

**Goals:**
- 案件詳情改為 Wizard 向導式，明確引導操作順序
- 地政查詢結果持久化到 DB，PDF 匯出讀 DB
- 列表操作欄提供 5 個 SVG 圖示按鈕
- 欄位命名統一用「所有權人」
- 補件功能（上傳附件 + 補填欄位）

**Non-Goals:**
- 設定頁/sidebar 重構（另開 change）
- 忘記密碼功能
- PDF 模板重新設計
- Tauri/Electron 桌面版功能
- 實價登錄 API 串接實作（Step 3 僅顯示 UI 框架，API 呼叫待後續 change）

## Decisions

### D1: Wizard 實作方式 — 同頁 Step 切換（非路由切換）

用 React state 控制當前步驟，所有步驟在同一個 `/cases/[id]` 路由下切換。

替代方案：
- 每步驟一個子路由（`/cases/[id]/step1`）→ 增加路由複雜度，步驟間傳資料要靠 URL params 或 global state
- 多頁表單 library（react-hook-form wizard）→ 引入額外依賴

選擇同頁切換因為：步驟少（4 步）、資料共享簡單、不需要額外 library。

### D2: 地政資料持久化 — mock-backend 擴充 cases 表

在 `mock-backend.ts` 的 cases 資料結構新增 `land_registry_data: Record<string, unknown> | null` 欄位。

流程：
1. PullParcelDataButton 查詢成功 → 結果顯示在 UI
2. 用戶確認資料正確 → 點「確認儲存」
3. 呼叫 `update_case` 把 `land_registry_data` 寫入 DB
4. PDF 匯出時 `assemble-dossier-data.ts` 讀 case 的 `land_registry_data`，不再呼叫 API

替代方案：
- 另開獨立表存地政資料 → 增加 join 複雜度，案件資料應該集中管理

### D3: 列表操作按鈕 — 純 SVG Icon + Tooltip

5 個按鈕：補件（PlusCircle）、查看（Eye）、修改（Pencil）、刪除（Trash2）、下載（Download）。
使用 Lucide React icon library（專案已安裝）。
hover 顯示 tooltip（用 `title` 屬性或自建 tooltip 元件）。

整列可點擊（`onClick` on `<tr>`），操作按鈕區用 `e.stopPropagation()` 防止觸發列點擊。
點整列 = 進入查看（等同點「查看」按鈕）。

### D4: 「補件」功能 — Dialog 彈窗

點「補件」按鈕 → 彈出 Dialog：
- 上半部：上傳附件區（drag & drop + 檔案選擇）
- 下半部：列出該案件缺少的必填欄位，可直接補填

補件後資料寫入 DB，頁面刷新反映更新。

替代方案：
- 跳轉到詳情頁 → 用戶可能只想快速補件，不想進入完整 Wizard

### D5: 欄位統一命名 — 「所有權人」

全站搜尋替換：
- 新增案件頁「屋主姓名（選填）」→「所有權人（選填）」
- 詳情頁「物件名稱 / 屋主」→「所有權人」
- 土地案件「物件名稱 / 地主」→「所有權人」
- 列表欄「物件名稱」→ 合併顯示（主行地址、副行所有權人）

新增「案件名稱」欄位：可選填，用戶自訂如「和平東路案」，列表新增此欄。

### D6: Wizard 步驟條件邏輯

| 步驟 | 名稱 | 條件 |
|------|------|------|
| Step 1 | 填寫基本資料 | 永遠顯示 |
| Step 2 | 拉謄本 | 需先完成 Step 1（地址必填） |
| Step 3 | 實價登錄 | 僅當用戶已購買進階實價登錄服務時顯示，否則跳過 |
| Step 4 | 預覽/匯出 | 需完成 Step 2 |

步驟導航：頂部 Stepper 元件顯示所有步驟狀態（完成/當前/待處理/跳過）。
可以點已完成的步驟回去修改。不能跳過未完成的步驟往前。

## Implementation Contract

### Wizard 元件行為
- `CaseWizard` 接收 `caseId` prop，內部管理 `currentStep` state
- 頂部渲染 Stepper（4 個步驟圓點 + 連線 + 標籤）
- 每步驟渲染對應子元件（`CaseWizardStep1` ~ `CaseWizardStep4`）
- 每步驟底部有「上一步」「下一步」按鈕（Step 1 無上一步，Step 4 下一步改為「匯出」）
- 驗證條件：Step 1 地址必填才能進 Step 2

### 資料持久化行為
- `update_case` API 新增接受 `land_registry_data` 參數
- `PullParcelDataButton` 查詢成功後顯示結果 + 「確認儲存」按鈕
- 「確認儲存」呼叫 `update_case({ land_registry_data: result })`
- `assemble-dossier-data.ts` 匯出時先讀 `case.land_registry_data`，有資料則直接用，null 時才呼叫 API（fallback）

### 列表操作行為
- 表格每列 `<tr onClick={() => router.push(/cases/${id})}>` 
- 操作欄 5 個 `<button>` 各自 `onClick` 含 `e.stopPropagation()`
- 刪除按鈕 → 彈出 `DeleteConfirmDialog`（「確定要刪除此案件？此操作無法還原。」+ 確認/取消）
- 下載按鈕 → 觸發 PDF 匯出下載

### 補件 Dialog 行為
- `CaseSupplementDialog` 接收 `caseId` + `open` + `onClose` props
- 開啟時載入案件資料，計算缺少的必填欄位
- 上傳區支援拖拽和檔案選擇（accept: `.pdf,.jpg,.png,.doc,.docx`）
- 儲存後呼叫 `update_case` 更新欄位 + 上傳附件
- 關閉時觸發列表刷新

### 接受標準
- 登入後進案件列表 → 點整列可進查看 → 5 個 SVG 按鈕可見且 hover 有 tooltip
- 進入案件詳情 → 看到 Wizard Stepper，Step 1 填資料 → Step 2 拉謄本 → 確認儲存 → 資料寫入 DB
- 匯出 PDF → 讀 DB 的 land_registry_data，內容與拉謄本結果一致
- 刪除案件 → 彈出確認框 → 確認後刪除 → 列表更新
- 所有頁面「屋主」「物件名稱/屋主」已替換為「所有權人」

### 範圍界限
- **In scope**: 案件詳情 Wizard UI、資料管線修復、列表操作欄、補件功能、欄位命名統一
- **Out of scope**: 設定頁、sidebar 結構、實價登錄 API 實際串接（Step 3 僅 UI 框架）、PDF 模板修改

## Risks / Trade-offs

- [Wizard 步驟狀態管理] 全靠 React state，瀏覽器 F5 重整會回到 Step 1 → 緩解：每次切步驟自動儲存當前步驟到 case 資料（`current_step` 欄位），重整後恢復
- [mock-backend 擴充] 目前 mock-backend 是記憶體陣列，刷新就丟 → 這是已知限制，正式版用 SQLite 解決，dev 模式接受此行為
- [補件功能 — 附件儲存] 瀏覽器 dev 模式下無法真正存檔案到磁碟 → mock 附件上傳（存 metadata + base64 preview），正式版用 Tauri fs API
- [列表效能] 案件量大時 5 個按鈕 × N 列的 DOM 節點 → 目前單店使用，案件量 < 500，不成問題

## Migration Plan

無需資料遷移。mock-backend 記憶體資料結構擴充欄位，瀏覽器重整後自動套用新結構。正式版 SQLite migration 另案處理。

## Open Questions

- Step 3 實價登錄「已購買進階服務」的判斷條件由哪個 API 或設定決定？→ 暫用 feature flag 控制
