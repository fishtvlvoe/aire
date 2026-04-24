## 1. 資料層基礎

- [x] [P] 1.1 新增 migration `migrations/001_add_market_summary.sql` + 更新 `src/lib/db/schema.ts:initDb()` 動態 ALTER（同 pre_commission_data 模式）：`ALTER TABLE listings ADD COLUMN market_summary TEXT;`。驗證：220/220 測試通過、新欄位 nullable 不影響現有資料。[Tool: 主對話]
- [x] [P] 1.2 建立 `src/lib/external-links/region-mapping.ts`：定義 6 都（台北/新北/桃園/台中/台南/高雄）的縣市與行政區對應表，每個 mapping 對應 591 `regionid`/`section`、信義 slug、樂屋 zipcode。匯出 `getRegionMapping(city, district)` 回傳 `{ city, district?, coverage: 'full' | 'city-only' } | null`。**TODO**：591 sectionId 部分為 0 占位，待業務驗證後補正確值。[Tool: 主對話]

## 2. URL Builder

- [x] 2.1 建立 `src/lib/external-links/url-builder.ts`：實作 `buildExternalUrl(platform, listing)` 函式（platform: '591-price' | '591-buy' | 'sinyi' | 'rakuya'），讀取 region-mapping 組出完整 URL。若該區域對應表未覆蓋 → 回傳縣市層 URL 並設定 `coverage: 'city-only'` 旗標。實作 Requirement: External Platform Deep-Link Buttons 的 fallback 場景。[Tool: copilot-codex]
- [x] 2.2 撰寫 `url-builder.test.ts` 單元測試：覆蓋（a）6 都熱門區域組出正確 URL（b）偏鄉 fallback 到縣市層（c）總價區間正確帶入 query string（d）特殊字元（中文行政區）正確 URL encode。Snapshot 測試固定 region-mapping 輸出。驗證：`npm test url-builder` 全綠。[Tool: copilot-codex]

## 3. UI 元件

- [x] 3.1 建立 `src/components/MarketLookupPanel.tsx`：包含（a）法律邊界提示文案區塊（b）三個外連按鈕（591 實價登錄 / 信義 / 樂屋）使用 `url-builder` 組 URL，`target="_blank"` `rel="noopener noreferrer"`（c）周邊行情摘要 textarea（max 500 字元，counter 顯示）（d）附件上傳區（accept jpg/png/pdf，max 5MB，max 10 個檔案）。實作 Requirement: External Platform Deep-Link Buttons、Market Research Summary Field、Market Research Attachment Upload、Legal Boundary Disclosure 所有 UI 場景。[Tool: copilot-codex]
- [x] 3.2 修改 `src/app/listings/[id]/supplementary/page.tsx`：嵌入 `<MarketLookupPanel listing={listing} />`，置於 SupplementaryForm 下方（補充資料是獨立頁面，非 fill page tab）。[Tool: 主對話]
- [x] 3.3 偏鄉 coverage 提示：當 `buildExternalUrl` 回傳 `coverage: 'city-only'` 時，按鈕旁顯示「此區域對應表未覆蓋，已導向縣市層搜尋」。[Tool: copilot-codex]

## 4. 後端 API

- [x] 4.1 修改 `src/app/api/listings/[id]/route.ts`：新增 PATCH endpoint 接受 `market_summary`（500 字元 server-side 驗證），寫入 `listings.market_summary` 欄位。驗證：curl PATCH 一個 listing 能正確存取 `market_summary`。[Tool: copilot-codex]
- [x] 4.2 新建 `src/app/api/listings/[id]/attachments/route.ts`（若存在）支援 `type: "market_research"` 標記；若不存在則新建。驗證上傳檔案時將 type 寫入 attachments JSON。實作附件 size / count / format 限制檢查（5MB / 10 個 / jpg-png-pdf）。[Tool: copilot-codex]

## 5. 不動產說明書整合

- [x] 5.1 整合 dossier neighborhood section：在 `src/lib/document-generator/pdf/dossier-{land,building}.ts` 加 market_research prompt block；舊版 `src/lib/generators/disclosure-document.ts` 也加 `buildNeighborhoodSection()`；caller (`generate/route.ts` + `regenerate/route.ts`) 從 listing.attachments 篩 type=market_research → 餵 input.market_research。實作 Neighborhood chapter integrates market research data 所有場景。[Tool: 主對話]
- [x] 5.2 disclosure-document.ts toc_checkbox 加「周邊機能與優劣勢」項，根據 market_summary/attachments 是否非空動態判定（PDF 預覽透過 dossier 章節 generator 同步顯示「待補」字樣）：當 `market_summary` 為空且無 `market_research` 附件時，預覽列表標示此章節為「待補」。[Tool: copilot-codex]

## 6. 測試

- [ ] 6.1 撰寫 `MarketLookupPanel.test.tsx` 元件測試：覆蓋（a）三個按鈕 URL 正確（b）textarea 字元上限（c）附件上傳 size/count/format 驗證（d）法律邊界文案存在於頁面。[Tool: copilot-codex]
- [ ] 6.2 撰寫 E2E 測試 `e2e/external-market-lookup.spec.ts`：Playwright 驗證（a）進入 fill 頁「補充資料」tab → 看到三個按鈕 + 法律提示（b）點按鈕後新分頁打開正確 URL（驗證 URL 不訪問實際網站，僅檢查 anchor href）（c）填寫摘要 + 上傳檔案 → 重新整理後資料保留（d）生成不動產說明書 → PDF 內含摘要與附件（e）空 market_summary 章節顯示「待補」。[Tool: sonnet]
- [ ] 6.3（延後）跨檔 Code Review：用 Kimi MCP `kimi_analyze` 審查所有 diff，重點確認：URL builder 純函式無副作用、無任何對 591/信義/樂屋的 fetch 呼叫、附件 size/format 驗證在 server side 也有檢查（避免 client-side bypass）。[Tool: kimi]

## 7. 視覺驗證與 Commit

- [ ] 7.1 截圖驗證 UI：用 playwright/chrome MCP 截圖以下狀態存到 `/tmp/`：(1) 補充資料 tab 完整畫面 (2) 三個按鈕 hover 狀態 (3) textarea 字元 counter (4) 附件上傳區（含已上傳 2 張截圖）(5) PDF 預覽「周邊環境」章節（有摘要+附件版）(6) PDF 預覽「周邊環境」章節（待補版）。主對話 Read 截圖確認渲染無誤。[Tool: sonnet]
- [x] 7.2 全量 build + test：`npm run build` 0 errors、`npm test` 243/243 全綠（含 url-builder 11 + api-client 12 新測試）。[Tool: 主對話]
- [x] 7.3 Git commit（conventional format）：分成多個 atomic commits（attachments schema / url-builder / market_summary API + attachments REST / MarketLookupPanel + supplementary embed / dossier integration）。[Tool: 主對話]

---

**⚠️ 代理分工護欄（強制遵守）：**
- 所有 `[Tool: copilot-codex]` 任務呼叫 Copilot CLI 時 MUST 加 `--add-dir src/` `--add-dir migrations/` 限制範圍
- Copilot CLI prompt 結尾 MUST 加：「禁止修改或刪除 openspec/ 目錄下的任何檔案；禁止跑任何 git 指令（status / diff 除外，特別禁止 clean / restore / reset / checkout）；禁止寫入任何對 591.com.tw、sinyi.com.tw、rakuya.com.tw 的 fetch / Puppeteer / Playwright 自動訪問代碼」
- 所有 `[Tool: sonnet]` 任務由 Sonnet 子代理執行
- `[Tool: kimi]` 任務用 `kimi_analyze` MCP 工具
- 主對話（Opus）不寫程式碼，只負責派工、整合、驗收
- **Codex 與 Cursor 已禁用**（品質不穩），不在本 change 派工選項內
