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
   - 若 bundle grep 還看得到 `/api/aerial-photo`、`/api/location-map`，要用 Playwright network assertion 判斷實際 production 是否仍呼叫同源 API，不可只看字串下結論

9. Cloudflare deploy 權限要分清楚
   - `wrangler whoami` 失敗不一定代表 token 無效，可能是 token 不能列 accounts
   - `wrangler login` 若一直提示 `logged in with an API Token`，優先檢查專案 `.env` / shell wrapper 是否自動注入 `CLOUDFLARE_API_TOKEN`；可改從 `$HOME` cwd 並用 `env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID -u CF_API_TOKEN -u CF_API_KEY ...`
   - 標準 credential 可先查 `~/.cloudflared/api-tokens.json`，但回報時一律遮罩 token
   - token verify active 只代表 token 有效，不代表有 Workers Scripts / Pages Edit 權限
   - deploy 若回 `Authentication error [code: 10000]`，要回報為 Cloudflare token permission blocker，不要說程式壞掉
   - 部署 Worker 時用 `--keep-vars`，避免覆蓋 Dashboard secrets，例如 Google key 或 proxy token

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

### 收集 Windows 驗收證據

```bash
node scripts/collect-windows-evidence.mjs \
  --commit <sha> \
  --installer <filename> \
  --installer-source <source> \
  --vm-name <utm-vm-name> \
  --status <pilot-runtime-accepted|pilot-runtime-blocked>
```

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

## 14. 專案開發與測試環境坑

### Node.js (Vitest) 與 `server-only` 衝突
- **問題**：引入含有 `import "server-only";` 的 server logic 時，Vitest 執行測試會因 `server-only` 被加載而丟出 `This module cannot be imported from a Client Component module` 崩潰。
- **解法**：在測試檔案頂部加上 mock：
  ```typescript
  vi.mock("server-only", () => ({}));
  ```

### Prisma Shadow Database 遷移失敗
- **問題**：Shadow DB 在本機套用歷史遷移時可能因 missing relation 報錯，導致 `prisma migrate dev` 失敗。
- **解法**：若僅新增欄位/表且無破壞性變更，可改用 `prisma db push` 將 schema 同步至 local DB，並執行 `prisma generate` 產生 client。
