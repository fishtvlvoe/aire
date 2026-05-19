## 1. StorageAdapter 基礎建設

- [x] 1.1 依設計文件「持久化抽象：Repository Pattern（StorageAdapter）」建立 `StorageAdapter` TypeScript 介面（**StorageAdapter 介面（橫切所有 Bug）**），定義 `getBranding`, `saveBranding`, `getCaseDisclosures`, `saveCaseDisclosures`, `getKeyinData`, `saveKeyinData`, `getAppSettings`, `saveAppSettings` 及對應型別（`BrandingData`, `DisclosureData`, `KeyinData`, `AppSettings`）。行為：引入後可用 `storage.getBranding()` 呼叫而不報 TypeScript 型別錯誤。驗收：`tsc --noEmit` 無型別錯誤；介面位於 `src/lib/storage/StorageAdapter.ts`。
- [x] 1.2 建立 `MockStorageAdapter`，實作 `StorageAdapter` 介面，讀寫 `localStorage['aire-mock-store']`。初始化時若 `branding`、`disclosures`、`keyin_data` 三個 key 缺失，補齊為 null/\{\}（**Mock store initializes all required data keys** requirement；同時滿足 **Mock Dispatch in Browser Development Environment** 所需的完整 mock store 結構）。行為：`new MockStorageAdapter().saveBranding(data)` 後 `JSON.parse(localStorage['aire-mock-store']).branding` 與 data 相符。驗收：手動在 browser console 執行 `new MockStorageAdapter().saveBranding({ agentName: 'test', companyName: 'co', agentCertNo: 'A1' })` 後檢查 localStorage；`tsc --noEmit` 無錯。
- [x] 1.3 建立 `src/lib/storage/index.ts`，export `const storage: StorageAdapter`，依 `typeof window !== 'undefined' && (window as any).__TAURI__` 自動選擇 `TauriStorageAdapter`（尚未實作，用 `throw new Error('TauriStorageAdapter not implemented')` 佔位）或 `MockStorageAdapter`。驗收：dev 環境 `import { storage } from '@/lib/storage'` 取得 `MockStorageAdapter` 實例；`typeof storage.getBranding` 為 `'function'`。

## 2. 持久化 Bug 修復

- [x] [P] 2.1 **Brand text fields stored and retrievable（Bug#5）** — 實作「Branding 持久化（Bug#5）」合約：修改品牌設定頁（`branding-content.tsx` 或對應路徑）的 mount 邏輯，改呼叫 `storage.getBranding()` 取值並預填 7 個輸入欄；儲存按鈕改呼叫 `storage.saveBranding(data)`。同時確保「品牌設定 page renders brand text form」規格：7 個 labelled text inputs 於 mount 時預填、成功儲存後顯示 toast。行為：填入公司名稱「大安不動產」儲存後 reload，欄位顯示「大安不動產」。驗收：`localStorage['aire-mock-store'].branding.companyName === '大安不動產'`；reload 後 company_name input 非空（Chrome MCP 截圖驗收）。
- [x] [P] 2.2 **Building survey data persistence（Bug#4）** — 實作「揭露資料持久化（Bug#4）」合約：修改現況調查 tab（`DisclosureConditionTab.tsx` 或對應路徑），勾選 checkbox 時呼叫 `storage.saveCaseDisclosures(caseId, updatedData)`；mount 時呼叫 `storage.getCaseDisclosures(caseId)` 預填。行為：勾選 conditionLeakage 後 reload，checkbox 仍勾選。驗收：`localStorage['aire-mock-store'].disclosures[caseId].conditionLeakage === true`；reload 後 checkbox 為 checked（Chrome MCP 截圖驗收）。
- [x] [P] 2.3 **Key-in autosave writes to persistent storage（Bug NEW-2）** — 實作「Key-in Autosave（Bug NEW-2）」合約：修改 autosave hook（`useKeyinAutosave.ts` 或對應路徑），debounce 觸發後呼叫 `storage.saveKeyinData(caseId, data)`；`saveKeyinData` resolve 後才更新 indicator 時間戳；mount 時呼叫 `storage.getKeyinData(caseId)` 還原欄位值。行為：輸入後等 debounce → `aire-mock-store.keyin_data[caseId]` 有值；reload 後欄位有值。驗收：Chrome MCP 截圖 localStorage 驗證；`saveKeyinData` 被呼叫時 indicator 顯示時間戳。
- [x] [P] 2.4 **Draft restore toast only when draft exists（Bug NEW-2 extension）**：修改 Key-in 頁面 mount 邏輯，只在 `storage.getKeyinData(caseId)` 回傳非 null 時顯示「已還原上次未儲存的草稿」toast。行為：無 keyin_data 時不出現 toast；有 keyin_data 時 toast 出現一次。驗收：清空 `aire-mock-store.keyin_data` 後 reload → toast 不出現（Chrome MCP 截圖）。

## 3. UI 驗證 Bug 修復

- [x] [P] 3.1 **Mandatory consent before data pull（Bug#3）** — 實作「Dialog 紅框驗證（Bug#3）」合約：修改 `OwnerAuthorizationDialog`（或對應路徑），confirm button 預設啟用（不 disabled）；點擊 confirm 時若 checkbox unchecked，套用 `border border-red-500` 到 checkbox wrapper 並顯示錯誤文字「請先勾選授權同意」；勾選後清除錯誤狀態。行為：未勾選點確認 → 紅框出現；勾選後紅框消失。驗收：Chrome MCP 截圖 + DOM 確認 `border-red-500` class 存在；勾選後 class 消失。
- [x] [P] 3.2 **Land API credentials input and save toast（Bug#7）** — 實作「地政 API 設定 Toast（Bug#7）」合約：確認/修復 `LandApiSection.tsx`（或對應路徑）儲存按鈕的 onClick handler，`save_land_api_settings` 呼叫後顯示 toast，toast 文字含「儲存成功」或「地政 API 設定已儲存」。行為：按儲存 → toast 元件在 2 秒內出現。驗收：Chrome MCP 截圖 toast；檢查 `LandApiSection` 不存在無 toast 的靜默儲存路徑。

## 4. API 整合 Bug 修復

- [x] 4.1 **Test connection verifies credentials via real HTTP call（Bug NEW-4）** — 實作「地政 API 測試連線：雙路 Proxy 模式」設計及「地政 API 測試連線（Bug NEW-4）」合約：建立 `src/app/api/land-api/test-connection/route.ts`（Next.js App Router API Route），接受 `POST { clientId, secret }`，proxy 呼叫 cop.land.moi.gov.tw 認證 API，8 秒逾時，回傳 `{ success: boolean, latency_ms: number, error?: string }`。假 credentials（非空但無效）→ `{ success: false, error: "認證失敗" }`。行為：`curl -X POST localhost:3000/api/land-api/test-connection -d '{"clientId":"FAKE","secret":"FAKE"}'` 回傳 `{ success: false, ... }`。驗收：curl 測試；不存在純 client-side 假成功邏輯。
- [x] 4.2 **Test connection UI calls real HTTP（Bug NEW-4 frontend）**：修改 `LandApiSection.tsx` 的「測試連線」按鈕，移除任何 client-side mock 假成功邏輯，改呼叫 `fetch('/api/land-api/test-connection', { method: 'POST', body: ... })`；依回傳 `success` 顯示成功或失敗 toast。行為：點「測試連線」→ Network 面板有 POST 請求到 `/api/land-api/test-connection`；假 credentials → 失敗 toast。驗收：Chrome MCP Network 面板截圖確認 HTTP request 存在；輸入 QA-TEST-CLIENT/QA-TEST-SECRET → toast 顯示失敗。
- [x] 4.3 **License activation calls backend API（Bug#6）** — 實作「授權序號啟用：前端改呼叫 OPCOS Backend」設計及「授權序號 API 驗證（Bug#6）」合約：修改 activation page（`src/app/activation/page.tsx` 或對應路徑），移除 client-side 序號字串比對邏輯（刪除含 `AIRE-TEST` 或類似硬編碼字串的條件判斷），改呼叫 `fetch('/api/v1/licenses/activate', { method: 'POST', body: { serialKey, deviceId } })`；HTTP 200 → 成功 toast + 導向 dashboard；HTTP 4xx → 錯誤 toast「序號無效，請確認後重試」。行為：輸入序號後 Network 面板有 POST 請求。驗收：Chrome MCP Network 面板確認 POST 存在；grep `src/app/activation/` 不含 `AIRE-TEST` 或類似 client-side 比對字串。

## 5. 整合驗收

- [x] 5.1 Chrome MCP 自動化驗收：依序執行 Bug#3（dialog 紅框）、Bug#4（揭露資料持久化）、Bug#5（品牌設定持久化）、Bug NEW-2（autosave 持久化 + 無 draft 無 toast）共 5 個場景，截圖存 `.artifacts/fix-qa-bugs/` 目錄。驗收：每個場景截圖顯示預期狀態（紅框/欄位有值/toast 出現或不出現）。
- [x] 5.2 Chrome MCP 自動化驗收：依序執行 Bug#6（Network 面板有 POST 到 licenses/activate）、Bug#7（地政 API toast）、Bug NEW-4（測試連線 Network 請求 + 假 credentials 失敗 toast）共 3 個場景，截圖存 `.artifacts/fix-qa-bugs/`。驗收：Network 面板截圖及 toast 截圖。
- [x] 5.3 執行 `npm run build`，確認 0 型別錯誤 0 build 錯誤。驗收：build 輸出含 `Route (app)` 清單且無 Error。
- [x] 5.4 `git add -A && git commit -m "fix: 修復 QA 驗收發現的 7 個 bug（StorageAdapter + API 整合）"` 並 `git push`。驗收：`git log --oneline -1` 顯示本次 commit；`git status` 為 clean。
