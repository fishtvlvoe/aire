---
name: aire-delivery-guardrails
description: "AIRE 交付、Windows 驗收、UTM runtime、installer trust、與查詢不穩定判讀護欄"
license: MIT
compatibility: AIRE project local skills.
---

# AIRE Delivery Guardrails

這個 skill 用來處理 AIRE 專案反覆出現的交付與驗收判斷，不要再靠對話重建。

## 什麼時候用

- 使用者問「現在可不可以交付客戶」
- 使用者問「Windows / UTM 驗收做到哪」
- 使用者問「這是不是正式客戶版」
- 使用者問「同地址為什麼這次有、下次沒有」
- 需要整理 release readiness、Windows evidence、或驗收 blocker
- 需要驗 AIRE Browser / Cloudflare Pages static export / PDF Downloads / 多物件類型 fixture

## 先套這些護欄

1. `pilot-ready`
   - 代表可交付客戶試用
   - 不代表正式客戶版

2. `pilot-runtime-accepted`
   - 代表 Windows / UTM runtime 驗收通過
   - 仍不代表 installer 已可正式交付

3. `customer-release-ready`
   - 必須另外通過 installer trust / code signing gate
   - UTM 驗收通過不能直接升格成這個狀態
   - GitHub release workflow 只有在 Azure Trusted Signing / code signing secrets 已設定時，才有機會產出已簽名的 Windows 安裝包；未設定時一律只能算 `internal-only`

4. Docker 不是 AIRE 客戶正式交付物
   - 客戶交付物是 Windows installer

5. AIRE 驗證要分層看
   - `pnpm type-check`
   - focused tests
   - full Playwright
   - Windows runtime evidence
   - `spectra analyze` / `spectra validate`

6. 地址 / 實價登錄單次失敗，不要直接判產品壞掉
   - 先看外部來源 timeout
   - 再看 retry
   - 再看 cache / snapshot
   - 再看是否真的是邏輯錯

7. Windows UTM 登入問題要先分層
   - 先分清楚是 Windows VM 系統登入，還是 AIRE App 內登入
   - Windows VM 登入若卡住，先確認 VM 帳號密碼，不要誤判成 AIRE 壞掉
   - AIRE App 的一次性桌面登入，必須先切到「一次性登入碼」tab
   - 一次性桌面登入需要 `Email + 一次性登入碼`，不是只有 code
   - 目前已驗證的測試組合是 `admin@test.aire` + `OTC-ADMIN-2026`
   - 若 UTM 內自動操作因焦點亂跳而無法穩定填表，這是 runtime automation blocker，不等於產品功能失效
   - 遇到這種 blocker，優先選擇：一次人工登入取證，或補一條測試專用登入 bypass

8. AIRE Browser static export 不等於 Next dev server
   - `pnpm build:browser` 產物部署到 Cloudflare Pages 後，Pages origin 沒有 Next API routes
   - Browser production 不能依賴 `/api/*` 本機 route 取得地圖、空拍、街景或地政資料
   - production 圖資與地政 proxy 應走可部署的 Worker / `aire-land.opcos.me` route
   - `/api/legal-clauses/sync` 若回 401，PDF 不可卡死；要 fallback 到本機/內建法規條款
   - `/api/nearby-amenities`、`/api/geocode` 在 static Pages 回 405 是架構訊號，不可當成暫時網路錯誤忽略；要改走 Worker/proxy 或可讀 unavailable
   - Google Maps API key 不得放進 `NEXT_PUBLIC_*` 或 client bundle
   - 若 bundle grep 還看得到 `/api/aerial-photo`、`/api/location-map`、`/api/street-view`，要用 Playwright network assertion 判斷實際 production 是否仍呼叫同源 API；若任務明確要求 build grep，應把 production bundle 內的同源 visual API 字串移除或改成不可被 static export 誤用的 helper 組合

9. Cloudflare deploy 權限要分清楚
   - `wrangler whoami` 失敗不一定代表 token 無效，可能是 token 不能列 accounts
   - `wrangler login` 若一直提示 `logged in with an API Token`，優先檢查專案 `.env` / shell wrapper 是否自動注入 `CLOUDFLARE_API_TOKEN`；可改從 `$HOME` cwd 並用 `env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID -u CF_API_TOKEN -u CF_API_KEY ...`
   - 標準 credential 可先查 `~/.cloudflared/api-tokens.json`，但回報時一律遮罩 token
   - token verify active 只代表 token 有效，不代表有 Workers Scripts / Pages Edit 權限
   - deploy 若回 `Authentication error [code: 10000]`，要回報為 Cloudflare token permission blocker，不要說程式壞掉
   - 部署 Worker 時用 `--keep-vars`，避免覆蓋 Dashboard secrets，例如 Google key 或 proxy token
   - `wrangler secret put GOOGLE_MAPS_API_KEY --config cloudflare-worker/wrangler.toml` 可修復 `aire-land.opcos.me/api/visual-evidence/street-view` 的 `503 street_view_not_configured`；如果專案 `.env` 自動注入的 Cloudflare token 權限不足，可改用 `~/.wrangler/config/default.toml` 的 OAuth token 跑 wrangler，但回報時不可洩漏 token 或 Google key
   - 不要直接 `source .env` 讀 AIRE secrets；這份 `.env` 含有非 shell-safe 文字，會噴 `command not found`。要用 parser 讀單一 key，例如 Python 逐行抓 `GOOGLE_MAPS_API_KEY=`

10. Browser PDF E2E 必須留下可驗收產物
   - 需要把 PDF 存到 `$HOME/Downloads`
   - 多物件類型 fixture 應固定檔名：`aire-browser-<propertyType>-<fixtureId>.pdf`
   - 同步輸出 JSON report，至少列 `fixtureId/propertyType/address/downloadPath` 與地段、地號、建號、土地面積、登記坪數是否出現
   - land-only fixture 不要求建號與登記坪數；建物類才要求
   - PDF 驗收不能只看下載成功，要用 `pdftotext` 檢查地址、品牌、位置圖、空拍圖、不可含 `candidate_data_available` / `COP309` / `MOI_API_`
   - Headless browser 對 blob `<a download>` 可能不穩，若 Playwright 收不到 download event，要從 PDF preview iframe 的 `blob:` URL 讀 bytes 寫入 Downloads，再用 `pdftotext` 驗證；不要把測試工具限制誤判成 PDF 沒生成
   - `URL.revokeObjectURL()` 不可在 click 後同步或過早呼叫；Browser local-first 匯出也不可先 `await isTauriEnv()` 再觸發 download，避免脫離使用者手勢

11. Provider unavailable 是可接受狀態，但要可讀
   - 位置圖、空拍圖、街景 provider 失敗時，PDF 仍要可匯出
   - 不可塞假圖
   - 要保留 `status`、`provider`、`unavailableReason`
   - Google street-view 缺 key 應是 `requires_configuration`，不是 crash
   - 若 live curl 顯示 `location-map` / `aerial-photo` 是 `200`，但 `street-view` 是 `503 requires_configuration`，要明確回報為 production secret / Worker config blocker，不要說 visual proxy 全掛
   - 街景候選只有使用者確認正面後，才可變成 PDF 的 `exterior_photo`

12. 多物件類型查詢缺漏要當成矩陣結果，不要硬湊
   - 同一地址 live lookup 可能一輪有建號/土地面積，下一輪缺資料；先記錄 `present=false` 與 provider 狀態，不要偽造值
   - 大樓、華廈若有登記坪數，PDF 應維持建物版
   - 透天、別墅若被產成土地版且缺建號/登記坪數，這是產品分類/候選資料 bug，要列為 blocker 或新 SR，不可宣稱全通過
   - 商業用地、農業用地不要求建號與登記坪數，但應要求地段、地號、土地面積

13. WebKit/Safari E2E 的已知差異
   - WebKit 對 tiny PNG Logo upload 可能回 transient error；品牌文字驗收不能被 Logo 上傳卡死
   - WebKit smoke 可允許 `logo-save-skipped`，但仍要驗 PDF 文字品牌、位置圖、空拍圖
   - Playwright `serviceWorkers: block` 造成的 service worker warning 不是功能失敗

14. Playwright 環境坑先和產品 bug 分開
   - 若 Playwright 報 `Executable doesn't exist ... chrome-headless-shell`，先跑 `pnpm exec playwright install chromium`
   - 這是本機測試環境缺 browser binary，不是 AIRE 功能 regression
   - 補完 browser 後再重跑 UI / network assertion，避免把環境缺件寫成 SR blocker

15. Browser local-first 圖資驗證要看「實際請求 URL」，不要只信本機 source
   - 若 live `aire-browser.opcos.me` 點「產生街景候選」時仍送出 `POST /api/street-view`，而不是 `https://aire-land.opcos.me/api/visual-evidence/street-view`，要直接列為 deployed browser bundle/runtime regression
   - `HTTP 405 /api/street-view` 代表 static Pages 還在走同源 Next API route 假設，不是 Google provider 暫時沒圖
   - 這種情況 `2.2` / `3.1` 不能勾完成，即使本機 component test 已過
   - browser-local-first 的 case detail / preview route 在 `next dev` 下可能出現 `GET /cases/_?... 200` 但 Playwright navigation `load` / `domcontentloaded` 不結束；這是 dev lifecycle 差異，驗證時優先看 live URL 與 request log，不要把 `page.goto(... waitUntil: load)` 卡住誤判成功或失敗
   - 若 `GET /cases/_/preview?caseId=... 200` 已出現在 dev server log，但 Playwright `page.goto`、`waitUntil: domcontentloaded`、`waitUntil: commit` 或 URL wait 都卡住，先記為 Browser preview-route E2E blocker；不要把前面的 login/license/create-case 階段說成 PDF fullflow 已通過
   - live smoke 不要用 `caseId=test`；browser-local-first case 存在 OPFS / browser DB，必須先由新增案件流程建立真 case
   - Playwright `addInitScript` 裡的 `__AIRE_BROWSER_DB_FILENAME__` 必須固定，不能用每次 navigation 都會重新計算的 `Date.now()`，否則建立後進詳頁會變成 `browser_case_not_found`
   - 手寫 smoke 若只塞 token 而沒有 `aire-mock-store` session user / feature flags，新增案件頁可能不送出 address discovery；優先重用既有 E2E session seed 或走真登入流程
   - live `feat-aire-mvp.aire-browser.pages.dev` 或 `aire-browser.opcos.me` 若仍在 Browser settings 顯示「此功能需在 AIRE 桌面 App 中使用」，代表部署產物/feature flag 還是舊狀態；不能用本機 DOM tests 直接宣稱 production Browser settings 可用

16. AIRE SaaS COP credential / query ledger 不可停在 in-memory
   - `connect-customer-cop-formal-supplement` 先以 server-side in-memory store 驗證 credential masking、formal lookup blocker、ledger sanitization 與 no-secret boundary
   - 這只代表本機/單程序 smoke 可用，不代表 production durable
   - 正式上線前，COP `clientSecret` 必須改成 durable encrypted storage，query ledger 必須寫入 durable DB / workspace-scoped storage
   - 若只看到 `/api/aire/cop/credential` 回 masked state，不可直接宣稱「線上重啟後仍可用」
   - Browser formal import 必須走 `/api/aire/cop/formal-lookup`；若仍直接打 `aire-land` 或 local proxy，會繞過 customer COP credential、owner authorization、paid consent、query ledger 與 secret sanitization
   - `createAireGatewayHeaders()` 必須帶 `Authorization`、`x-aire-workspace-id`，必要時帶 `x-aire-user-email`；只帶 token 會讓 workspace-scoped API 403 或造成 workspace attribution 不完整
   - 真實 COP token smoke 要分清楚 runtime TLS 與 credential：若 Python `urllib` 報 `CERTIFICATE_VERIFY_FAILED: Missing Subject Key Identifier`，但 `curl` 同 endpoint 回 HTTP 200 且 SSL verify result 為 `0`，先記為 Python/OpenSSL 相容性坑，不要誤判 COP 帳密錯；產品預設不可用 `-k` 或關閉憑證驗證。
   - 取 token 成功只代表帳密與 token endpoint 可用；未執行正式 land/building lookup 前，不可宣稱「真實 COP 有查到資料」。正式查詢可能有費用或查詢紀錄，必須有 paid consent 與 owner authorization。
   - 單筆正式 API 實測範例：`LandDescription/1.0/QueryByLandNo` + `BA-0001-00020000` 回 HTTP 200、`STATUS=1`、`RETURNROWS=1`、`LANDREG.AREA=72.00`，且 response 會含 `PRICE` / `QUANTITY` / `TRANSACTIONID`；回報時只列 safe fields，不輸出完整謄本、token、secret。
   - COP token endpoint 可能單次 connect timeout，下一次才成功；一次 timeout 應標成 retryable downstream/network，不要立即把 workspace COP credential 標成 invalid。
   - `pnpm run build:browser` 是 static export，會移除 Next API routes；若 Browser code 仍打 `/api/aire/cop/credential` 或 `/api/aire/cop/formal-lookup`，部署到 Cloudflare Pages 後會是 404。這是 production architecture blocker，不是 UI 沒部署。
   - Wrangler 會自動讀專案 `.env`；若專案 `.env` 內有低權限 Cloudflare token，`wrangler pages deploy` 可能回 `Authentication error [code: 10000]`。可從無 `.env` 目錄執行或加 `--cwd /tmp` 部署同一個 `out` 絕對路徑，避免專案 env 覆蓋 OAuth。
   - `deploy-customer-cop-backend-runtime` 的 backend 必須是可啟動的台灣側 HTTP runtime，不只是 fetch app/unit tests；最低要求包含 `server.ts`、package scripts、container/deploy artifact、health 200 與 CORS reject smoke。
   - production secrets gate 必須檢查 `AIRE_COP_CREDENTIAL_ENCRYPTION_KEY`、`AIRE_COP_ALLOWED_ORIGINS`、`AIRE_CUSTOMER_COP_BACKEND_URL`；任一缺失都不可部署或回頭勾舊 SR 的客戶可用 smoke。
   - in-memory credential/ledger 只可用於 local contract 或 staging smoke；production 必須換成 durable encrypted credential store 與 durable workspace-scoped query ledger，否則重啟會遺失客戶 COP 與查詢紀錄。
   - `connect-customer-cop-formal-supplement` 的最後客戶可用 smoke 只能在 live `https://aire-browser.opcos.me` 通過 credential save/load/test、formal lookup、ledger、import、PDF/no-secret 後打勾；不能用本地 backend 或 static build 代替。
   - 若 `gcloud config list` 顯示 project/region 已設定，但 Cloud Resource Manager API 或 Cloud Run 相關 API 提示未啟用，要列為平台/API blocker；不要把它寫成 AIRE 程式 bug。
   - Firestore API 啟用與 Firestore database 建立可能產生雲端成本；即使 database 顯示 `freeTier: true`，正式 COP/ledger production runtime 也要當成可計費資源回報。
   - Firestore ledger query 若同時用 `where(workspaceId == ...)` 與 `orderBy(createdAt desc)`，production 可能回缺 composite index 或 query error；沒有先建 index 時，先用 workspace `where` 查出後在 app 端排序，或明確建立 Firestore index。
   - Cloud Run direct API 不應讓 Browser 直接打 credential/formal lookup；production 應透過 same-origin Worker route 轉發並帶 `x-aire-backend-token`，直打 Cloud Run credential route 應回 `403 backend_gateway_required`。
   - Worker shared backend token 只能保護 Cloud Run 不被直接濫用，不等於已驗證使用者身份；若 backend 只接受 Browser 傳入的 `aire_session_*` 與 `x-aire-workspace-id`，仍有 workspace header 偽造風險。正式多客戶收費前需接可驗證的 AIRE session/license token 或 server-side workspace lookup。
   - production smoke 若 shell retry 造成多次正式 COP lookup，要如實記錄每筆 `PRICE` / `QUANTITY`，不要只說「扣 1 元」；retry 可能讓 ledger 與 COP 計費變成 2 筆以上。
   - `aire.opcos.me` 是 AIRE 獨立 SaaS 入口；若 `https://aire.opcos.me/login` 404，修法應是在 `aire.opcos.me` 提供 AIRE-owned login/auth action，不可用 307/302 導到 `https://opcos.me/login` 交差。live smoke 要驗 `curl -I https://aire.opcos.me/login` 沒有導向 opcos.me。
   - `products/opcos.me` 的 `aire-saas-site` Vercel project rootDirectory 是 `apps/marketing`；若從 `apps/marketing` cwd 直接 deploy，可能變成重複路徑 `apps/marketing/apps/marketing`。用 repo root 搭配 `.vercel/project.json` 的 `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 部署，檔案太多時加 `--archive=tgz`。
   - 舊 SR 的 `6.3 客戶可用 smoke` 不是 API smoke：即使 credential save/test/formal lookup/ledger live 都 200，仍需補 live UI 登入、建立案件、補件 import、PDF download 與 PDF no-secret trace，才能封存。

17. AIRE 正式授權不可停在 header-only seam
   - `aire.opcos.me` 是 AIRE 獨立 SaaS 正式登入入口；`https://aire.opcos.me/login` 不可 307/302 導到 `https://opcos.me/login` 作為成功路徑。可以復用 Better Auth / Google / LINE / license primitives，但 login page、OAuth callback、license gate、Browser token exchange 都必須在 `aire.opcos.me`
   - 正式 no-island-account path 必須從 `products/opcos.me` 的 `@repo/auth` Better Auth session + Prisma AIRE license/device activation 產生 Browser token；AIRE repo 內的 header-based `src/app/api/aire/browser-session/exchange` 只能當 focused tests/local seam，不可當 production identity source
   - `aire_session_*` random/local token 只能用於 desktop/local-first fallback；production `aire-browser.opcos.me` 必須拒絕這種 token，改吃 server-verifiable Browser token
   - `AIRE_BROWSER_SESSION_JWT_SECRET` 必須同時設定在 `opcos.me` marketing exchange、Cloudflare Worker、customer COP backend；三邊不一致會造成登入成功但 COP gateway/backend 401/403
   - Browser callback 解 JWT payload 時不可在瀏覽器優先用 `Buffer.from(payload, "base64url")`；部分 bundler/polyfill 有 `Buffer` 但不支援 `base64url`，會讓 valid token 顯示「token 無法使用」。Browser 端應優先用 `atob` 處理 base64url 正規化，Node fallback 才用 Buffer。
   - OAuth/Email 成功後不能直接導進 `/cases/new`；必須先進 `/api/aire/browser-session/exchange` 做 Better Auth session、AIRE license、device quota、IP policy 檢查，再導到 `https://aire-browser.opcos.me/auth/callback?token=...`
   - Browser callback 只能保存 token 與 user/workspace/license/device metadata；不可把 `caseLocalId`、地址、屋主、PDF bytes、COP response 放進 auth exchange 或 introspection payload
   - Worker/Cloud Run 不可相信 caller-provided `x-aire-workspace-id`；workspace 必須由 verified Browser token claims 或 server-side introspection 導出
   - `opcos.me/apps/marketing` type-check 要納入驗證，因為正式 shared auth endpoint 在那裡；只跑 AIRE repo tests 不足以證明 no-island-account path 可編譯
   - `customer-cop-backend` 必須可獨立打包；不要讓 production runtime import `../../src/lib/...` 這種 repo-root 檔案。Docker/Cloud Run source deploy 若只包含 backend 子目錄，跨目錄 import 會讓部署 image 與本機測試不一致。JWT verify 這類 runtime-critical code 要放在 backend package 內或抽成真正可打包 dependency。
   - Cloud Run service URL 可能在 source deploy 後改變；Worker `CUSTOMER_COP_BACKEND_ORIGIN` 要跟目前 `gcloud run services describe ... status.url` 對齊。Worker 指到舊 URL 時，Browser 可能登入成功但 COP API 仍回舊 runtime 的 401/403。
   - `pnpm run build:browser` 必須注入 production runtime URLs：`NEXT_PUBLIC_AIRE_GATEWAY_URL=https://aire.opcos.me`、`NEXT_PUBLIC_AIRE_LAND_PROXY_URL=https://aire-land.opcos.me`、`NEXT_PUBLIC_AIRE_CUSTOMER_COP_BACKEND_URL=https://aire-browser.opcos.me`。若缺 land proxy，新增案件頁會顯示「瀏覽器版地址前查代理暫時無法取得資料」，不是地政資料真的查無。
   - Browser `address-discovery` timeout / proxy 非 2xx / fetch failure 時，客戶頁面預設只能顯示白話 fallback 與 `request_id`（例如「查詢編號」）；raw `url/origin/headers/error` 只能留在 `settings/logs` 或受控 debug。否則使用者會把代理 timeout 誤解成「這個地址真的沒有資料」。
   - 門牌地址策略以目前 product rule 為準：只要輸入是完整門牌且有 `號`，免費前查主線就應先走 `R02 primary`；`Z10Web` 只作補證、衝突診斷或補欄位，不可再把完整門牌主線打回 generic no-data。
   - 缺 `區/鄉/鎮/市` 的門牌地址（例如 `台南市永華路580號5樓之3`）不可直接顯示「查不到資料」；要先嘗試唯一行政區補全。只有唯一命中才自動補；多命中或零命中都要明確回成「地址不完整，請補行政區」。
   - AIRE Browser 的 timeout / debug UI 問題，不能只靠 local source 或 unit test 宣稱已修。`aire-browser.opcos.me` 是 Cloudflare Pages static browser bundle；必須直接抓 live route HTML / chunk 驗證。若 Fish 手測畫面仍出現舊字串（例如 `除錯資訊`、raw `browser_fetch_failed ...`），先對 `https://aire-browser.opcos.me/cases/new` 的 live chunk，再決定是未部署、舊 static export、還是修錯 repo。
   - 對 live bundle 的最小檢查：`curl -A 'Mozilla/5.0' -sS https://aire-browser.opcos.me/cases/new`，找出該 route 載入的 `/_next/static/chunks/*.js`；再 grep `除錯資訊`、`支援追查編號`、`browser_fetch_failed`、`查詢編號`。若 live chunk 仍含舊字串，而本機 source 已改，結論應是「live bundle 尚未更新」，不是「使用者測錯」。
   - `台中市太平區環中東路3段333號六樓之一` 這類有樓層/戶別的地址，免費前查本來就比一般門牌慢：目前 browser 端 fetch timeout 是 65 秒，60 秒會先切到 `slow_source`；而 `local-address-discovery-proxy` 對完整門牌會先跑 R02，再做 Z10Web 驗證。看到「查詢中很久」時，先判斷是上游查詢鏈較長或 timeout，不要先誤判成 parser/前端卡死。
   - 若需求是「未來不要每次重查同一類問題」，預設要先套這份 skill 的 live-runtime ownership 檢查，再看是否需要重新查最新 live state；因為這類問題高度依賴當前 deploy bundle，不能只靠舊對話記憶。
   - 7.3 API smoke 不等於 7.4/7.5 UI/PDF smoke。即使 live credential save/read/test、formal lookup、ledger 都是 200，也不能打勾「客戶可用完整流程」，除非已從 production UI 完成建立/選定案件、owner authorization、paid consent、formal import、PDF download、`pdftotext` no-secret。
   - 新增案件頁的人工補填流程若沒有 `office_code` / `section_code` 欄位，後續 formal import 可能無法組出正式 COP registry key。看到「地段、地號」可填不代表可完成正式查詢；E2E fixture 要確認 UI 能保存 formal office/section code，或先建立 approved production-safe case seed path。
   - `aire.opcos.me` Email login 可能短暫回 `Internal Server Error`；若 immediate retry 通過，先記為 auth runtime flake 監控，不要把後續 COP/UI 測試結果混在同一個根因裡。
   - Production UI e2e 的免費前查 fixture 不可用 `dev_fixture` 代表真實 EasyMap；產品會正確過濾 `dev_fixture` / `mock`，避免測試資料被當成可信候選。要模擬可用免費前查候選，使用 `source=easymap_r02` 或 `easymap_z10web`，並保留 `trusted_for_pdf=false`，正式 PDF 可信度仍要等 customer COP import。
   - Browser formal import 不可在 production 靠 `/api/local/cases/:id` 重新讀 case 後才組 registry key；static Browser/workbench 可能已能顯示 case，但 local API 另一資料源回 `get_case 404`。正式匯入應從頁面已確認的 formal target 傳入 `officeCode`、`sectionCode`、`landNo`、`buildingNo`、`address`，桌面/local backend 才 fallback `get_case`。
   - AIRE UI API id 與 customer COP backend API id 可能不同；目前前端/PDF/provenance 用 `land_registry`，customer COP backend 打實際服務 `land_description`。Browser 呼叫 backend 前要 map `land_registry -> land_description`，response 回 UI 前要 map 回 `land_registry`，否則 ledger/formal lookup 或 PDF preview 會接不上。
   - PDF preview 的 trial gate 必須以 server-verified AIRE Browser session/license 為準；若畫面 topbar 顯示授權已啟用，但 PDF 頁仍出現「試用版不可匯出」，代表 `isBrowserTrialMode()` 還在看舊 local `aire_license_status`，不是 license 真的無效。
   - 完整 production e2e 要跑到 PDF 下載與 `pdftotext` no-secret scan 才算客戶可用。僅看到「目前為正式版 PDF，已帶入正式地政資料」還不夠；匯出按鈕可能仍被 trial gate disabled。
   - `https://aire.opcos.me/signup`、`/login`、`/license`、`/devices` 都是客戶入口的一部分；任一 404 都是 customer onboarding product bug，不能被 paid COP gate 或既有 active account smoke 蓋掉。
   - `aire.opcos.me` 若實作在 `app/[locale]/*`，root `/login`、`/admin` 也必須有 production alias 或 middleware；helper 不可產生不存在的 root path。live smoke 要同時驗 root alias 與 localized canonical path，例如 `/admin -> /zh-TW/admin -> /zh-TW/login`、`/login?returnTo=... -> /zh-TW/login?...`。
   - AIRE customer onboarding root paths 必須可用：`/signup`、`/license`、`/devices`、`/forgot-password`、`/reset-password`。Browser login 會連這些 root URLs；只提供 `/zh-TW/*` 會造成使用者以為註冊/授權頁不存在。
   - AIRE admin 的「開啟 Browser」不可直接連 `aire-browser.opcos.me/cases/new`；必須走 `aire.opcos.me/api/aire/browser-session/exchange?adminSupport=1&returnTo=...` 簽 server-verifiable Browser token。否則 platform admin 會被 Browser auth guard 丟回 Browser login。
   - 後台設備綁定畫面讀的是 `webDeviceBinding`；Browser session exchange 若只寫 `deviceActivation`，admin 會看不到綁在哪台機器。正式登入/交換 token 時要 upsert `webDeviceBinding`，至少保存 masked device id、label/userAgent、lastIp、lastSeenAt。
   - 帳號管理預設先做「停用帳號」而不是 hard delete：設定 `user.banned=true` 並清 session。直接 delete user 會牽涉付款、組織、license、案件與 audit trail，不可在 AIRE admin 搜尋列表裸露一鍵硬刪。
   - AIRE SaaS admin/login 頁不能只驗 route 200；若 `app/layout.tsx` 沒 import `./globals.css`，production 會變成裸 HTML。最低 smoke 要檢查 live HTML 有 stylesheet chunk，或用 Chrome/Playwright 讀 computed style（例如 Figtree font、H1 非 16px、card border radius 非 0）。
   - customer fullflow e2e 的免費 entry preflight 必須先於 `AIRE_E2E_ALLOW_PAID_COP` gate 執行，否則會漏掉 signup/license/device 入口 404。
   - `apps/marketing/.vercel/project.json` 是 `aire-saas-site`，repo root `.vercel/project.json` 可能是別的 project；部署 AIRE SaaS 時不可從 repo root 直接吃錯 `.vercel`。若 Vercel project 設了 `rootDirectory=apps/marketing`，從 `apps/marketing` path deploy 會變成 `apps/marketing/apps/marketing`，要用乾淨 deployment root 並放正確 `.vercel/project.json`。
   - 建乾淨 Vercel deployment root 時，除了 `apps/marketing` 與 `packages`，還要包含 `tooling/typescript`（`@repo/tsconfig`）與 `tooling/tailwind`（`@repo/tailwind-config`），否則雲端 build 會找不到 `nextjs.json` 或 `theme.css`。
   - Next API routes 不可在頂層 import 會立即讀 `DATABASE_URL` 的 `@repo/auth` / `@repo/database`；Vercel/Next build 收集 page data 時會先載 route，造成 `DATABASE_URL is not set` build fail。改用 handler 內 lazy import。
   - staging readiness 必須和 production readiness 分開寫在 artifact；沒有固定 staging domain/env 時標 `staging_blocked`，不能覆蓋 production `pass`。
   - AIRE staging entry 既有固定 domain 是 `https://aire.staging.opcos.me`，不是 `https://aire-staging.opcos.me`；工具站 staging branch 可用 `https://aire-staging.aire-browser.pages.dev`。不要新增相近但未設 DNS 的 staging host，否則 Vercel alias 會卡在 certificate / DNS verification。
   - Vercel staging custom domain 可能仍開 Deployment Protection；一般 `curl` / Playwright 會看到 Vercel SSO 401 或導到 `vercel.com/login`。有 bypass secret 時用 `VERCEL_AIRE_AUTOMATION_BYPASS_SECRET` 或 `VERCEL_AUTOMATION_BYPASS_SECRET` 透過 `x-vercel-protection-bypass`；沒有 secret 時，只能用 `vercel curl` 做 protected entry HTML/exchange curl smoke，不能宣稱 staging entry browser login 已完整驗證。
   - Staging Browser build 要注入 staging entry/browser base：`NEXT_PUBLIC_AIRE_ENTRY_BASE_URL=https://aire.staging.opcos.me`、`NEXT_PUBLIC_AIRE_BROWSER_BASE_URL=https://aire-staging.aire-browser.pages.dev`。如果 entry base 還是 `https://aire.opcos.me`，未登入 staging 工具站會導回 production login，這不是合格 staging。
   - Staging Browser 若使用 production same-origin COP gateway `https://aire-browser.opcos.me/api/aire/cop/*`，Worker 與 Cloud Run backend 的 `AIRE_COP_ALLOWED_ORIGINS` 都必須包含 `https://aire-staging.aire-browser.pages.dev`；只改 Worker 不夠，backend 仍會回 403 `origin_not_allowed`。
   - 若本機沒有 `AIRE_BROWSER_SESSION_JWT_SECRET`，不要自簽假的 staging Browser token。可用 production entry 取得真實 serverVerified token 後只驗 staging Browser callback/gateway 授權邊界；這種 smoke 不可打正式 COP lookup，且 artifact 必須寫明 token source 與 Vercel Protection caveat。
   - `aire.opcos.me` 首頁公開「登入 / 註冊」CTA 必須留在 AIRE-owned login：`https://aire.opcos.me/login` 或 locale-equivalent，不可再導到 `https://opcos.me/login`。修這類 production SaaS 入口時，正確 implementation repo 是 `/Users/fishtv/Development/products/opcos.me` 的 `apps/marketing`，`products/AIRE` 只能當桌面/local workflow reference。
   - AIRE-owned login 不等於所有登入者都進案件工具。`super_admin` / `admin` 是主網站營運後台帳號，從 `aire.opcos.me/login` 完成登入交換時應導回 OPCOS 帳號中心後台（例如 `https://opcos.me/admin/users`）管理會員、授權序號與裝置；一般已授權客戶才進 AIRE Browser / 案件工具。
   - AIRE login 的忘記密碼也必須是 AIRE-owned route：`https://aire.opcos.me/forgot-password`，不可導回 OPCOS 母站。Better Auth reset redirect 要用 `new URL("/reset-password", window.location.origin).toString()`，讓重設信回到目前 AIRE origin；live smoke 預設只驗 route/form/眼睛 toggle，不要未經 Fish 明確同意就送真實 reset email。
   - AIRE SaaS live smoke 若要用 Playwright require `@playwright/test`，從 `/Users/fishtv/Development/products/opcos.me/apps/marketing` 執行；monorepo root 可能沒有該 scoped dependency，直接 `node` 會報 `Cannot find module '@playwright/test'`，這是測試執行路徑問題，不是產品 regression。
   - AIRE SaaS 部署前必須檢查 repo root `.vercelignore` 是否排除本機/其他子服務產物：`node_modules`、`**/node_modules`、`.next`、`**/.next`、`.turbo`、`**/.turbo`、`.wrangler`、`**/.wrangler`、`tmp`、`graphify-out`。若 `vercel deploy --archive=tgz` 顯示上傳約 GB 級，先跑 `du -sh . apps/* node_modules tmp graphify-out` 找大目錄，不要直接接受；AIRE marketing 小站不應把 SO 的 Cloudflare `.wrangler` cache 或本機測試產物一起上傳。
   - 若 `vercel env pull` 顯示 `DATABASE_URL` key 存在但拉下來是空字串，不能用本機 `packages/database/.env` 當 production truth；本機 DB 可能查不到 live user。要改 production AIRE access 時，優先用既有 secret-protected endpoint 或 live DB truth path，並在 artifact 標明 env access blocker。
   - 對既有使用者（例如 Fish 的帳號）補 AIRE access/admin 時，不要重設密碼。使用 secret-protected bootstrap 時要帶 `preservePassword: true`，並驗 response 有 `passwordPreserved: true`、`licenseStatus: ACTIVE`，且沒有輸出 password / license key。
   - AIRE 自動開通若台灣金流 provider 尚未決定，不要卡在 Stripe/LemonSqueezy/Polar/Creem/DodoPayments 選型；先做 `AIRE_PAYMENT_WEBHOOK_SECRET` + `X-AIRE-Payment-Signature` 的中立 HMAC webhook 端口，payload 統一成 `event=payment.succeeded`、`email`、`productId`。未來台灣金流只新增 adapter，把 provider payload 轉成這個中立 contract。
   - AIRE payment plan 映射先用測試 product ID（例如 `aire-test-basic` / `aire-test-pro` / `aire-test-vip`）與 `AIRE_PAYMENT_PLAN_MAP_JSON` 覆蓋，不要把未決定的台灣金流商品 ID 寫死成 blocker。
   - 在 monorepo package 新增 workspace dependency（例如 `packages/payments` 新增 `@repo/mail`）後，要跑 `pnpm install` 讓 `node_modules/@repo/*` symlink 與 lockfile 對齊；只改 `package.json` 會讓 type-check / Vitest 報 `Cannot find module '@repo/mail'`。
   - AIRE Browser Cloudflare Pages deploy 若專案 `.env` 有低權限 `CLOUDFLARE_API_TOKEN`，Wrangler 會自動載入並覆蓋 `~/.wrangler/config/default.toml` OAuth，即使 shell `env` 沒顯示也可能部署失敗。可用空 env 檔：`printf '' > /tmp/aire-empty-wrangler.env && wrangler pages deploy out --project-name aire-browser --branch main --env-file /tmp/aire-empty-wrangler.env`，部署後再用 Chrome/Playwright smoke 驗 live DOM。
   - `aire-browser.opcos.me` production login 不可因 `window.__AIRE_BROWSER_LOCAL_FIRST__` 產生 `aire_session_*` local-only token；production Browser auth guard 會拒絕 local token。Browser production host 的 Email/Google/LINE login 必須 handoff 到 `https://aire.opcos.me/login?returnTo=<absolute browser returnTo>`，由 AIRE SaaS exchange 產生 server-verifiable Browser token。
   - 管理員帳號可以同時是 AIRE Browser 使用者。AIRE SaaS login/exchange 不可用「platform admin 一律回 admin」判斷覆蓋 Browser 入口；只有原始 `returnTo` 是 admin path 時才加入 `adminReturnTo`。若 `returnTo` 是 `https://aire-browser.opcos.me/...`，即使登入者是 `super_admin` / `admin`，只要 AIRE license 有效也應簽 Browser token 進工具站。
   - AIRE admin 的 Browser 測試入口要走獨立 `adminSupport=1` exchange flow，並在 JWT claim 標 `sessionType: "admin_support"`；不要靠一般 Browser login 的 adminReturnTo 分支測試管理員工具站可用性。
   - 舊 AIRE 申請者或曾被停用的帳號若登入後出現 `aire_license_context_required` / `license_missing` / generic 授權錯誤，預設排查順序是：
     1. 先確認 Fish 測的 live runtime / bundle 與你修的 repo 一致
     2. 再檢查 user 是否 `banned`
     3. 再檢查是否缺 membership、`lastActiveOrganizationId`、ACTIVE AIRE license
     4. 再決定是否走 secret-protected legacy recovery 或 admin reactivation
   - legacy recovery / admin reactivation 的正式修法不可用 raw DB 手改代替；要走 shared recovery helper，同時補齊 organization、membership、`lastActiveOrganizationId`、ACTIVE AIRE license，並在需要時清除 `banned`、`banReason`、`banExpires`。
   - 對既有使用者補 AIRE access 時，不可隱式重設密碼。若走 secret-protected recovery，必須帶 `preservePassword: true`，並驗 response 有 `passwordPreserved: true`、`reactivated` / `recoveryApplied` / `missingLinksBefore` 這類 safe diagnostics；response 不可輸出 raw password、secret 或完整 license key。

## 建議工具

### 檢查交付狀態

```bash
node scripts/check-pilot-release.mjs --change <change-name>
```

### 產出已簽名 Windows 安裝包

```bash
gh workflow run release.yml --ref <branch-or-tag> -f customer_release=true
```

前提：
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_TRUSTED_SIGNING_ENDPOINT`
- `AZURE_TRUSTED_SIGNING_ACCOUNT`
- `AZURE_TRUSTED_SIGNING_CERT_PROFILE`

如果 secrets 沒設好，workflow 會停在 signing gate，這是預期行為，不可把 unsigned installer 當客戶正式版。

這支腳本會總結：

- branch / commit / dirty
- `pnpm type-check`
- full Playwright
- `spectra analyze`
- `spectra validate`
- Windows trust 狀態
- UTM runtime evidence 狀態
- 最終交付狀態

### 收集 Windows 驗收證據

```bash
node scripts/collect-windows-evidence.mjs \
  --commit <sha> \
  --installer <filename> \
  --installer-source <source> \
  --vm-name <utm-vm-name> \
  --status <pilot-runtime-accepted|pilot-runtime-blocked>
```

這支腳本會把 installer、UTM VM、截圖、PDF、blocker 收成固定 manifest。

## Browser / PDF 完成回報模板

回報 AIRE Browser / PDF SR 時，至少列：

- `Production URL`：實際驗證 URL，例如 `https://aire-browser.opcos.me`
- `Worker/Proxy`：部署版本或 curl 結果；若 blocked，列 Cloudflare error code
- `Downloads PDFs`：列出 `$HOME/Downloads/aire-browser-*.pdf` 的完整路徑與大小
- `Live E2E command`：實際跑過的 Playwright 指令與 project
- `Fixture matrix`：大樓、華廈、透天、別墅、商業用地、農業用地各自 pass/fail
- `Provider unavailable`：若位置圖/空拍圖/街景不可用，列 status 與可讀原因
- `Spectra`：`spectra analyze <change> --json` 結果

## 回答時的原則

- 先說白話結論
- 再分清楚是哪一層沒過
- 不把 install/launch 成功說成 fullflow 完成
- 不把 unsigned installer 說成正式客戶可交付

## 環境坑：Playwright browser binary 版本錯位（2026-06-08）

`opcos.me` monorepo 裡 `playwright@1.59.1` 套件要的 browser build 是 `chromium-1217`，但 `npx playwright@1.59.1 install` 在某些情況下只會抓到 `chromium_headless_shell-1208`（版本號不對齊），導致 `chromium.launch()` 直接報 `Executable doesn't exist`。

**正確修法**：不要用 `npx playwright install`，要用 repo 內已安裝套件自帶的 CLI，確保版本對齊：

```bash
cd /Users/fishtv/Development/products/opcos.me
PWBIN=$(find node_modules/.pnpm -maxdepth 1 -type d -name "playwright@*" | head -1)
node "$PWBIN/node_modules/playwright/cli.js" install chromium
```

這是環境缺件（不是產品 regression），標成 environment / deploy blocker。

## 環境坑：Vercel Sensitive vs Encrypted 環境變數分不出來（2026-06-08）

Vercel 的環境變數有兩種「看起來都加密」的型態：
- `encrypted`：可被 `vercel env pull` 或 Vercel REST API 讀回明文
- `sensitive`：一旦設定**永久無法讀回**，連設定者自己都看不到，連 API 也只回傳空字串

`vercel env ls` 的 CLI 輸出兩者都顯示成 `Encrypted`，肉眼完全分辨不出來。唯一分辨方式：

```bash
TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$HOME/Library/Application Support/com.vercel.cli/auth.json','utf8')).token)")
curl -sS "https://api.vercel.com/v10/projects/<projectId>/env?teamId=<teamId>" \
  -H "Authorization: Bearer $TOKEN" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j = JSON.parse(d);
  for (const e of j.envs) console.log(e.key, '| type:', e.type, '| hasValue:', !!e.value);
});"
```

**規則**：任何 SaaS 寄信 / 第三方 API key 設定到 Vercel production 時，**禁止選 Sensitive**，一律用標準 Encrypted。否則一旦值設錯（typo、複製貼上錯誤、用了未驗證網域），永遠無法事後驗證或排查，只能整個重設並猜測是否修好。這正是 `apps/aire-saas` ToSend 寄信失敗、卻完全找不到根因的主因。
