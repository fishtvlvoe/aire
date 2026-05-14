## 1. SQLite migration + 後端基礎

- [ ] [P] 1.1 寫 `src-tauri/migrations/003_legal_clauses.sql` 建 `legal_clauses` 表（law_id PK / title / content_markdown / version_date / fetched_at / source_url）+ `realtor_licenses` 表（license_number PK / status CHECK in verified/not_found/expired / verified_at / cache_expires_at）。對應 Decision 2: 法規 cache 採本機 SQLite（離線優先）+ Decision 7: 經紀人證號 cache 7 天。驗證：`cargo test legal_clauses::migration::tests::tables_created` 通過。
- [ ] [P] 1.2 在 `src-tauri/src/legal_clauses/mod.rs` 實作 `LegalClause` struct + `LegalClausesError` enum（CacheWriteFailed / OpcosUnreachable / LawNotFound / EmptyCacheNoNetwork）。驗證：`cargo test legal_clauses::types::tests` 全綠（含 serde round-trip 與 error variant match）。

## 2. OPCOS 法規同步 client

- [ ] 2.1 在 `src-tauri/src/legal_clauses/sync.rs` 實作 `fetch_version()` + `fetch_law(law_id)` 對 OPCOS endpoint 的 reqwest 呼叫（Decision 1: 法規資料源走 OPCOS 雲端代理（非 AIRE 直接打 data.gov.tw / Twinkle Hub） + Decision 8: OPCOS 端點走 HTTPS + Bearer token（既有授權架構））。timeout 5s，401 觸發既有 OPCOS 重新驗證 + 自動帶 Authorization: Bearer 既有 OPCOS session token。對應 Requirement: System SHALL sync three central laws from OPCOS proxy。驗證：`cargo test legal_clauses::sync::tests` 全綠（mock OPCOS 200/401/timeout 三 case + Authorization header 含 Bearer prefix 驗證）。
- [ ] 2.2 在 `src-tauri/src/legal_clauses/cache.rs` 實作 SQLite cache 寫入：`upsert_law(law)` 用 INSERT OR REPLACE + `get_law(law_id)` + `list_laws()` + `max_fetched_at()`（用於計算 "N 天前版本"）。對應 Requirement: SQLite writes SHALL be atomic per law。驗證：`cargo test legal_clauses::cache::tests::partial_sync_preserves_successful_rows` 通過。
- [ ] 2.3 在 `src-tauri/src/legal_clauses/mod.rs` 組合 `sync_legal_clauses()` 入口：`fetch_version` → 比對本機 → 並行 fetch 三條法規 → 各自 upsert → 回 SyncResult。對應 Requirement: System SHALL expose `sync_legal_clauses` and `get_legal_clause` IPC commands + Requirement: Sync SHALL not block the UI。驗證：`cargo test legal_clauses::sync::tests::three_laws_sync_concurrent` 通過 + `tokio::spawn` 不阻塞主執行緒。
- [ ] 2.4 處理離線 fallback：`sync_legal_clauses()` 偵測 OPCOS 不可達（network error / 5xx / timeout > 5s）→ 回 `SyncResult::FallbackToCache` 或 `EmptyCacheNoNetwork`，UI 顯示「⚠ 法規同步失敗，使用 N 天前版本」（OPCOS 統一文案）。對應 Requirement: Offline mode SHALL fall back to local cache。驗證：`cargo test legal_clauses::sync::tests::offline_fallback_to_cache` + `offline_no_cache_returns_empty` 兩 case 通過。

## 3. 7 天背景排程

- [ ] 3.1 在 `src-tauri/src/legal_clauses/scheduler.rs` 用 `tokio-cron-scheduler` 設「每 7 天觸發 sync_legal_clauses()」cron job（Decision 3: 同步策略採「啟動時 + 每 7 天」雙觸發）。對應 Requirement: Sync SHALL trigger on app start and every 7 days。驗證：`cargo test legal_clauses::scheduler::tests::seven_day_callback_fires` 使用 time travel mock 驗證 7 天後 callback 被呼叫。
- [ ] 3.2 在 `src-tauri/src/main.rs` app 啟動時呼叫 `sync_legal_clauses()` 一次（背景 tokio::spawn 不阻塞 UI）+ 註冊 scheduler。驗證：啟動 + 1 秒內 `legal_clauses` 表有 3 行（在 mock OPCOS 環境下）。

## 4. 經紀人證號驗證後端

- [ ] [P] 4.1 在 `src-tauri/src/realtor_license/mod.rs` 實作 `LicenseStatus` enum (Verified / NotFound / Expired) + `LicenseVerificationResult` struct（含 source: cache / fresh / offline）+ `RealtorLicenseError` enum。對應 Requirement: System SHALL expose `verify_realtor_license` IPC command。驗證：`cargo test realtor_license::types::tests` serde + variant match 全綠。
- [ ] 4.2 在 `src-tauri/src/realtor_license/client.rs` 實作 OPCOS endpoint 呼叫（reqwest GET `/v1/realtor-license/{number}`），timeout 3s（Decision 6 + Requirement: Verification request SHALL timeout after 3 seconds）。對應 Requirement: System SHALL verify license number via OPCOS proxy with 500ms debounce（後端負責 fetch、前端負責 debounce）。驗證：`cargo test realtor_license::client::tests::timeout_3s_aborts` 通過。
- [ ] 4.3 在 `src-tauri/src/realtor_license/cache.rs` 實作 SQLite cache：`upsert_verification(license, status)` 設 verified_at = now、cache_expires_at = now + 7d；`get_cached(license)` 過期回 None。對應 Decision 7: 經紀人證號 cache 7 天（同法規同步週期）+ Requirement: System SHALL cache verification results for 7 days。驗證：`cargo test realtor_license::cache::tests::cache_hit_within_7d` + `cache_miss_after_7d` 兩 case 通過。
- [ ] 4.4 組合 `verify_realtor_license(license_number)` IPC 入口：(1) 查 cache → hit 回 source=cache；(2) miss 或過期 → OPCOS fetch → 寫 cache → 回 source=fresh；(3) OPCOS 不可達且 cache 過期 → 回 source=offline 帶最後驗證日期；(4) timeout → source=offline + UI 顯示「⚠ 驗證逾時」。對應 Requirement: Fresh verification returns source 'fresh' + Cache hit returns source 'cache' + Offline with cache shows last-known result with date。驗證：`cargo test realtor_license::verify::tests` 含 4 個 source 路徑 case 全綠。

## 5. PDF 法規告知區塊

- [ ] [P] 5.1 在 `src/lib/pdf-blocks/legal-notice.tsx` 實作 `<LegalNoticeBlock laws={LegalClause[]}>` 元件：頭部 break={true}（Decision 4: 法規告知 PDF 區塊在「固定 4 頁」尾端、所有主題共用 + Requirement: Block SHALL fit at the start of a new page (page break before)）。每條法規一個 sub-section：title heading + content_markdown 渲染為 PDF Text + footer 三行 metadata（資料來源 / 版本日期 / 同步日期）（Decision 5: PDF 區塊顯示「資料來源 + 版本日期」防責任歸屬糾紛）。對應 Requirement: Block SHALL display three laws with version metadata。驗證：`npm test src/lib/pdf-blocks/__tests__/legal-notice.test.tsx` 三 Text node match 三 title + 三 footer 含「資料來源：」字串。
- [ ] 5.2 在 `src/lib/pdf-blocks/legal-notice.tsx` 採用 `useTheme()` 取得 heading color / body color / fontSize / spacing tokens，禁止 hardcoded hex（Decision 9: UI 設計系統 — 與 OPCOS 共用視覺 token + Requirement: Block SHALL consume theme tokens for typography）。驗證：grep `'#[0-9a-fA-F]\{3,6\}' src/lib/pdf-blocks/legal-notice.tsx` 結果為空 + `npm test src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx` 確認 theme-a / theme-c 兩個主題 heading color 不同。
- [ ] 5.3 法規區塊處理 wrap + 續下頁標示：使用 @react-pdf wrap={true} + 在 footer 條件渲染 Text「（續下頁）」當實際被分頁時。對應 Requirement: Block SHALL handle long content via wrap and continuation。驗證：`npm test src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx` 渲染 200 行長文字 → PDF 至少 2 頁 + 第一頁底部含「（續下頁）」。
- [ ] 5.4 空 cache 渲染 placeholder：當 `laws` 為空陣列時 → 渲染單一 Text「（法規資料同步中，下次重新產出說明書時將自動補入）」。對應 Requirement: Block SHALL render empty-state placeholder when cache is empty。驗證：`npm test src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx` 通過。
- [ ] 5.5 日期格式雙年制：在 `src/lib/date-format-twn.ts` 寫 helper `formatRocDate(iso)` 回「YYYY 年 MM 月 DD 日（民國 NNN 年 MM 月 DD 日）」，legal-notice 套用此 helper。對應 Requirement: Block SHALL use Republic-of-China year alongside Western year for version dates。驗證：`npm test src/lib/__tests__/date-format-twn.test.ts` 含 `2024-08-15 → 2024 年 08 月 15 日（民國 113 年 08 月 15 日）` case 通過。

## 6. PDF 引擎整合

- [ ] 6.1 修改 `src/lib/pdf-engine/document.tsx`（既有 #1a' SDD 範圍）在 Cover / Basic Info / Location Map 後插入 `<LegalNoticeBlock laws={legalClauses} />`，動態頁之前。對應 Requirement: Document generation pipeline SHALL embed legal notice block（Modified disclosure-document-generation） + Requirement: System SHALL render LegalNoticeBlock in fixed 4-page section。驗證：Playwright `e2e/pdf-legal-notice-position.spec.ts` 跑 minimum residential case → PDF 第 4 頁含 legal block + 動態頁不在 legal block 之前。
- [ ] 6.2 修改 `renderDisclosurePdf(caseData, theme, logo)`（既有 #1a' SDD 範圍）改為 `renderDisclosurePdf(caseData, theme, logo, legalClauses)`：先 `await invoke('get_legal_clause')` × 3 拉三條法規 → 傳入 document。對應 Requirement: PDF generation does not duplicate the legal notice block（生成單一次）+ Page numbering SHALL account for the embedded legal notice block。驗證：`npm test src/lib/pdf-engine/__tests__/render-with-legal.test.tsx` legal block 出現 1 次、總頁數含 legal 頁。

## 7. 前端證號驗證 UI

- [ ] [P] 7.1 在 `src/components/RealtorLicenseField.tsx` 實作 input + 500ms debounce + 三態 UI（CheckCircle 綠 / XCircle 紅 / AlertTriangle 黃，lucide-react），文案「✓ 已驗證」/「✗ 證號不存在」/「⚠ 證號已過期」（Decision 9 + 10 + Requirement: System SHALL render three-state UI for verification result）。對應 Requirement: System SHALL verify license number via OPCOS proxy with 500ms debounce。驗證：Playwright `e2e/realtor-license-field.spec.ts` 跑「快速輸入 10 字元只觸發一次 API 呼叫」+「verified / not_found / expired 三態渲染正確」共 4 個 case。
- [ ] 7.2 在 `src/components/RealtorLicenseField.tsx` 顯示離線狀態與最後驗證日期：若 source=offline 且有 cache → 文案附加「（最後驗證日期 YYYY-MM-DD，目前離線中）」；無 cache 顯示「⚠ 離線中、無法驗證」。對應 Requirement: Offline verification SHALL show last-known result with date。驗證：`e2e/realtor-license-offline.spec.ts` 跑兩個離線 case。
- [ ] 7.3 整合 RealtorLicenseField 進 `src/components/disclosure-form-residential.tsx` 與 `src/components/disclosure-form-land.tsx`：加新欄位「經紀人證號」+ 驗證狀態顯示 + draft autosave 含 verification state（Modified disclosure-form-residential + disclosure-form-land）。對應 Requirement: Residential form SHALL include realtor license verification field + Land form SHALL include realtor license verification field + License verification state SHALL be persisted with the case draft + Land form license state SHALL persist with case draft。驗證：`e2e/disclosure-form-license.spec.ts` 跑兩個表單各填證號 + 重開仍保留狀態（reopen-preserve 對應 residential / land 兩個 form 各一個 case）。
- [ ] 7.4 驗證失敗不阻擋表單提交：證號為 not_found / expired / offline 時，「產出 PDF」按鈕仍可點擊、PDF 仍生成。對應 Requirement: Verification failure SHALL NOT block form submission or PDF generation + Decision 6: 經紀人證號驗證採「即時 + 不阻擋」雙態 UX。驗證：`e2e/disclosure-form-license-expired-submit.spec.ts` 跑 expired 狀態仍可生 PDF。

## 8. 設定頁同步狀態

- [ ] 8.1 在 `src/app/(dashboard)/settings/sync-status/page.tsx` 建「同步狀態」頁：顯示三條法規 title + version_date（雙年制）+ fetched_at（多少天前同步）+ 手動「立即同步」按鈕（呼叫 `sync_legal_clauses` IPC）。同步失敗時顯示 OPCOS 統一三態 UI（loading / empty / error）。對應 Decision 10: UX 互動模式 — 與 OPCOS 共用行為規則。驗證：`e2e/sync-status-page.spec.ts` 跑「點立即同步 → 顯示 loading → 結果顯示新版日期」case。

## 9. UI / UX 統一（OPCOS 共用）

- [ ] [P] 9.1 RealtorLicenseField / sync-status page 採 OPCOS design tokens + lucide-react icons + Noto Sans TC + Inter（Decision 9: UI 設計系統 — 與 OPCOS 共用視覺 token（依 lessons.md L070））。驗證：grep 確認三個檔案無 hardcoded hex + 對 OPCOS 既有元件 Playwright 截圖 pixel diff < 5%。
- [ ] 9.2 補充 `docs/ux-patterns.md`「法規告知 + 證號驗證」章節：(a) 三態 UI 統一文案（已驗證 / 證號不存在 / 過期 / 離線 / 驗證逾時）、(b) 同步失敗 banner OPCOS 統一格式、(c) PDF 法規告知頁版面規格。對應 Decision 10: UX 互動模式 — 與 OPCOS 共用行為規則（依 lessons.md L070）。驗證：`docs/ux-patterns.md` 含新章節「法規 + 證號驗收 v1」+ PR 描述貼人工 checklist 結果。

## 10. 文件 + 環境變數

- [ ] 10.1 補 `docs/legal-clauses-sync-spec.md`：OPCOS 法規 dataset 整理規範（給 Fish 整理 Twinkle Hub 用）+ AIRE 期望的 JSON schema + 三條法規 law_id 清單。驗證：file exists + 含 OPCOS API spec section + AIRE expected schema section。
- [ ] 10.2 補 `.env.example` 新增 `OPCOS_LEGAL_CLAUSES_ENDPOINT` 與 `OPCOS_REALTOR_LICENSE_ENDPOINT`（預設指 OPCOS placeholder URL，實際部署時改）。驗證：`grep "OPCOS_LEGAL_CLAUSES_ENDPOINT\|OPCOS_REALTOR_LICENSE_ENDPOINT" .env.example` 各命中一次。

## 11. E2E 整合

- [ ] [P] 11.1 寫 `e2e/legal-clauses-sync.spec.ts` 整合：mock OPCOS 回新版 → 觸發 sync → DB 含三條法規 + 版本日期 → PDF 渲染含新版。驗證：Playwright 跑通 + 寫 `e2e/results/legal-sync.json`。
- [ ] [P] 11.2 寫 `e2e/license-verification.spec.ts` 整合：填證號 → debounce → 三態 + 離線 fallback + 7 天 cache。驗證：Playwright 跑通 + 寫 `e2e/results/license-verification.json`。
- [ ] 11.3 視覺驗收：A 主題 / C 主題各跑一次 PDF 渲染 → legal notice block 字體 / 顏色 / 排版套用主題 tokens 正確（pixel diff < 5%）。驗證：`npm run test:visual-parity -- --components legal-notice --themes a,c` 全綠。
