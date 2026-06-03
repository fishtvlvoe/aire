---
name: aire-gov-api-guardrails
description: "AIRE 政府地政 API 開發護欄：CoP API 境外限制、CF Worker / GCP 部署踩坑、地政查詢收費規則"
license: MIT
compatibility: AIRE project local skills.
---

# AIRE 政府地政 API 開發護欄

## 什麼時候用這個 Skill

- 討論或實作 AIRE 地政查詢架構時
- 評估「能不能用某主機/服務代理政府 API」時
- 部署 CF Worker 或 GCP Cloud Run 時
- 處理 CoP API 認證（getToken）或收費邏輯時
- 考慮新增政府 API 來源（便民系統、實價登錄、裁判書等）時

---

## 1. 踩過的坑（實際發生，2026-06-04 實測）

### 1.1 CF Worker 部署
- CF API token 只有 R2 權限，不能 deploy Worker
  → **解法**：必須用 `wrangler login` 走 OAuth 取得完整權限
- wrangler 4.x 自動載入專案 `.env`，`.env` 內的變數會擋住 OAuth login 流程
  → **解法**：必須到「沒有 `.env` 的目錄」執行 `wrangler login`（例如 `cd /tmp && wrangler login`）
- CF Workers 免費方案不保證落點，即使付費綁 TPE 也可能被政府封 Cloudflare 整段 ASN

### 1.2 GCP Cloud Run 部署
- 新 GCP project 沒綁 billing → Cloud Run deploy 直接拒絕（R-03：付費決策需老魚確認）
- GCP source-based deploy 需要 `cloudbuild.googleapis.com` API 啟用 + SA 需要兩個角色：
  - `roles/cloudbuild.builds.builder`
  - `roles/storage.admin`
  → 新 project 預設缺這些，deploy 時才報 permission denied
- Cloud Run 的 region **必須**指定 `asia-east1`（彰化），其他 region 可能不在台灣境內

### 1.3 CoP API 認證
- `GET https://copapi.moi.gov.tw/cp/getToken`
- Header: `Authorization: Basic base64(client_id:secret)`
- 回傳 JWT，`expires_in=300`（5 分鐘）
- 憑證在 `.env`：`LAND_REGISTRY_CLIENT_ID` / `LAND_REGISTRY_CLIENT_SECRET` / `LAND_REGISTRY_TOKEN_ENDPOINT`

---

## 2. 要避的雷（架構決策）

### 2.1 政府地政 CoP API 封境外 IP
- **實測結果（2026-06-04，同一組憑證）**：
  | 來源 | 結果 |
  |------|------|
  | 台灣住宅 IP | HTTP 200（0.11s） |
  | 台灣 GCP asia-east1 資料中心 IP | HTTP 200（0.61s） |
  | 境外 Cloudflare 新加坡機房 | HTTP 522 timeout（19.7s，連續 3 次全失敗） |

- **結論**：封「境外 IP」，不封「台灣境內 IP（含資料中心）」
- 任何境外主機（CF Worker、海外 VPS、AWS ap-southeast-1）代理地政都會 522 timeout
- 台灣境內資料中心 IP 可用（GCP asia-east1 實測通過）
- **正解架構**：CF Worker 代理 license/法條/執照（無地理限制） + 台灣機房代理（GCP asia-east1）代理地政 CoP
- 此架構不依賴 opcos，與「AIRE 解綁 opcos 成獨立 SaaS」相容

### 2.2 Cloudflare TPE 節點不能賭
- 免費方案不保證落點在台北
- 即使付費，政府可能封整段 Cloudflare ASN
- **決策：不要用 CF Worker 代理地政，句號**

### 2.3 商業 VPN 不可靠
- 商業 VPN 出口多為資料中心 IP，本身不是問題
- 但 VPN 出口不保證在台灣境內，且可能隨時變更
- 不適合作為正式架構的代理出口

### 2.4 地政查詢收費規則
- **有建號 = 收費查詢**。查詢建物需打 CoP 付費 API
- 務必在打 CoP 前觸發 `pre-charge-confirmation`（spec: `openspec/specs/pre-charge-confirmation/spec.md`）
- 使用者確認後走 `paid-query-consent-and-cost`（spec: `openspec/specs/paid-query-consent-and-cost/spec.md`）
- 費用計算使用 **catalog-driven pricing**（非固定金額），缺 catalog price → 阻止查詢、不 fallback
- 實作串接點：`src/components/PreChargeConfirmDialog.tsx`

### 2.5 便民系統與 CoP 是不同系統
- 便民系統（R02/Z10Web/W10Web/ep.land.nat.gov.tw）與 CoP API（copapi.moi.gov.tw）是獨立系統
- 便民系統的境外 IP 限制狀態：**推測同樣境內限制，未實測**
- AIRE 目前用 R02 做地址 → 地號/建號解析（本機 = 台灣 IP，不受影響）

---

## 3. 開發流程上犯過的錯（提醒未來不要重蹈）

### 3.1 Design baseline 寫錯
- design 的「現況 baseline」誤寫成「Tauri 桌面 App」
- 實際現況是 browser-local-runtime（Node + better-sqlite3）
- **教訓**：寫 design 前必先用工具（grep、讀 config、讀 PARKED.md）確認真實現況，不靠記憶

### 3.2 Spectra 目錄結構放成扁平
- spec 檔直接放 `openspec/specs/<name>/spec.md` 的子目錄結構
- 放成扁平 `openspec/specs/<name>.md` 會導致 `spectra analyze` 全盲
- **教訓**：嚴格遵循 Spectra 既有目錄結構

### 3.3 Tasks 用過時的 Tool 標記
- 用了 `[Tool: kimi]`（kimi CLI 已停用）
- **正確做法**：應為 `[Tool: sonnet]` 子代理

### 3.4 Spike 時撞權限牆反覆單點重試
- 撞 CF API token 權限 → 換 wrangler login → 撞 .env 干擾 → 再試 → 撞 GCP billing → 再試
- 每次只處理一個錯誤，累計浪費大量時間
- **教訓**：
  1. 開始前列出所有前置權限需求（API token scope、billing、SA roles）
  2. Batch 處理：一次確認所有權限，而非逐個撞牆
  3. 撞 2-3 次就停下，換策略（例如列清單請老魚一次處理）

---

## 4. 快速參考

### CoP API 端點

| API | 用途 | 付費 |
|-----|------|------|
| `LandDescription` | 土地標示部 | 是 |
| `LandOwnership` | 土地所有權部 | 是 |
| `LandOtherRights` | 土地他項權利部 | 是 |
| `BuildingDescription` | 建物標示部 | 是 |
| `BuildingOwnership` | 建物所有權部 | 是 |
| `LandQuerySec` | 地段代碼查詢 | 否 |
| `MOI_API_012` | 免費代碼查詢（不同 base URL: `openapi.moi.gov.tw`） | 否 |

### 參數格式
- unit: 2 碼
- sec: 4 碼
- no: 8 碼
- CITY: 1 碼
- 完整規格見 `docs/cop-api/api-format-reference.md`

### 地政查詢兩條路徑
- **土地**：地段 → 地號 → 坪數（CoP: `LandDescription` + `LandQuerySec`）
- **建物**：建號 → 建物基本資料（CoP: `BuildingDescription`）→ ⚠️ 收費

### 架構圖
```
瀏覽器
  ├─► CF Worker (aire.opcos.me) ──► license / 法條 / 執照
  └─► 台灣機房代理 (GCP asia-east1) ──► copapi.moi.gov.tw 地政
```
