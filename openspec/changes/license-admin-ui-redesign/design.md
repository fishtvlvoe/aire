## Context

目前序號管理後台（雲端 Vercel 部署）的表格只顯示序號、狀態、Email、建立日期，缺少客戶姓名與公司名稱，不便管理。客戶端 Electron 桌面 App 的首次安裝流程缺少建立管理員帳號步驟，客戶啟用序號後直接跳到登入頁卻無帳號可登。Codex CLI 若未安裝會導致 LLM 功能全面失效。序號啟用無機器綁定，一個 key 可在多台電腦使用。

相關方（Stakeholders）：
- Fish（總管理員）：透過雲端後台管理所有客戶的序號
- 客戶老闆（admin）：在本機 Electron App 管理底下業務帳號
- 房仲業務（agent）：在本機 Electron App 使用系統

## Goals / Non-Goals

**Goals:**

- 序號管理表格符合實際管理需求（編號、姓名、公司、操作 Tooltip）
- 支援使用者資料 Inline Edit 與序號轉讓流程
- 首次安裝流程完整可走通（License → 建管理員 → Codex）
- machineId 綁定防止序號盜用
- Electron 殼 mac/win 打包正常

**Non-Goals:**

- 不做多團隊/分組權限
- 不做 OAuth/SSO
- 不做 Linux build
- 不做序號自助申請
- 不做業務密碼自助修改

## Decisions

### D1: 表格欄位與排序

五欄順序：編號（流水號）→ 序號 (Key) → 狀態（badge）→ 使用者（三行：姓名/公司/Email）→ 操作（Tooltip icon buttons）。

編號為前端計算的流水號（基於 list API 回傳順序），不存入 Vercel KV。搜尋結果同樣顯示編號。

**Alternatives Considered:**
- 編號存入 KV → 否決，因為刪除/新增會導致編號不連續需重新排序，增加複雜度
- 保留建立日期欄 → 否決，Fish 確認不需要

### D2: 使用者資料 Inline Edit

使用者欄位（姓名、公司、Email）點擊後切換為 input 欄位，blur 或 Enter 觸發 `PATCH /api/license/update-info`。若修改 Email，後端同步更新 Vercel KV 的 `email-index`（移除舊索引、建新索引）。

API 合約：
```
PATCH /api/license/update-info
Header: Authorization: Bearer <LICENSE_ADMIN_TOKEN>
Body: { key: string, contactName?: string, company?: string, email?: string }
Response 200: { success: true, license: LicenseObject }
Response 401: { error: "未授權" }
Response 404: { error: "序號不存在" }
```

**Alternatives Considered:**
- 獨立編輯彈窗（Modal） → 否決，Inline Edit 操作更直覺，減少點擊次數
- 批量編輯 → 否決，管理序號量不大（<100），逐筆編輯足夠

### D3: 序號轉讓（Transfer）

停用舊序號 + 核發新序號包在同一 API call，確保原子性。舊序號 status 改為 revoked + 記錄 reason；新序號 status 為 issued + 帶入新公司/姓名資料。前端用確認 Dialog：顯示舊序號資訊 + 輸入新公司/姓名/Email → 確認後一次送出。

API 合約：
```
POST /api/license/transfer
Header: Authorization: Bearer <LICENSE_ADMIN_TOKEN>
Body: { oldKey: string, reason: string, newCompany?: string, newContactName?: string, newEmail?: string }
Response 200: { success: true, revokedKey: string, newKey: string, newLicense: LicenseObject }
Response 401: { error: "未授權" }
Response 404: { error: "舊序號不存在" }
Response 400: { error: "舊序號已停用" }
```

**Alternatives Considered:**
- 分兩步 API（先 revoke 再 create） → 否決，中間失敗會造成客戶無序號可用
- 直接修改舊序號的公司資料（不換序號） → 保留為 update-info 功能，transfer 用於需要換序號的場景

### D4: machineId 綁定

使用 `node-machine-id` 套件取得機器唯一識別碼（基於 macOS IOPlatformUUID / Windows MachineGuid）。啟用序號時將 machineId 的 SHA-256 hash 存入 Vercel KV 的 `license:<key>.machineId`。後續每次 verify 時比對 machineId，不符則拒絕。

換機流程：客戶聯繫 Fish → Fish 在後台清除該序號的 machineId → 客戶在新機器重新啟用。

API 變更：
- `POST /api/license/activate` 新增 body 欄位 `machineId: string`
- `GET /api/license/verify` 新增 query 欄位 `machineId: string`
- 後台新增「解綁機器」操作按鈕

**Alternatives Considered:**
- 自製硬體指紋（hostname + username + disk serial） → 否決，跨平台取硬碟序號不穩定，node-machine-id 已封裝好
- 不綁定 machineId → 否決，Fish 明確要求防止序號盜用

### D5: 首位管理員建立（First Admin Setup）

Setup wizard 從兩步改為三步：
1. `/setup`（License 啟用）→ 成功後
2. `/setup/admin`（建立首位管理員）→ 成功後
3. `/setup/codex`（Codex API Key）→ 完成進入系統

`/setup/admin` 頁面：輸入 Email、顯示名稱、密碼（至少 6 字元）。提交 `POST /api/setup/create-first-admin`，後端檢查 users 表為空才允許執行，建立 role=admin 的帳號。

API 合約：
```
POST /api/setup/create-first-admin
Body: { email: string, displayName: string, password: string }
Response 201: { success: true, user: { id, email, displayName, role } }
Response 409: { error: "管理員帳號已存在" }
Response 400: { error: "密碼至少 6 字元" }
```

Middleware 重導向邏輯調整：License 有效 + users 表為空 → 重導到 `/setup/admin`。

**Alternatives Considered:**
- 合併到 License 啟用同一頁 → 否決，步驟太多擠在一頁會混亂
- 保留 CLI create-admin → 否決，客戶不會用終端機

### D6: Codex CLI 偵測

Electron launcher 啟動 Next.js server 前，先執行 `which codex` 偵測 CLI 是否存在。不存在則顯示引導畫面（splash 頁面替換為安裝指引），包含：
- Codex CLI 安裝指令（`npm install -g @openai/codex`）
- `codex login` OAuth 登入提示
- 「重新偵測」按鈕（重新執行 which codex）

偵測結果透過 Electron IPC 傳給 renderer。

**Alternatives Considered:**
- 在 Next.js 頁面內偵測 → 否決，Next.js 跑在瀏覽器環境無法執行 shell 指令
- 自動安裝 Codex CLI → 否決，需要 npm 全域權限，可能需要 sudo，不應自動執行

### D7: Vercel KV Schema 擴充

現有 `license:<key>` 物件新增兩個欄位：

```
license:<key> = {
  ...existing fields,
  contactName: string,   // 客戶姓名（新增）
  company: string,       // 公司名稱（新增）
}
```

向下相容：舊序號沒有這兩欄 → API 回傳時預設為空字串，前端顯示「—」。

`GET /api/license/list` 回傳格式擴充：
```json
{
  "licenses": [
    {
      "index": 1,
      "key": "ABCD-1234-EFGH-5678",
      "status": "activated",
      "contactName": "王大明",
      "company": "大明不動產有限公司",
      "email": "fish@example.com",
      "machineId": "a1b2c3...",
      "createdAt": "2024-05-01T00:00:00+08:00",
      ...
    }
  ],
  "total": 8,
  "page": 1,
  "pageSize": 20
}
```

搜尋：`?search=王大明` 對 index、key、contactName、company、email 全欄位模糊比對。

**Alternatives Considered:**
- 獨立 contacts 表（SQLite） → 否決，序號資料全在 Vercel KV，拆到另一處增加同步複雜度
- 不擴充 schema、前端手動對應 → 否決，資料應集中存放

## Risks / Trade-offs

- [node-machine-id 在 VM/Container 環境可能回傳相同 ID] → 目前客戶都是實體電腦安裝，VM 場景不在 scope 內
- [Vercel KV 舊序號缺少 contactName/company] → API 層做向下相容，回傳空字串，前端顯示「—」
- [transfer API 非真正的 DB transaction] → Vercel KV 無 transaction 支援，先 revoke 再 create，若 create 失敗則手動 restore 舊序號 status
- [Codex CLI 偵測依賴 PATH 環境變數] → 若客戶用 nvm 或自訂 PATH，which codex 可能找不到；引導頁面提供手動輸入 codex 路徑的選項
- [首位管理員 API 只檢查 users 表為空] → 極端情況：兩個人同時開 setup 可能建兩個 admin；機率極低（單機軟體），不做 lock

## Migration Plan

1. 部署 License Server API 變更（Vercel）：新增 update-info、transfer 端點；擴充 list 回傳
2. 部署前端後台 UI 變更（Vercel）
3. 更新 Electron 殼代碼：加入 machineId 綁定、Codex CLI 偵測、setup/admin 頁面
4. 重新打包 Electron App（mac DMG + win NSIS）
5. 測試完整流程：安裝 → 序號啟用（含 machineId）→ 建管理員 → Codex 設定 → 登入使用

回滾策略：API 新增端點為獨立路由，不影響現有功能；KV schema 擴充為新增欄位，向下相容；前端 UI 可獨立回滾至舊版

## Open Questions

無
