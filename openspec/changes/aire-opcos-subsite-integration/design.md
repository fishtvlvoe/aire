## Context

AIRE 已有桌面 App、正式品牌圖示與 OPCOS 帳號/授權中台。`aire.opcos.me` 目前作為 AIRE 公開入口，但內容仍需要從模板頁調整成真正的產品入口：清楚說明 AIRE 是不動產仲介桌面工具、資料留在本機、透過 OPCOS 完成登入與授權管理，並提供可驗證的導向與部署 smoke 測試。

本次跨兩個邊界：AIRE repo 保存產品與隱私契約，OPCOS marketing app 實作子網站頁面、CTA 與 production smoke。AIRE 不承接屋主個資雲端化；OPCOS 只承接帳號、授權、下載、更新與公開內容。

## Goals / Non-Goals

**Goals:**

- 建立 `aire.opcos.me` 的 SR/SDD 契約，讓 AIRE 子網站有可驗收的內容、導向與隱私邊界。
- 讓首頁第一屏明確呈現 AIRE 品牌、官方圖示、不動產說明書工作流與 OPCOS 登入/授權 CTA。
- 讓 OPCOS 產品頁與 AIRE 子網站在登入、註冊、授權管理、下載/啟用入口上保持一致。
- 用 production smoke 驗證正式站頁面、AIRE icon 資產、OPCOS redirect 與 CTA URL。

**Non-Goals:**

- 不把 AIRE 桌面 App 改成 Web SaaS。
- 不新增屋主、案件、謄本、現況調查資料的雲端儲存。
- 不實作 AI 平面圖、PDF 產生、地政 API 代理或桌面自動更新邏輯。
- 不新增新的金流、定價、付款 provider 或授權 schema。

## Decisions

### Decision 1: AIRE 子網站作為產品入口，OPCOS 作為帳號與授權中台

`aire.opcos.me` 承接產品說明、下載/啟用入口與導向；`opcos.me` 承接登入、註冊、授權管理與帳號設定。跨站導向必須只導往白名單 URL，登入後回到 AIRE 產品上下文。

Alternatives Considered:

- 把登入與授權 UI 全部複製到 AIRE 子網站：否決，會產生兩套 auth/session 行為，增加 LINE/Google callback 與帳號連結風險。
- 讓 AIRE 子網站只當靜態品牌頁，不接 OPCOS：否決，使用者無法從產品頁完成購買、登入、授權與下載流程。

### Decision 2: AIRE 子網站內容必須強調桌面 App 與本機資料邊界

首頁文案與版面必須直接說明 AIRE 是房仲不動產說明書桌面工具，案件資料、屋主個資與 API key 不上傳雲端。OPCOS 只管理帳號、授權、下載與更新入口。

Alternatives Considered:

- 使用一般 SaaS 行銷模板文案：否決，會誤導使用者以為案件資料存在雲端，與 AIRE 隱私定位衝突。
- 用抽象 AI 生產力文案取代房仲工作流：否決，無法讓目標客戶辨識 AIRE 解決的是不動產說明書與店面授權問題。

### Decision 3: 正式站驗收以 production smoke 為完成條件

本次完成標準不是本機畫面看起來正常，而是正式站 `https://aire.opcos.me` 與 `https://opcos.me/products/aire` 都能被 Playwright production smoke 驗證。驗證必須涵蓋頁面載入、官方 icon 資產、CTA URL、登入 redirect 與不出現模板文案。

Alternatives Considered:

- 只跑 unit test：否決，無法驗證 Vercel alias、public asset routing 與跨站 redirect。
- 只手動打開頁面：否決，無法留下可重跑的回歸證據。

## Implementation Contract

Behavior:

- 使用者開啟 `https://aire.opcos.me` 時，第一屏看到 AIRE 官方圖示、AIRE 名稱、繁中產品定位與不動產桌面 App 價值，而不是模板式 SaaS dashboard 或泛用 AI 文案。
- 使用者從 AIRE 子網站點登入/開始使用時，導向 `https://opcos.me/login` 或 OPCOS AIRE 產品管理入口，且 redirect 保留 AIRE 產品上下文。
- 使用者從 OPCOS AIRE 產品頁回到 AIRE 子網站時，URL 不含換行、錯誤 query 或未清理的 OAuth error。
- AIRE 子網站明確揭露雲端/本機邊界：OPCOS 管帳號授權，AIRE 桌面 App 管案件資料與 PDF 工作流。

Interface / data shape:

- Public routes: `https://aire.opcos.me/` and `https://opcos.me/products/aire`.
- Required public assets: `https://aire.opcos.me/aire-icon-dark.png` and `https://aire.opcos.me/aire-icon-light.png` return HTTP 200.
- CTA targets use absolute HTTPS URLs with whitespace trimmed before render.
- Production smoke returns pass/fail through Playwright list reporter.

Failure modes:

- If AIRE icon public assets are routed through locale catch-all or return non-200, production smoke fails.
- If CTA URL contains newline, whitespace, OAuth error query, or an unapproved host, production smoke fails.
- If page copy contains blocked template strings such as generic dashboard metrics or unrelated SaaS placeholders, unit copy test fails.
- If the user must complete LINE/Gmail OAuth authorization, automated smoke stops before the provider login screen and leaves manual verification to Fish.

Acceptance criteria:

- `spectra analyze aire-opcos-subsite-integration --json` reports no Critical or Warning findings.
- `spectra validate aire-opcos-subsite-integration` succeeds with 0 warnings.
- OPCOS marketing tests covering AIRE route copy, URL trimming, asset routing, and production smoke pass.
- Formal deployment promotes the OPCOS marketing project that serves `https://aire.opcos.me`.
- Post-deploy smoke confirms `https://aire.opcos.me`, icon assets, and OPCOS AIRE product redirect behavior.

Scope boundaries:

- In scope: public website content, route wiring, CTA targets, asset serving, smoke tests, and SR/SDD artifacts.
- Out of scope: AIRE desktop storage model changes, license DB schema changes, OAuth provider dashboard configuration, payment provider setup, AI floor plan feature work.

## Risks / Trade-offs

- [Risk] AIRE SR lives in this repo while website code lives in OPCOS marketing app → Mitigation: SR records the product contract and tasks explicitly mark external OPCOS implementation and verification.
- [Risk] Cross-domain login redirect can regress into homepage fallback → Mitigation: production smoke must test allowed AIRE redirect and reject stale error query behavior.
- [Risk] Marketing copy drifts back to generic SaaS language → Mitigation: copy regression test blocks known template strings and asserts AIRE-specific phrases.
- [Risk] Official icon assets fail because public routing catches image paths → Mitigation: smoke tests call icon URLs directly and assert HTTP 200.

## Migration Plan

1. 建立並驗證本 SR/SDD artifacts。
2. 在 OPCOS marketing app 實作 AIRE 子網站內容、CTA 與 production smoke。
3. 跑 OPCOS marketing unit/type/build/production smoke。
4. 部署 OPCOS marketing production，確認 `https://aire.opcos.me` alias Ready。
5. 用 production smoke 回讀正式站。

Rollback strategy:

- 若部署後 `aire.opcos.me` smoke 失敗，使用 Vercel promotion 回滾到上一個 Ready deployment。
- 若只是文案或 CTA 錯誤，以單一 hotfix commit 修正 OPCOS marketing app，再重新部署。
- 若 SR 契約需要改變，更新本 change artifacts 並重新跑 analyze/validate 後再繼續 apply。

## Open Questions

- AIRE 下載檔正式公開 URL 尚未定案；本次 CTA 使用 OPCOS 產品管理入口承接，下載檔 URL 定案後另開 SR 或 ingest 本 SR。
- 授權購買流程的付款 provider 不在本次決策範圍；本次只保留導向 OPCOS 帳號/授權入口。
