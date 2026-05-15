## Why

不動產經紀業管理條例規定說明書必須附「相關法規告知」一欄。目前仲介自己抄條文、版本可能過時，**用過時法規說明可能違反消費者保護法導致客訴或訴訟**。同時經紀人證號目前完全靠人工輸入，沒驗證機制，「假經紀人」風險存在。本 change 把法規條文嵌入 + 經紀人證號驗證做成自動化、AIRE 30,000 買斷必含的「合規剛需」功能（非加值訂閱），讓客戶不用為「不被告」付額外月費。

## What Changes

- 新增 OPCOS 雲端代理（取 Twinkle Hub / data.gov.tw 法規資料庫）：抓「不動產經紀業管理條例」+「消費者保護法相關條文」+「公平交易法相關條款」最新版本
- 新增本機 SQLite `legal_clauses` 表：cache 法規條文 + 版本號 + 抓取時戳，離線可用
- 新增背景同步機制：每次啟動 + 每 7 天 OPCOS 推播檢查更新，有新版自動拉
- 新增「法規告知」PDF 區塊（嵌入說明書末頁，所有主題共用）：標示「資料來源：法務部全國法規資料庫 / 版本日期 YYYY-MM-DD」
- 新增經紀人證號驗證：透過 OPCOS 代理打內政部不動產經紀人證書查詢 API → 即時驗證 + 顯示「✓ 已驗證 / ✗ 證號不存在 / ⚠ 過期」
- 修改既有 disclosure-form-residential / disclosure-form-land 加證號驗證 UI
- 修改 disclosure-document-generation 渲染管線整合新「法規告知」區塊

## Non-Goals

- 月租加值（這是基本款必含，含在 NT$30,000 買斷）
- 法規異動主動推播提醒（背景同步即可，不彈視窗打擾客戶）
- 全文檢索 / 法規查詢介面（PDF 只嵌入「告知」摘要章節，不做 SaaS 級檢索）
- 法律意見 / AI 解讀（純資料層、不做 LLM 解釋）
- 經紀人證號跨機構複查（單一資料源：內政部官方）
- 「假經紀人」自動阻擋下單（只顯示警示、不阻擋 — 留決定權給仲介老闆）
- 各縣市地方法規（先 cover 中央法規，地方版本 Phase 2 評估）

## Capabilities

### New Capabilities

- `legal-clauses-sync`: OPCOS 雲端代理抓法規資料 + 本機 SQLite cache + 背景同步排程 + 版本管理
- `legal-clauses-pdf-block`: 「法規告知」PDF 區塊（嵌入說明書末頁，所有主題共用）+ 資料來源 + 版本日期標示
- `realtor-license-verification`: 經紀人證號透過 OPCOS 代理驗證 + UI 三態顯示（已驗證 / 證號不存在 / 過期） + 失敗 fallback 不阻擋下單

### Modified Capabilities

- `disclosure-form-residential`: 加經紀人證號驗證 UI 觸發點與三態顯示
- `disclosure-form-land`: 同上
- `disclosure-document-generation`: 渲染管線整合「法規告知」PDF 區塊（在固定 4 頁尾端、頁碼計算納入）

## Impact

- Affected specs:
  - New: `legal-clauses-sync`, `legal-clauses-pdf-block`, `realtor-license-verification`
  - Modified: `disclosure-form-residential`, `disclosure-form-land`, `disclosure-document-generation`
- Affected code:
  - New:
    - `src-tauri/src/legal_clauses/mod.rs`（同步 + cache + 版本管理）
    - `src-tauri/src/legal_clauses/sync.rs`（OPCOS 代理呼叫）
    - `src-tauri/src/legal_clauses/cache.rs`（SQLite 操作）
    - `src-tauri/src/realtor_license/mod.rs`（證號驗證 + cache）
    - `src-tauri/migrations/003_legal_clauses.sql`（legal_clauses + realtor_licenses 兩表）
    - `src/lib/pdf-blocks/legal-notice.tsx`（PDF 法規告知區塊）
    - `src/components/RealtorLicenseField.tsx`（前端驗證 UI）
    - `src-tauri/src/legal_clauses/tests.rs`
    - `src-tauri/src/realtor_license/tests.rs`
    - `e2e/legal-clauses-sync.spec.ts`
    - `e2e/license-verification.spec.ts`
  - Modified:
    - `src/components/disclosure-form-residential.tsx`（接 RealtorLicenseField）
    - `src/components/disclosure-form-land.tsx`（同上）
    - `src/lib/pdf-engine/document.tsx`（嵌入 LegalNoticeBlock）
    - `src-tauri/src/main.rs`（註冊新 IPC commands）
    - `src-tauri/Cargo.toml`（reqwest 已有；可能加 schedule crate 處理 7 天背景同步）
- Dependencies 新增：
  - Cargo `tokio-cron-scheduler` ^0.12（背景同步排程）
- 環境變數新增：
  - `OPCOS_LEGAL_CLAUSES_ENDPOINT`（預設 `https://opcos.example.tw/v1/legal-clauses`，OPCOS 後端待部署實際 URL）
  - `OPCOS_REALTOR_LICENSE_ENDPOINT`（預設 `https://opcos.example.tw/v1/realtor-license`）
