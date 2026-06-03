# Tasks

> 派工校正（routing 硬規則）：原 `[Tool: kimi]` / `[Tool: kimi MCP]` 標記中的 kimi CLI 已停用，全數改派 Sonnet 子代理（`[Tool: sonnet]`）。Group 9 Review 改為 Sonnet 並行多角度 CR。
> Baseline 校正：本 change 的起點是 browser-local-runtime（Node + better-sqlite3），不是 Tauri。詳見 design.md「Baseline」段。

## Design Decision ↔ Task 對應

> 此表確保 design.md 每個決策都有任務落地（解一致性維度的 consistency 檢查）。

| design.md 決策 / 段落 | 落地 Task |
|----------------------|-----------|
| 本 change 的真實目標（純瀏覽器 SPA，零本機 runtime） | Group 2、3、4、7 |
| 三條交付通道並存（非互斥） | Group 7（獨立 export profile，不動 standalone） |
| Decision 1：以純瀏覽器 SPA 取代「本機 Node runtime」作為新交付通道 | Group 4（4.1 盤點 + 遷移） |
| Decision 2：以 Cloudflare Worker 作為 API 代理閘道 | Group 1 全部 |
| Decision 3：以 wa-sqlite + OPFS 取代 better-sqlite3 + 本機檔案系統 | Group 2、Group 3 |
| Decision 4：以瀏覽器指紋 + LocalStorage UUID 取代硬體 Device ID（嚴格版） | Group 6（6.1–6.8） |
| Decision 5：以 better-auth 取代現有簡易登入機制 | Group 5 全部 |
| Migration Plan：部署步驟 | Group 1.8、Group 7、Group 10.4 |
| Migration Plan：回滾策略 | Group 7.1（不動 standalone，可即時切回 Node 本地版） |

### app-settings-and-license（MODIFIED capability）Requirement ↔ Task 對應

| spec delta requirement | 落地 Task |
|------------------------|-----------|
| Plan settings SHALL show account role and license state（瀏覽器版新增 device 綁定狀態與解除綁定） | 6.5 |
| Browser edition license verification SHALL route through the CF Worker gateway | 6.3、6.4 |
| Browser edition SHALL gate full features behind two-phase authentication and authorization | 6.6 |

## Group 1: CF Worker API Gateway 擴充（design Decision 2）

- [ ] 1.1 建立 `cloudflare-worker/src/handlers/land-registry.ts`，實作地政系統地址查詢代理路由（對應 spec R3-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 1.2 建立 `cloudflare-worker/src/handlers/legal-clauses.ts`，實作法條同步代理路由（對應 spec R4-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 1.3 建立 `cloudflare-worker/src/handlers/realtor.ts`，實作執照驗證代理路由（對應 spec R5-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 1.4 更新 `cloudflare-worker/src/index.ts`，註冊上述三組新路由並加上 CORS 標頭（對應 design Decision 2、spec R1-S2）
  `[Tool: sonnet]`
- [ ] 1.5 在 `cloudflare-worker/src/handlers/` 新增 rate limit 中介層：每 IP 100 req/min、每 license 1000 req/day，含連續超額 admin 通知（對應 spec R7-S1、R7-S2）
  `[Tool: sonnet]`
- [ ] 1.6 在 `cloudflare-worker/src/handlers/` 新增 error sanitization 中介層：下游錯誤不暴露原始訊息（對應 spec R8）
  `[Tool: sonnet]`
- [ ] 1.7 撰寫 CF Worker handler 單元測試：驗證 land-registry、legal-clauses、realtor 路由的正確轉發與錯誤處理
  `[Tool: sonnet]` `[P]`
- [ ] 1.8 部署 CF Worker 至 `aire.opcos.me`，並以 curl 驗證各路由回傳 200/401/429 正確（對應 design Migration Plan Phase 0）
  `[Tool: sonnet]`

## Group 2: 瀏覽器 SQLite 與加密層（design Decision 3）

- [ ] 2.1 安裝 `wa-sqlite` 與 `@sqlite.org/sqlite-wasm`，確認能在 Next.js 客戶端 bundle 正確載入
  `[Tool: sonnet]` `[P]`
- [ ] 2.2 建立 `src/lib/db/browser-sqlite.ts`：封裝 wa-sqlite 初始化、connection pool、WAL mode 啟用（對應 spec R3）
  `[Tool: sonnet]` `[P]`
- [ ] 2.3 建立 `src/lib/db/browser-migrations.ts`：將現有 migrations（與 better-sqlite3 共用的 SQL）包裝為瀏覽器可執行的 migration runner（對應 spec R3-S1）
  `[Tool: sonnet]`
- [ ] 2.4 撰寫 browser-sqlite 整合測試：初始化 DB → 跑完所有 migration → 驗證 cases/settings 等表存在
  `[Tool: sonnet]`
- [ ] 2.5 安裝 `argon2-browser`（WASM argon2id），建立 `src/lib/crypto/argon2.ts` 封裝 derive key 功能（對應 spec R4-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 2.6 建立 `src/lib/crypto/browser-vault.ts`：主密碼驗證、AES-GCM 加密/解密、金鑰記憶體管理（對應 spec R4）
  `[Tool: sonnet]`
- [ ] 2.7 撰寫 browser-vault 單元測試：正確密碼可解密、錯誤密碼 1 秒內拒絕、重開頁面金鑰消失
  `[Tool: sonnet]`
- [ ] 2.8 建立 `src/lib/db/browser-repository.ts`：將現有 cases/drafts/settings 的 SQL 操作封裝為瀏覽器可用函式（對應 spec R3）
  `[Tool: sonnet]`

## Group 3: OPFS 檔案儲存層（design Decision 3）

- [ ] 3.1 建立 `src/lib/storage/browser-opfs.ts`：封裝 OPFS 讀寫、目錄建立、檔案列舉（對應 spec R5）
  `[Tool: sonnet]` `[P]`
- [ ] 3.2 在 browser-opfs.ts 加入 IndexedDB fallback：當 OPFS 不可用時自動降級（對應 spec R3-S3）
  `[Tool: sonnet]`
- [ ] 3.3 建立 `src/lib/storage/browser-export.ts`：實作「匯出到使用者選擇的資料夾」（File System Access API）與「下載 fallback」（對應 spec R5-S3）
  `[Tool: sonnet]`
- [ ] 3.4 撰寫 OPFS 整合測試：寫入 PDF → 關閉 tab → 重新開啟 → 讀取內容一致
  `[Tool: sonnet]`

## Group 4: 資料存取層遷移（design Decision 1）

> Baseline 校正：本 codebase 目前僅剩 **6 處** `invoke(...)`（Tauri IPC 殘留）；另有 browser-local-runtime 的本機 API 呼叫。Task 4.1 須同時盤點這兩類，非僅 Tauri invoke。

- [ ] 4.1 盤點全部資料存取點：6 處殘留 `invoke("...")` + browser-local-runtime 本機 API 呼叫，輸出對照表：哪些改本地 DB、哪些改本地檔案、哪些改 fetch API（對應 design Decision 1）
  `[Tool: sonnet]`
- [ ] 4.2 修改案件 CRUD 相關頁面：將案件存取改呼叫 `browser-repository.ts`（對應 spec R6-S2）
  `[Tool: sonnet]`
- [ ] 4.3 修改草稿儲存相關頁面：將草稿存取改呼叫 `browser-repository.ts`
  `[Tool: sonnet]` `[P]`
- [ ] 4.4 修改 PDF 匯出流程：改為呼叫瀏覽器 PDF 產出 library + `browser-opfs.ts` 儲存（對應 spec R5-S1）
  `[Tool: sonnet]`
- [ ] 4.5 修改地政查詢流程：改為 `fetch("https://aire.opcos.me/api/land-registry/pull")`（對應 spec R3-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 4.6 修改法條同步流程：改為 `fetch("https://aire.opcos.me/api/legal-clauses/sync")`（對應 spec R4-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 4.7 修改執照驗證流程：改為 `fetch("https://aire.opcos.me/api/realtor/verify")`（對應 spec R5-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 4.8 修改品牌設定流程：將 logo 存取改呼叫 `browser-opfs.ts`
  `[Tool: sonnet]` `[P]`
- [ ] 4.9 修改平面圖上傳流程：將平面圖存取改呼叫 `browser-opfs.ts`
  `[Tool: sonnet]` `[P]`
- [ ] 4.10 移除已無用的 Tauri IPC import 與 type definition，清理編譯警告（不刪除 src-tauri/，維持 PARKED）
  `[Tool: sonnet]`

## Group 5: better-auth 整合（design Decision 5，從 Supastarter 提取）

- [ ] 5.1 安裝 better-auth 與必要依賴（better-auth、@better-auth/passkey），參考 Supastarter 的 `packages/auth/package.json`（對應 design Decision 5）
  `[Tool: sonnet]` `[P]`
- [ ] 5.2 建立 `src/lib/auth/better-auth-config.ts`：配置 better-auth（email/password、session、password reset），移除 organization/stripe 外掛（對應 design Decision 5）
  `[Tool: sonnet]`
- [ ] 5.3 建立 `src/lib/auth/auth-client.ts`：封裝 better-auth 前端 client，提供 signIn、signUp、signOut、useSession（對應 spec R4-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 5.4 建立 `src/app/api/auth/[...all]/route.ts`：better-auth API handler，路由所有 auth 請求（對應 better-auth 文件）
  `[Tool: sonnet]`
- [ ] 5.5 修改 `/login` 頁面：整合 better-auth signIn，取代現有簡易 token 登入（對應 spec R4-S1）
  `[Tool: sonnet]`
- [ ] 5.6 新增 `/signup` 頁面：better-auth 註冊流程，含 email 驗證（對應 spec R4-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 5.7 新增 `/forgot-password` 頁面：密碼重設流程（對應 spec R4-S3）
  `[Tool: sonnet]` `[P]`
- [ ] 5.8 修改 `src/app/(dashboard)/layout.tsx`：整合 better-auth session guard，未登入導向 /login（對應 spec R4-S2）
  `[Tool: sonnet]`
- [ ] 5.9 撰寫 better-auth 整合測試：註冊 → 登入 → session 驗證 → 登出 → 密碼重設
  `[Tool: sonnet]`

## Group 6: 授權與 Device ID（design Decision 4，OPCOS + 嚴格版）

- [ ] 6.1 建立 `src/lib/device/browser-fingerprint.ts`：收集 canvas、fonts、WebGL、timezone、screen 等指紋元件（對應 spec R1-S1）
  `[Tool: sonnet]` `[P]`
- [ ] 6.2 建立 `src/lib/device/browser-device-id.ts`：組合 UUID + fingerprint → SHA-256 device_id，讀寫 LocalStorage（對應 spec R1）
  `[Tool: sonnet]`
- [ ] 6.3 修改授權啟動流程：改為 `fetch("https://aire.opcos.me/api/license/activate")`，帶入 browser device_id（對應 spec R2-S1；實現 app-settings requirement「Browser edition license verification SHALL route through the CF Worker gateway」）
  `[Tool: sonnet]`
- [ ] 6.4 修改授權驗證流程：改為 `fetch("https://aire.opcos.me/api/license/verify")`，帶入 browser device_id（對應 spec R2-S4；實現 app-settings requirement「Browser edition license verification SHALL route through the CF Worker gateway」）
  `[Tool: sonnet]`
- [ ] 6.5 新增授權轉移流程：「解除裝置綁定」按鈕 → 主密碼驗證 → 呼叫 OPCOS deactivate → 進入試用模式（對應 spec R2-S2；實現 app-settings requirement「Plan settings SHALL show account role and license state」的瀏覽器版 device 綁定狀態與解除綁定）
  `[Tool: sonnet]`
- [ ] 6.6 新增試用模式限制：未授權用戶最多 3 筆案件、PDF 匯出禁用、顯示試用浮水印（對應 spec R4-S4；實現 app-settings requirement「Browser edition SHALL gate full features behind two-phase authentication and authorization」）
  `[Tool: sonnet]`
- [ ] 6.7 撰寫 device_id 單元測試：相同瀏覽器產生相同 ID、不同瀏覽器產生不同 ID、清除 LocalStorage 產生新 ID
  `[Tool: sonnet]`
- [ ] 6.8 撰寫嚴格版授權 E2E：啟動 → 換瀏覽器 → 驗證被拒 → 解除綁定 → 新瀏覽器啟動成功
  `[Tool: sonnet]`

## Group 7: 靜態輸出與部署（design Migration Plan Phase 3 + 回滾策略）

> ⚠️ 危險操作校正：**不可**把現有 `next.config.ts` 的 `output` 改為 `'export'`。現況是 `'standalone'`，是 browser-local-runtime 的生命線，改了會破壞現有上線版本（見 `src-tauri/PARKED.md`）。純瀏覽器版以獨立 build profile 產出 export，與 standalone 並存。

- [ ] 7.1 建立純瀏覽器版獨立 export build profile（環境變數切換 `output` 或獨立 config），**保留現有 standalone 設定不動**；確保純瀏覽器 build 無 server-side API routes（對應 design Migration Plan Phase 3、回滾策略）
  `[Tool: sonnet]`
- [ ] 7.2 確認所有動態路由（如 `/cases/[id]`）在靜態輸出下正確產生 HTML（可能需要 `generateStaticParams`）
  `[Tool: sonnet]`
- [ ] 7.3 建立 `wrangler.toml`（或 `pages.toml`）設定 Cloudflare Pages 部署配置
  `[Tool: sonnet]`
- [ ] 7.4 部署瀏覽器版至 Cloudflare Pages 測試域名，驗證首頁載入、登入、案件列表正常
  `[Tool: sonnet]`
- [ ] 7.5 設定自訂域名（如 `web.aire.tw`）的 DNS 與 HTTPS
  `[Tool: sonnet]`

## Group 8: E2E 與驗收測試（驗收 spec R6/R7 + design「真實目標」）

- [ ] 8.1 撰寫 Playwright E2E：瀏覽器版完整流程「註冊 → 登入 → 輸入序號 → 建立案件 → 地政查詢 → 儲存草稿 → 產出 PDF → 登出」（驗收 spec R6 UI Code Reuse 全鏈）
  `[Tool: sonnet]`
- [ ] 8.2 執行離線測試：關閉網路後，確認案件編輯與 PDF 產出仍可正常運作（對應 spec R7-S1、R7-S2、R7-S3）
  `[Tool: sonnet]`
- [ ] 8.3 執行跨瀏覽器測試：Chrome、Edge、Safari 各跑一輪核心流程（對應 spec R1-S1、R3-S3 OPFS fallback）
  `[Tool: sonnet]`
- [ ] 8.4 執行效能測試：首次載入 < 3 秒、案件查詢 < 500ms、100 筆案件列表 < 1 秒（對應 spec R1-S1、R2-S1）
  `[Tool: sonnet]`
- [ ] 8.5 執行資料遷移驗收：Node 本地版匯出資料庫 → 純瀏覽器版匯入 → 案件完整可讀（對應 design Risk「Node→瀏覽器資料遷移」）
  `[Tool: sonnet]`

## Group 9: Review（Sonnet 並行多角度 CR）

- [ ] 9.1 審查 `src/lib/db/browser-*.ts` 與 `src/lib/crypto/browser-*.ts`：確認無記憶體洩漏、無 async/await 競態、錯誤處理完整
  `[Tool: sonnet]` `[P]`
- [ ] 9.2 審查 `cloudflare-worker/src/handlers/*.ts`：確認無憑證洩露風險、錯誤訊息已 sanitize、rate limit 正確運作
  `[Tool: sonnet]` `[P]`
- [ ] 9.3 審查資料存取遷移：確認 6 處 `invoke("...")` 與本機 API 呼叫已正確改寫，無殘留會在純瀏覽器環境崩潰的程式碼
  `[Tool: sonnet]` `[P]`
- [ ] 9.4 審查 better-auth 整合：確認 session cookie 設定正確、無 organization/stripe 殘留、密碼重設流程安全
  `[Tool: sonnet]` `[P]`
- [ ] 9.5 安全性審查：確認 browser-vault 金鑰不寫入 storage、CF Worker env 不回傳 client、主密碼 argon2id 參數正確
  `[Tool: sonnet]` `[P]`

## Group 10: 部署與文件（design Migration Plan：部署步驟）

- [ ] 10.1 撰寫 `docs/browser-edition/migration-guide.md`：從 Node 本地版資料庫遷移到純瀏覽器版的步驟（手動匯出/匯入，對應 design Risk + Group 8.5）
  `[Tool: sonnet]`
- [ ] 10.2 撰寫 `docs/browser-edition/user-guide.md`：瀏覽器版首次使用、主密碼設定、備份提醒、清除瀏覽器資料警告（對應 spec R2、design Risks）
  `[Tool: sonnet]`
- [ ] 10.3 更新 `openspec/config.yaml` context：新增「純瀏覽器版（Browser Local-First）」為第三交付通道，與企業簽名版、Node 本地版並列（對應 design「三條交付通道並存」）
  `[Tool: sonnet]`
- [ ] 10.4 正式部署純瀏覽器版至生產域名，與 Node 本地版下載頁並行運作（對應 design Migration Plan：部署步驟）
  `[Tool: sonnet]`
