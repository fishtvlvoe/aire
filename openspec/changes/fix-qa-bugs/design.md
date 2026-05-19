## Context

當前 AIRE 開發環境使用 `localStorage['aire-mock-store']` 作為臨時持久層。QA 驗收（2026-05-19）發現 7 個 bug，根本原因分三類：

1. **持久層缺口**：mock store 缺少 `branding`、`disclosures`、`keyin_data` 鍵，導致品牌設定、揭露資料、Key-in autosave 寫入後無處存放（Bug#4、#5、NEW-2）
2. **假實作（Fake Implementation）**：地政 API 測試連線（Bug NEW-4）和 autosave 回報（Bug NEW-2）在 UI 層直接模擬成功，完全不呼叫任何 storage 或外部 API
3. **前端替代後端邏輯**：授權序號啟用（Bug#6）在 client-side 做字串比對繞過後端；地政 API 設定儲存（Bug#7）缺少 toast；拉謄本 dialog（Bug#3）未驗證 checkbox 狀態

若此次只補 mock 補丁，遷移 Tauri SQLite 時仍需全面重寫相同邏輯。解法是引入 `StorageAdapter` 介面——業務邏輯層不直接碰 localStorage 或 Tauri IPC，改由 adapter 統一抽象，dev/prod 只換實作。

## Goals / Non-Goals

**Goals:**

- 修復 7 個 QA bug（Bug#3、#4、#5、#6、#7、NEW-2、NEW-4）
- 引入 `StorageAdapter` 介面，dev（MockStorageAdapter → localStorage）和 production（TauriStorageAdapter → IPC → SQLite）共用同一組業務邏輯，遷移時只換 adapter 實作
- 地政 API 測試連線在 dev 環境透過 Next.js API Route proxy 做真實 HTTP 呼叫（繞 CORS），production 透過 Tauri IPC
- 授權序號啟用改為呼叫 OPCOS 後端 API，移除 client-side 字串比對

**Non-Goals:**

- 不實作 `TauriStorageAdapter` 及 SQLite schema（屬下一 change，本 change 只定義介面 + MockStorageAdapter）
- 不修改 Bug NEW-3（停用授權觸發 browser confirm — 屬 browser API 限制）
- 不修改地政 API 查謄本實際端點邏輯
- 不實作 OPCOS 後端序號驗證邏輯（後端已接受 AIRE-TEST-2026-ADMIN，本 change 只修前端）

## Decisions

### 持久化抽象：Repository Pattern（StorageAdapter）

業務邏輯層依賴 `StorageAdapter` 介面，而非直接碰 `localStorage` 或 `invoke()`。

**Alternatives Considered:**
1. **繼續直接用 localStorage** — 修 bug 速度最快，但遷移 Tauri 時所有讀寫邏輯需全部重寫，高風險
2. **Zustand / React Context 統一 state** — 解決 in-memory 同步問題，但 reload 後資料仍丟失，沒有解決持久化根因
3. **Repository Pattern（本選項）** — 多一層抽象，dev/prod 切換只換注入的實作，業務邏輯零改動

**Interface 定義（TypeScript）：**

```typescript
// src/lib/storage/StorageAdapter.ts
export interface StorageAdapter {
  getBranding(): Promise<BrandingData | null>
  saveBranding(data: BrandingData): Promise<void>

  getCaseDisclosures(caseId: string): Promise<DisclosureData | null>
  saveCaseDisclosures(caseId: string, data: DisclosureData): Promise<void>

  getKeyinData(caseId: string): Promise<KeyinData | null>
  saveKeyinData(caseId: string, data: KeyinData): Promise<void>

  getAppSettings(): Promise<AppSettings>
  saveAppSettings(settings: AppSettings): Promise<void>
}

export interface BrandingData {
  agentName: string
  companyName: string
  agentCertNo: string
}

export interface DisclosureData {
  conditionLeakage: boolean
  conditionRenovation: boolean
  conditionIllegalStructure: boolean
  [key: string]: boolean
}

export interface KeyinData {
  [fieldName: string]: string | boolean | number
  savedAt: string
}
```

`MockStorageAdapter`（dev）：讀寫 `aire-mock-store` JSON，補齊 `branding`、`disclosures`、`keyin_data` 三個缺失鍵。

`TauriStorageAdapter`（production，下一 change 實作）：呼叫 `invoke('tauri_command', args)` → IPC → SQLite。

環境切換：`src/lib/storage/index.ts` export `const storage: StorageAdapter`，依 `typeof window !== 'undefined' && (window as any).__TAURI__` 自動選擇實作。

### 地政 API 測試連線：雙路 Proxy 模式

dev 透過 Next.js API Route proxy 呼叫 cop.land.moi.gov.tw，繞過瀏覽器 CORS 限制；production 透過 Tauri IPC（Rust reqwest，下一 change 實作）。

**Alternatives Considered:**
1. **僅驗證 credentials 格式非空** — 假成功問題沒根本解，違背「真實連線」需求
2. **全走 Next.js API Route（含 production）** — 要求 Next.js server 在線，不符桌面 App 離線架構
3. **雙路模式（本選項）** — dev 真實 HTTP 呼叫，production 透過 Tauri IPC；業務邏輯層（呼叫點）不感知差異

**Next.js API Route 合約：**
- Path: `POST /api/land-api/test-connection`
- Request body: `{ clientId: string; secret: string }`
- Response: `{ success: boolean; latency_ms: number; error?: string }`
- 逾時：8 秒；假 credentials → 回傳 `{ success: false, error: "認證失敗" }`
- 真實端點：cop.land.moi.gov.tw 認證 API（依現有客戶 API 文件）

### 授權序號啟用：前端改呼叫 OPCOS Backend

移除 client-side 字串比對，改為 `fetch` 呼叫 OPCOS API。

**Alternatives Considered:**
1. **維持 client-side 比對** — Bug#6 根因，完全不安全，序號可被逆向
2. **Tauri IPC → Rust HTTP 呼叫** — 更安全（不暴露 endpoint），但 dev 環境無 Tauri；開發複雜度高
3. **前端直接呼叫 OPCOS API（本選項）** — 與 dev/prod 兩環境相容；後端可加 IP 驗證與 rate limit 補強安全

**API 合約：**
- Endpoint: `POST /api/v1/licenses/activate`（OPCOS 後端）
- Request body: `{ serialKey: string; deviceId: string }`
- 成功：HTTP 200 → toast「序號啟用成功」
- 失敗：HTTP 4xx → toast「序號無效，請確認後重試」

## Implementation Contract

### StorageAdapter 介面（橫切所有 Bug）
- **行為**：所有持久化讀寫透過 `storage` singleton；dev 環境用 `MockStorageAdapter`；production 用 `TauriStorageAdapter`
- **入口點**：`src/lib/storage/index.ts`（export `storage`）；`src/lib/storage/MockStorageAdapter.ts`；`src/lib/storage/StorageAdapter.ts`（介面）
- **驗收條件**：`typeof storage.getBranding === 'function'`；`MockStorageAdapter` 讀寫 `localStorage['aire-mock-store']`；引入 `TauriStorageAdapter` 時不需改業務邏輯

### Branding 持久化（Bug#5）
- **行為**：品牌設定頁（`/settings` 或 `/settings/branding`）儲存 agent_name / company_name / agent_cert_no → reload 後欄位顯示已存值
- **資料鍵**：`aire-mock-store.branding: BrandingData`
- **失敗模式**：儲存失敗 → toast「儲存失敗，請重試」；欄位值不清空
- **驗收條件**：`JSON.parse(localStorage['aire-mock-store']).branding` 有值；reload 後欄位非空

### 揭露資料持久化（Bug#4）
- **行為**：案件詳情頁「現況」tab 勾選漏水滲水等選項 → 離開再回來選項仍勾選
- **資料鍵**：`aire-mock-store.disclosures[caseId]: DisclosureData`
- **驗收條件**：勾選後 `disclosures[caseId].conditionLeakage === true`；重新渲染後 checkbox 為勾選狀態

### Key-in Autosave（Bug NEW-2）
- **行為**：Key-in 頁輸入欄位 debounce 後自動儲存 → indicator 顯示「已於 HH:mm 儲存」→ reload 後欄位還原已存值；`aire-mock-store` 無 `keyin_data[caseId]` 時不顯示「已還原上次未儲存的草稿」toast
- **資料鍵**：`aire-mock-store.keyin_data[caseId]: KeyinData`
- **失敗模式**：`storage.saveKeyinData` 拋出錯誤 → indicator 顯示「自動儲存失敗」
- **驗收條件**：輸入後 `keyin_data[caseId]` 有值；reload 後欄位有值；無草稿時無還原 toast

### Dialog 紅框驗證（Bug#3）
- **行為**：拉謄本 dialog 點「確認」但未勾 checkbox → checkbox wrapper 加 `border border-red-500` class + 顯示「請先勾選授權同意」文字；不送出
- **失敗模式**：checkbox `checked === false` 時阻止 `onConfirm` 呼叫
- **驗收條件**：未勾時點確認 → DOM 含 `border-red-500` class；勾選後紅框消失；已勾時可正常送出

### 地政 API 設定 Toast（Bug#7）
- **行為**：地政 API 設定頁按「儲存」→ toast 出現，文字含「儲存成功」
- **驗收條件**：按儲存 → toast 元件渲染且文字符合

### 地政 API 測試連線（Bug NEW-4）
- **行為**：假 credentials（QA-TEST-CLIENT / QA-TEST-SECRET）→ 連線失敗 toast；真實 credentials → 成功 toast + 延遲 ms
- **Interface**：前端 `fetch('POST /api/land-api/test-connection', { clientId, secret })`；回傳 `{ success, latency_ms, error? }`
- **失敗模式**：HTTP 錯誤或 timeout → `{ success: false, error: "連線逾時" }`
- **驗收條件**：假 credentials → 失敗 toast；Network 面板有真實 HTTP request 打出；無純 client-side 假成功路徑

### 授權序號 API 驗證（Bug#6）
- **行為**：輸入序號 → 點啟用 → Network 面板出現 POST 請求 → 後端驗證 → 啟用成功/失敗 toast
- **Interface**：`fetch('POST /api/v1/licenses/activate', { serialKey, deviceId })`
- **失敗模式**：後端 4xx → toast「序號無效，請確認後重試」
- **驗收條件**：Network 面板有實際 POST 請求；`src` 中不存在 `AIRE-TEST` 等硬編碼序號比對邏輯

## Risks / Trade-offs

- [Risk] cop.land.moi.gov.tw 認證端點有速率限制或 TLS 問題 → Mitigation：dev API route 加 8s 逾時，回傳 timeout error；不假裝成功
- [Risk] OPCOS 後端 `/api/v1/licenses/activate` 端點尚未建立 → Mitigation：本 change 只修前端呼叫；後端建端點（接受 AIRE-TEST-2026-ADMIN）為前置條件，記入 tasks.md 驗收步驟
- [Risk] MockStorageAdapter 使用 localStorage（5MB quota），大型案件 JSON 可能超限 → Mitigation：keyin_data 只存欄位值，不存 render 狀態；超限時顯示 toast 提醒；production Tauri SQLite 無此限制
- [Risk] dev 環境多 tab 同時開啟造成 localStorage race condition → Mitigation：production 只有 Tauri 單一 window，race condition 不存在；dev 環境可接受，不在此 change 解決

## Migration Plan

1. 建立 `src/lib/storage/` 目錄（`StorageAdapter.ts` 介面、`MockStorageAdapter.ts` 實作、`index.ts` 注入入口）
2. 依序修改 7 個 bug 對應的 component / hook，改為依賴 `storage` singleton
3. 建立 `src/app/api/land-api/test-connection/route.ts`（Next.js API Route）
4. 前端測試連線改呼叫 `/api/land-api/test-connection`
5. 授權序號啟用改呼叫 OPCOS backend（`/api/v1/licenses/activate`）
6. 各 bug 驗收（Chrome MCP 自動化）
7. `git commit` + `git push`

**無資料庫遷移需求**（此 change 不修改 SQLite schema；`TauriStorageAdapter` 實作留待下一 change）

**回滾策略**：`git revert` 對應 commit；localStorage mock store 結構向後相容（新增 key 不影響舊資料讀取）

## Open Questions

- OPCOS 後端 `/api/v1/licenses/activate` 端點正式路徑是否已確認？→ 本 change tasks.md 以此路徑為準；若路徑不同，只需改 fetch URL
- cop.land.moi.gov.tw 認證端點的正式請求格式？→ 依現有客戶 API 文件；若 API route 呼叫失敗需確認 endpoint 路徑
