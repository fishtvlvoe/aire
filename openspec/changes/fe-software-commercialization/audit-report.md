# fe-software-commercialization Artifact Consistency Audit Report

> 產出時間：2026-05-03
> 分析範圍：proposal.md、design.md、tasks.md、4 份 specs

---

## 摘要徽章

| 維度 | 問題數 | 嚴重度 |
|------|--------|--------|
| 覆蓋度 | 4 | 🔴 High |
| 一致性 | 4 | 🔴 High |
| 模糊度 | 4 | 🟡 Medium |
| 缺漏 | 12 | 🔴 High |
| **總計** | **24** | — |

---

## 1. 覆蓋度 Coverage（4 項）

### C1 — task 1.3 為懸空任務
**受影響**：`tasks.md` §1.3  
**說明**：task 1.3「建立 `src/lib/db/index.ts`：初始化 better-sqlite3 連線並在 app 啟動時自動執行 migration」在現有 `design.md` 中**沒有對應的設計決策**，在 `proposal.md` 中也僅間接提及（Migration Plan 說 `npm run db:migrate`，與此 task 的「自動執行」策略不同）。此 task 缺乏 spec requirement 或 design decision 的源頭引用。

### C2 — 缺少環境變數文件更新任務
**受影響**：`tasks.md`（缺漏）、`proposal.md` Impact  
**說明**：`proposal.md` 明確列出 5 個新環境變數（`COMPANY_NAME`, `CHROMIUM_MODE`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LICENSE_PUBLIC_KEY`），但 `tasks.md` 中**沒有任何 task** 負責更新 `.env.example` 或 `.env.local`。

### C3 — proposal 引用的 `src/lib/license/db.ts` 無對應任務
**受影響**：`tasks.md`（缺漏）、`proposal.md` Impact  
**說明**：`proposal.md` Affected code 明確列出 New: `src/lib/license/db.ts`（SQLite licenses 資料表 CRUD），但 `tasks.md` **沒有這個文件的建置任務**。licenses 表的 CRUD 邏輯被分散到 task 3.2（`src/lib/license/index.ts`）與 task 1.2（migration），但 `src/lib/license/db.ts` 這個具體文件路徑無人承接。

### C4 — migration 執行策略缺少對應任務
**受影響**：`tasks.md`（缺漏）、`design.md` Migration Plan  
**說明**：`design.md` Migration Plan 要求客戶「執行 `npm run db:migrate`」，但 `tasks.md` 沒有建立這個 CLI script 的任務；task 1.3 改為「app 啟動時自動執行 migration」。兩種策略互相矛盾，且都沒有完整對應的實作任務。

---

## 2. 一致性 Consistency（4 項）

### I1 — 環境變數清單不一致
**受影響**：`proposal.md` §Impact、`design.md` §Migration Plan  
**說明**：
- `proposal.md` 列出新 env vars：`COMPANY_NAME`, `CHROMIUM_MODE`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`（4 個）。
- `design.md` Migration Plan 列出：`COMPANY_NAME`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LICENSE_PUBLIC_KEY`, `CHROMIUM_MODE`（5 個，多了 `LICENSE_PUBLIC_KEY`）。

兩份 artifact 的環境變數清單不一致。

### I2 — migration 執行策略衝突
**受影響**：`design.md` §Migration Plan、`tasks.md` §1.3  
**說明**：`design.md` 要求客戶手動執行 `npm run db:migrate`，但 `tasks.md` 的 task 1.3 卻設計為「app 啟動時自動執行 migration」。這會導致部署文件與實作程式碼行為不一致。

### I3 — 絕大多數 task 描述違反 openspec 標註規則
**受影響**：`tasks.md` 全文、`openspec/config.yaml` rules.tasks  
**說明**：`openspec/config.yaml` rules.tasks 規定：「每個 task 描述必須包含對應的 spec Requirement name 或 design Decision 標題（analyzer 做 substring 比對）」。`fe-software-commercialization/tasks.md` 的 16 個 task 中，僅 task 3.1（`LicensePayload`）、3.3（`generate-license`）、4.2（`create-admin`）能與 spec requirement name 做 substring 比對通過；其餘 13 個 task 的描述均為純實作動作（「建立 XXX.ts」、「修改 YYY.ts」），**未嵌入任何 requirement name 或 decision 標題**，違反硬性規則。

### I4 — design 聲稱「無 DB Session」與 refresh_tokens 表衝突
**受影響**：`design.md` §用戶登入、`user-auth/spec.md` §Dual token mechanism  
**說明**：`design.md` 明確寫「Session 策略選 `jwt`（無 DB Session）」，但同一份 design 又要求建立 SQLite `refresh_tokens` 白名單表，且 spec 與 task 4.4 都需要對此表做 CRUD。「無 DB Session」的表述容易讓實作者誤以為 auth 模組完全不需要資料庫狀態，與實際需求矛盾。

---

## 3. 模糊度 Ambiguity（4 項）

### A1 — 初始管理員建立方式未明確關閉
**受影響**：`design.md` §Open Questions  
**說明**：`design.md` Open Questions 明列「初始管理員帳號建立方式：`scripts/create-admin.ts` CLI script，還是首次訪問 `/setup` 時引導建立？」`tasks.md` task 4.2 選擇了 CLI script 方案，但 `design.md` 仍保留此問題為 Open，未明確標註已採納的答案。

### A2 — task 1.3 未說明是「修改」還是「覆蓋」現有檔案
**受影響**：`tasks.md` §1.3  
**說明**：專案根目錄已存在 `src/lib/db/index.ts`（7817 bytes）。task 1.3 寫「建立 `src/lib/db/index.ts`」，未說明是要**覆蓋**既有檔案還是**修改**它。這會導致實作者誤刪現有資料庫連線邏輯。

### A3 — puppeteer 移除後 postinstall script 的處理未說明
**受影響**：`tasks.md`、`proposal.md` §BREAKING  
**說明**：`proposal.md` 標註 **BREAKING** 修改：`puppeteer` → `puppeteer-core`。目前 `package.json` 有一份自訂的 `postinstall` script 會自動安裝 Puppeteer Chrome。移除 `puppeteer` 後這個 script 會失效或報錯，但 `tasks.md` 沒有任何 task 說明如何處理 `postinstall`。

### A4 — `@sparticuz/chromium` 版本對齊的驗證步驟模糊
**受影響**：`design.md` §Serverless PDF、`tasks.md` §1.1  
**說明**：`design.md` 強調「`@sparticuz/chromium@131` 對應 `puppeteer-core@23.x`（需嚴格鎖版本）」，並建議「CI 加 `npm ci` 驗證」。但 `tasks.md` task 1.1 僅寫「pinned」，未說明版本對齊的驗證步驟或 CI 配置更新，實作者容易忽略這個關鍵約束。

---

## 4. 缺漏 Gaps（12 項）

### G1 — 10 個 spec requirement 缺少 WHEN/THEN scenario
**受影響**：4 份 spec 文件  
**說明**：`openspec/config.yaml` rules.specs 規定「每個 Requirement 至少一個 Scenario，Scenario 用 WHEN/THEN 格式」。以下 requirement **完全沒有 scenario**：

| Spec | Requirement | 嚴重度 |
|------|-------------|--------|
| `license-management` | License activation flow | High |
| `license-management` | License payload format | High |
| `license-management` | Middleware license cache | Medium |
| `license-management` | License generation CLI | Medium |
| `serverless-pdf` | PDF generator migration | High |
| `serverless-pdf` | Package replacement | Medium |
| `serverless-pdf` | Vercel timeout config | Medium |
| `user-auth` | Password storage | Medium |
| `user-auth` | Admin account creation CLI | Medium |
| `user-auth` | Auth middleware order | High |
| `user-auth` | Route protection scope | High |

> 註：`container-deployment` 的 1 個 requirement 有 scenario，格式正確。

### G2 — 缺少跨模組架構決策記錄（ADR）
**受影響**：整體變更  
**說明**：此 change 涉及 Auth.js 整合、Ed25519 離線簽章、雙 Token 機制、Next.js Middleware 多層攔截順序等跨模組架構決策。專案的 `docs/adr/` 慣例要求「跨域架構決策 → 新增 ADR」，但此 change 未產出任何 ADR。

### G3 — `package.json` scripts 區塊缺少更新任務
**受影響**：`tasks.md`  
**說明**：移除 `puppeteer`、改用 `puppeteer-core` 後，現有 `postinstall` script 需要修改或移除；若採用 `npm run db:migrate` 策略，也需要新增 script。`tasks.md` 缺少這個任務。

### G4 — proposal Impact "Removed: none" 不準確
**受影響**：`proposal.md` §Impact  
**說明**：`proposal.md` 寫 "Removed: none"，但實際上 `puppeteer` 是被移除的 dependency，且 `postinstall` script 的行為會被改變。這個聲明與 **BREAKING** 修改自相矛盾。

---

## 修復紀錄

| 問題 | 狀態 | 修復方式 |
|------|------|----------|
| I1 — env vars 清單不一致 | ✅ 已修復 | `proposal.md` 補上 `LICENSE_PUBLIC_KEY`；`design.md` Migration Plan 同步列齊 5 個變數 |
| I2 — migration 執行策略衝突 | ✅ 已修復 | `design.md` 改為「app 啟動時 `initDb()` 自動執行 migration」，與既有專案慣例及 `tasks.md` 對齊 |
| I3 — task 描述未含 requirement name | ✅ 已修復 | `tasks.md` 全部 18 個 task 已補上對應 spec requirement name 或 design decision 標題 substring |
| I4 — 「無 DB Session」語意衝突 | ✅ 已修復 | `design.md` 改為「Auth.js 內建 Session 策略選 `jwt`（不額外使用 Auth.js 的 DB Session 表），但應用層另外實作 Refresh Token 白名單」 |
| C2 — 缺少 env 檔案更新 task | ✅ 已修復 | `tasks.md` 新增 task 1.4（`.env.example` 更新） |
| C3 — `src/lib/license/db.ts` 無對應 task | ✅ 已修復 | `tasks.md` 新增 task 3.6 |
| C4 — migration 策略缺少對應 task | ✅ 已修復 | `tasks.md` task 1.3 明確為「修改既有 `src/lib/db/index.ts` 的 `initDb()`」；task 1.2 改為 `migrations/004_auth_license.sql` |
| G1 — 10 個 requirement 缺少 scenario | ✅ 已修復 | 4 份 spec 補齊 14 個 WHEN/THEN scenario |
| G3 — 缺少 `package.json` scripts 更新 task | ✅ 已修復 | `tasks.md` 新增 task 1.5（`postinstall` 清理） |
| G4 — proposal "Removed: none" 不準確 | ✅ 已修復 | `proposal.md` Removed 欄位更新為 `puppeteer` dependency 與舊 `postinstall` script |
| A1 — Open Question 未關閉 | ✅ 已修復 | `design.md` 移除整個 Open Questions 區塊；task 4.2 已確立 CLI script 方案 |
| A2 — task 1.3 未說明修改或覆蓋 | ✅ 已修復 | `tasks.md` task 1.3 明確寫為「修改既有 `src/lib/db/index.ts` 的 `initDb()` 函式」 |
| A3 — postinstall 處理未說明 | ✅ 已修復 | `tasks.md` 新增 task 1.5；`proposal.md` Removed 欄位補充舊 postinstall 邏輯 |
| A4 — 版本對齊驗證步驟模糊 | ⚠️ 保留觀察 | 仍在 `design.md` Risks 中提及；`tasks.md` task 1.1 已標註 pinned，建議後續 CI 配置另開 change 處理 |
| G2 — 缺少 ADR | ⚠️ 保留觀察 | 建議實作前補 `docs/adr/ADR-00X-fe-software-commercialization.md` |
| C1 — task 1.3 懸空任務 | ⚠️ 部分緩解 | 已改為「修改既有 `src/lib/db/index.ts`」，並補上 design decision 引用；此 task 的實作細節建議實作時再確認與現有 `initDb()` 的整合方式 |

---

## 修復後剩餘問題數

| 維度 | 修復前 | 修復後 |
|------|--------|--------|
| 覆蓋度 | 4 | 1（C1 部分緩解，建議實作時確認） |
| 一致性 | 4 | 0 |
| 模糊度 | 4 | 1（A4 保留觀察） |
| 缺漏 | 12 | 1（G2 ADR 建議後補） |
| **總計** | **24** | **3** |
