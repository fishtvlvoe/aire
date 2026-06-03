# Design

## Baseline：本 change 的真實起點是 browser-local-runtime，不是 Tauri

> ⚠️ 修正記錄：本 design 初版誤把現況寫成「Tauri 桌面 App」。實際現況見下。

AIRE 自 **2026-05-28** 起已脫離 Tauri，採用 **browser-local-runtime** 模式（見 `src-tauri/PARKED.md` 與既有能力 `browser-local-runtime`）：

| 面向 | 現況（browser-local-runtime，已上線） |
|-----|------|
| 交付 | Next.js `standalone` build → `.next/standalone/server.js` |
| 執行 | 本機 Node runtime 在 `127.0.0.1` 啟動 Next server |
| UI | 使用者用系統預設瀏覽器開啟 |
| 資料庫 | **better-sqlite3**（Node 原生綁定），非 rusqlite |
| 檔案 | Node `fs`（本機檔案系統） |
| 外部 API | Node 端呼叫（client_id/secret 留在本機 server） |
| Tauri | `src-tauri/` 程式碼保留但 **PARKED**，build 在現設定下會失敗 |

`next.config.ts` 的 `output` 現況是 `"standalone"`。**任何把它改回 `"export"` 的指令都會破壞現有上線版本**（PARKED.md 明文警告）。

### 本 change 的真實目標（純瀏覽器 SPA，零本機 runtime）

從 browser-local-runtime **再進一步**：連本機 Node 啟動器都不要。

```
browser-local-runtime（現況）        aire-browser-local-first（本目標）
本機 Node server @127.0.0.1   ──►    純瀏覽器 SPA（無本機 runtime）
better-sqlite3（Node）        ──►    wa-sqlite + OPFS（瀏覽器沙盒）
Node fs                       ──►    OPFS + File System Access API
Node 代理外部 API             ──►    CF Worker gateway 代理外部 API
本機 server 持有憑證          ──►    CF Worker env var 持有憑證
```

**這才是它存在的理由**：browser-local-runtime 仍需要一個本機啟動器（Windows 上仍可能要簽名）；純瀏覽器版**連啟動器都沒有** = Windows 連簽名稅都歸零 = 真正零安裝交付通道。

### 三條交付通道並存（非互斥）

本 change 不取代任何既有通道，是新增光譜的最末端：

| 通道 | 能力 | 客群 | 簽名需求 |
|-----|------|------|---------|
| 企業簽名版 | `windows-enterprise-managed-signing-delivery` | 企業受管端點 | 企業內 CA 簽署 |
| Node 本地版 | `browser-local-runtime`（現況） | 一般用戶、要本機資料 | 啟動器需簽名 |
| **純瀏覽器版** | **`aire-browser-local-first`（本 change）** | 自帶電腦、零安裝 | **無**（瀏覽器原生） |

---

## Decision

### 1. 以純瀏覽器 SPA 取代「本機 Node runtime」作為新交付通道

AIRE 的前端是 Next.js（React），與瀏覽器 100% 兼容。從 browser-local-runtime 走向純瀏覽器，要搬離瀏覽器的不是 UI，而是目前**跑在本機 Node runtime** 上的四個後端能力：

1. SQLite 資料庫（現況 `better-sqlite3`）
2. 欄位加密（現況 Node 端加密 + 本機金鑰）
3. 檔案系統讀寫（現況 Node `fs`：PDF 產出、case assets）
4. 外部 API 呼叫（地政系統、法條同步、授權驗證）

前三項在現代瀏覽器都有對應技術：

| 能力 | 現況（Node runtime） | 瀏覽器替代 |
|-----|---------------------|----------|
| SQLite | `better-sqlite3` | `wa-sqlite`（SQLite WASM，支援 WAL + FTS5） |
| 加密 | Node crypto + 本機金鑰 | Web Crypto API（AES-GCM）+ IndexedDB 存金鑰 |
| 檔案 | Node `fs` | OPFS（Origin Private File System）+ File System Access API |
| HTTP | Node fetch（server 端） | `fetch()`（瀏覽器原生） |

第四項（外部 API）原本由本機 Node server 代理，純瀏覽器版改由 Cloudflare Worker 代理，詳見 Decision 2。

**SQL 資產可沿用**：現有 migrations（`src-tauri/migrations/` 對應的 schema）為標準 SQLite，`wa-sqlite` 與 `better-sqlite3` 走同一套 SQL，schema 與多數 query 可直接沿用。

**Alternatives Considered：**

- **Alt A：繼續本機交付（Node 啟動器 / Tauri），購買 EV 證書**
  - 否決原因：EV 證書年費 $300-800 + Apple Developer $99，且每年續約。這是持續性成本，不符合產品現階段的現金流規劃。OV 證書無法保證消除 SmartScreen。本機啟動器只要存在就有簽名稅。

- **Alt B：Tauri + 線上更新（WebView 載入遠端 URL）**
  - 否決原因：安裝包本身仍需簽名才能通過 SmartScreen。沒有解決根本問題。且 Tauri 已 PARKED。

- **Alt C：PWA + 極小本地橋接程式**
  - 否決原因：用戶仍需下載並執行一個本地程式（即使很小），在 Windows 上仍可能觸發 SmartScreen。複雜度高於純瀏覽器方案，收益不明顯。

- **Alt D：維持 browser-local-runtime，不做純瀏覽器版**
  - 否決原因：browser-local-runtime 仍需本機 Node 啟動器，Windows 簽名稅仍在。純瀏覽器版是唯一能讓簽名成本歸零的通道。

### 2. 以 Cloudflare Worker 作為 API 代理閘道

瀏覽器有同源策略（CORS）限制，且地政系統 API Key（client_id/secret）絕對不能暴露在前端程式碼中。Node 本地版原本靠本機 server 持有憑證；純瀏覽器版沒有本機 server，憑證改放 CF Worker。

AIRE 已經有 `aire.opcos.me` CF Worker（處理 License activate/verify）。本次將其擴充為完整的 API 閘道：

```
瀏覽器 ──► aire.opcos.me (CF Worker) ──► 外部 API
             │
             ├── /api/license/*       → opcos.me（授權驗證）
             ├── /api/land-registry/* → copapi.moi.gov.tw（地政系統）
             ├── /api/legal-clauses/* → opcos.aiver.me（法條同步）
             └── /api/realtor/*       → opcos.me（執照驗證）
```

CF Worker 的環境變數儲存所有敏感憑證：
- `LAND_REGISTRY_CLIENT_ID`
- `LAND_REGISTRY_CLIENT_SECRET`
- `OPCOS_API_TOKEN`

瀏覽器只傳送「查詢參數」，永遠接觸不到憑證。

**Alternatives Considered：**

- **Alt A：Next.js API Routes（Vercel / 自建伺服器）**
  - 否決原因：純瀏覽器版以靜態 export 部署，Next.js `output: 'export'` 不支援 API Routes。若改用伺服器渲染，則失去「靜態托管、近乎零成本」的優勢。且 AIRE 已有 CF Worker 基礎設施，無需新增供應商。

- **Alt B：瀏覽器直接呼叫外部 API（CORS + API Key 暴露）**
  - 否決原因：地政系統 API 極高機率不支援 CORS。即使支援，將 client_id/secret 寫在前端等於公開憑證，資安不可接受。

- **Alt C：OPCOS 後端直接提供統一 API**
  - 否決原因：地政 API 是「客戶自備 Key」模式，OPCOS 後端不應該儲存或代理客戶的地政憑證。CF Worker 是 AIRE 專屬閘道，與 OPCOS 平台解耦，責任邊界清晰。

### 3. 以 wa-sqlite + OPFS 取代 better-sqlite3 + 本機檔案系統

`wa-sqlite` 是 SQLite 官方維護的 WASM 版本，支援：

- 完整 SQLite 功能（包括 WAL、foreign keys、trigger）
- OPFS 作為持久化後端（檔案存在瀏覽器沙盒，容量理論上無上限）
- 比 IndexedDB 更快的隨機讀寫（OPFS 提供類似檔案系統的 block 存取）

AIRE 現有的 SQLite schema 完全兼容標準 SQLite，`better-sqlite3` 與 `wa-sqlite` 共用同一套 SQL，migration 可以幾乎無痛移植到瀏覽器環境。

加密方案：現況 Node 本地版在 server 端加密欄位、金鑰存本機。純瀏覽器版改為「應用層加密」：
- 用戶主密碼經 argon2id（WASM 實作）derive 出 32-byte key
- 敏感欄位（cases 的屋主資訊、settings 的 API key）以 AES-GCM 加密後存入 SQLite
- 加密 key 存在 Web Crypto 的記憶體中，頁面重新整理後需重新輸入主密碼

**Alternatives Considered：**

- **Alt A：IndexedDB（原生，無需 WASM）**
  - 否決原因：AIRE 已有多個 migration 的複雜 relational schema，遷移到 IndexedDB 需要完整重寫 data layer。`wa-sqlite` 可以幾乎無痛沿用現有 SQL 與 schema。

- **Alt B：DuckDB-WASM**
  - 否決原因：DuckDB 主打分析型查詢（OLAP），AIRE 是事務型應用（OLTP，大量小查詢、外鍵約束、trigger）。SQLite 更適合此場景。

- **Alt C：把 better-sqlite3 的資料庫檔搬到 OPFS 由瀏覽器讀**
  - 否決原因：better-sqlite3 是 Node 原生綁定，無法在瀏覽器執行。必須換成 WASM 版的 SQLite（wa-sqlite）。資料以「匯出 → 匯入」方式從 Node 本地版遷移至純瀏覽器版。

### 4. 以瀏覽器指紋 + LocalStorage UUID 取代硬體 Device ID（嚴格版）

Node 本地版 / Tauri 版的 Device ID 來自硬體 fingerprint（CPU + 主機板 + MAC 雜湊）。純瀏覽器版沒有本機程式可讀硬體，需要等效機制，且維持「一組序號僅綁一台裝置」的嚴格策略：

1. 首次使用時生成 `device_uuid`（crypto.randomUUID()），存入 LocalStorage
2. 收集瀏覽器指紋（canvas、fonts、WebGL、timezone、screen resolution）
3. `device_id = hash(device_uuid + browser_fingerprint)`
4. 授權綁定此 `device_id`，OPCOS 後端記錄該序號對應的唯一 device_id
5. 換瀏覽器、清除 LocalStorage、或無痕模式 = 視為新裝置，必須聯繫客服申請授權轉移

**授權轉移流程**：
- 用戶在舊裝置點擊「解除綁定」（需驗證主密碼）
- 系統呼叫 OPCOS `license/deactivate` 釋放 device_id
- 用戶在新裝置輸入相同序號，完成新 device_id 綁定
- 若舊裝置無法操作（電腦損壞），由客服後台手動釋放

**Alternatives Considered：**

- **Alt A：只用 LocalStorage UUID（無指紋）**
  - 否決原因：用戶可以手動複製 LocalStorage 到另一台電腦，輕易繞過授權。加入瀏覽器指紋提高複製難度。

- **Alt B：嚴格限制裝置數量（如最多 2 台）**
  - 否決原因：房仲業者可能在公司電腦、家用電腦、iPad 間切換。嚴格限制會造成大量客服工單。改採「單一綁定 + 自助轉移」模型。

- **Alt C：IP 鎖定（延用早期店面策略）**
  - 否決原因：早期 IP 鎖定是為了「只能在店面用」。瀏覽器版目標是「任何裝置都能用」，IP 鎖定與此目標矛盾。且用戶可能使用動態 IP、VPN、手機熱點。

### 5. 以 better-auth 取代現有簡易登入機制

> （此決策原誤植於 Migration Plan 之後，現歸位至 Decision 區。）

AIRE 現有登入為簡易 token-based，無密碼重設、無 session 管理、無多裝置登入控制。為了純瀏覽器版的長期維護與安全性，採用 better-auth（from Supastarter）作為認證基礎設施。

better-auth 在純瀏覽器版的調整：
- **保留**：Email/密碼登入、Session Cookie 管理、密碼重設流程
- **移除**：Organization/Team 外掛、Stripe Subscription 外掛、Invite-only 外掛
- **新增**：與 OPCOS License 系統整合（登入後需輸入序號完成授權）
- **儲存**：better-auth 的 User/Session/Account 資料存在瀏覽器 SQLite（透過 wa-sqlite），不是 PostgreSQL

**登入與授權的兩階段流程**：
1. **認證階段**（better-auth）：用戶輸入 email + 密碼 → better-auth 驗證 → 建立 session cookie
2. **授權階段**（OPCOS）：用戶輸入 License Key → 呼叫 OPCOS verify/activate → 綁定 device_id → 啟用完整功能

未通過授權階段的用戶只能進入「試用模式」（功能受限，案件數量上限 3 筆）。

**Alternatives Considered：**

- **Alt A：延用現有簡易 token-based 登入**
  - 否決原因：現有機制無密碼重設、無 session 過期管理、無安全性更新。長期維護成本高，且無法滿足瀏覽器版的安全需求。

- **Alt B：使用 NextAuth.js / Auth.js**
  - 否決原因：NextAuth v5 仍處於 beta，API 不穩定。better-auth 是專為框架無關設計的現代 auth 庫，支援 Edge Runtime，且 Supastarter 已有完整整合經驗可直接參考。

- **Alt C：完全自建 auth 系統**
  - 否決原因：重複造輪子，安全性難以保證（密碼雜湊、session 管理、CSRF 防護等）。better-auth 已處理所有安全細節。

## Risks / Trade-offs

- **[Risk] 瀏覽器沙盒中，用戶無法直接用 Finder/Explorer 看到 SQLite 與 PDF 檔案**
  → Mitigation：提供「匯出資料庫」、「匯出所有 PDF」功能，讓用戶主動下載到指定位置。日常使用中，資料雖不可見，但「存在用戶電腦」這個事實不變（OPFS 存在用戶 profile 目錄下）。

- **[Risk] 用戶清除瀏覽器資料會遺失所有案件**
  → Mitigation：提供「備份到指定資料夾」功能（File System Access API），鼓勵用戶定期備份。首次使用時明確提示「資料存在瀏覽器中，清除瀏覽器資料將遺失」。

- **[Risk] 從 Node 本地版（better-sqlite3）遷移既有用戶資料到純瀏覽器版（wa-sqlite）**
  → Mitigation：Node 本地版提供「匯出資料庫」（產出標準 .sqlite 或 SQL dump），純瀏覽器版首次啟動提供「匯入」。兩版 schema 相同，匯入即可。需在驗收測試涵蓋此遷移路徑。

- **[Risk] OPFS 在 Safari / iOS 支援度不如 Chrome**
  → Mitigation：開發期以 Chrome/Edge 為主要目標（台灣房仲業者幾乎都用 Windows + Chrome）。Safari 支援為 Phase 2。若 OPFS 不可用，fallback 至 IndexedDB（效能較差但功能相同）。

- **[Risk] 地政 API 透過 CF Worker 代理，增加單點延遲**
  → Mitigation：CF Worker 邊緣節點遍佈全球，台灣用戶延遲 < 50ms。地政 API 本身響應就在 1-3 秒，Worker 代理的 overhead 可忽略。

- **[Risk] CF Worker 環境變數洩漏（地政 API Key）**
  → Mitigation：CF Worker 環境變數不會傳到客戶端。Worker 程式碼本身也是部署在 Cloudflare 伺服器上，用戶無法讀取。定期輪替 API Key，並監控異常呼叫模式。

- **[Risk] wa-sqlite WASM 載入增加首次啟動時間**
  → Mitigation：SQLite WASM 檔案約 1-2MB，透過 Cloudflare CDN 快取，第二次載入從瀏覽器 cache 讀取。使用 `instantiateStreaming()` 並行編譯。目標：首次啟動 < 3 秒，後續 < 1 秒。

## Migration Plan

### 部署步驟

1. **Phase 0：CF Worker 擴充（1-2 天）**
   - 在 `cloudflare-worker/src/` 新增 `handlers/land-registry.ts`、`handlers/legal-clauses.ts`、`handlers/realtor.ts`
   - 設定 CF Worker 環境變數（LAND_REGISTRY_CLIENT_ID 等）
   - 部署至 `aire.opcos.me`，驗證各路由可用

2. **Phase 1：瀏覽器 SQLite 與加密層（3-5 天）**
   - 安裝 `wa-sqlite`，建立 `src/lib/db/browser-sqlite.ts`
   - 移植現有 migrations 至瀏覽器環境（與 better-sqlite3 共用 SQL）
   - 建立 `src/lib/crypto/browser-vault.ts`（Web Crypto + argon2id WASM）
   - 驗證：可以建立案件、讀寫資料、重開頁面後資料仍在

3. **Phase 2：資料存取層遷移（2-3 天）**
   - 盤點現有資料存取路徑：本 codebase 僅剩 6 處 `invoke(...)`（Tauri IPC 殘留），以及 browser-local-runtime 的本機 API 呼叫
   - 本地 DB：改呼叫 browser-sqlite 層
   - 本地檔案：改呼叫 OPFS 層
   - 外部 API：改 `fetch()` 至 `aire.opcos.me`
   - 驗證：full Playwright E2E 通過

4. **Phase 3：靜態輸出與部署（1 天）**
   - **不改動現有 `next.config.ts` 的 `standalone` 設定**（那是 browser-local-runtime 的生命線，改了會壞）
   - 純瀏覽器版以獨立 build profile 產出靜態 export（例如 `next build` 搭配環境變數切換 `output`，或獨立 config），與 standalone 並存
   - 部署靜態產出至 Cloudflare Pages
   - 設定自訂域名（如 `web.aire.tw`）

5. **Phase 4：授權與 Device ID（1-2 天）**
   - 實作瀏覽器指紋 + LocalStorage UUID
   - 調整 OPCOS License verify/activate API，接受瀏覽器 device_id
   - 驗證：序號啟動、過期、換瀏覽器重啟等情境

### 回滾策略

- CF Worker 擴充為「新增路由」，不影響既有 `/api/license/*` 路由。若出錯，直接移除新增 handler 即可。
- 純瀏覽器版程式碼全部在 `src/` 內新建檔案（`browser-sqlite.ts`、`browser-vault.ts`），**不改 browser-local-runtime 的 Node server 路徑、不改 standalone config**。若純瀏覽器版有致命缺陷，既有 Node 本地版完全不受影響。
- 部署至獨立域名（如 `web.aire.tw`），與 Node 本地版下載頁面並存。用戶自主選擇使用哪個通道。

## Open Questions

1. CF Worker 的免費額度（100,000 requests/day）是否足夠初期用戶量？超過後的付費方案？
2. 是否同時提供「PWA 安裝」選項（讓用戶可以「釘選到桌面」，雖然本質仍是瀏覽器）？
3. Node 本地版既有用戶的資料遷移，是否需要一鍵轉移工具，還是手動匯出/匯入即可？
