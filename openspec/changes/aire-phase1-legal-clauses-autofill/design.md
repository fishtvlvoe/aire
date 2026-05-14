## Context

AIRE 是不動產仲介用桌面 App，輸出「不動產說明書」是核心功能。依不動產經紀業管理條例 24-1 條 + 消費者保護法相關規定，說明書必須附「相關法規告知」+ 經紀人需登記證號。實務上仲介自己抄條文（可能用舊版）、證號用人工輸入（可能假號），這兩塊「合規剛需」如果靠人工就會出包。

商業面：Fish 確認此功能屬「不收良心錢」範圍（基本款必含，含在 NT$30,000 買斷），月租加值留給「賺更多錢」的功能（行情、試算 — Phase 4 LVR SDD 範圍）。

技術面：OPCOS 已經是 AIRE 的雲端中台（序號 + IP 驗證 + 訂閱），擴充「政府資料代理」一層即可（Phase 4 LVR SDD 也走同一架構）。AIRE 客戶端只認 OPCOS、不直接打 data.gov.tw / Twinkle Hub。

利害關係人：客戶老闆（看到證號驗證結果）、客戶助理（不用自己抄法規）、Fish（決定法規同步頻率 + Twinkle Hub 法規 dataset 排程）、未來客戶律師 / 法務（PDF 顯示版本日期可追溯）。

## Goals / Non-Goals

**Goals:**

- 不動產經紀業管理條例 + 消費者保護法 + 公平交易法三條中央法規自動嵌入說明書末頁
- 每次 App 啟動檢查本機 cache 版本 vs OPCOS 最新版本；新版自動拉
- 離線可用（本機 SQLite cache，無網仍能渲染）
- 經紀人證號 OPCOS 代理驗證 + UI 即時三態顯示
- 客戶不需做任何主動操作（自動同步 + 自動嵌入）

**Non-Goals:**

- 月租加值收費
- 法規異動主動推播彈窗
- 全文檢索 / 法規查詢介面
- AI 法規解讀
- 各縣市地方法規（Phase 2）
- 「假經紀人」自動阻擋（只警示）
- 跨機構證號交叉比對

## Decisions

### Decision 1: 法規資料源走 OPCOS 雲端代理（非 AIRE 直接打 data.gov.tw / Twinkle Hub）

OPCOS 後端統一吃 Twinkle Hub 的法規 dataset（或直接打 data.gov.tw 法務部 API），AIRE 客戶端只認 OPCOS。

替代方案：

- AIRE 直接打 data.gov.tw：政府改版客戶端壞、AIRE 升級每家都要動
- AIRE 直接打 Twinkle Hub MCP：AIRE 不該認得第三方資料源，violates 抽象
- 本機 dump 法規檔：法規會改版、每次改版要重發 binary

理由：OPCOS 已是 AIRE 的雲端中台（lessons.md L070 + plan Phase 4 共識），統一收口在 OPCOS 對所有 App 都受惠。

### Decision 2: 法規 cache 採本機 SQLite（離線優先）

法規條文存 SQLite `legal_clauses` 表，欄位：`law_id` / `title` / `content_markdown` / `version_date` / `fetched_at` / `source_url`。每條法規一筆，version_date 是發布日期、fetched_at 是 AIRE 抓取時戳。

替代方案：

- 純記憶體 cache：App 重開要重抓、離線時無內容
- 嵌入 binary：法規改版要重發 App、版本管理混亂
- IndexedDB：桌面 App 用 IndexedDB 不便（後端 Rust 存取困難）

理由：與既有 SQLite 加密層整合（SDD #1c 完成後法規條文也受 sqlcipher 加密 — 雖然法規是公開資料但統一加密簡化邏輯）。

### Decision 3: 同步策略採「啟動時 + 每 7 天」雙觸發

App 啟動時檢查 OPCOS 最新版本號（HTTP GET，幾百 bytes）→ 若 OPCOS 版本 > 本機版本 → 背景拉新版（不阻塞 UI）。同時 `tokio-cron-scheduler` 每 7 天定時 check（保險）。

替代方案：

- 每次說明書渲染都 check：浪費網路 + 慢
- 純背景每天 check：客戶常關 App，可能很多天沒更新
- 客戶手動同步：基本款應該無感、不該要人按按鈕

理由：「啟動 + 7 天」覆蓋客戶日常使用模式，OPCOS 後端壓力小。

### Decision 4: 法規告知 PDF 區塊在「固定 4 頁」尾端、所有主題共用

LegalNoticeBlock 放在 PDF 固定 4 頁的最後一頁（基本資訊 + 物件位置之後、動態頁之前），所有主題（A 淡雅 / C 科技優雅 / Phase 2 補充包）共用同一個 React PDF 元件，只是 typography + 邊距用 useTheme() 取主題 tokens。

替代方案：

- 放最末頁：被動態頁長度推後，頁碼不穩定
- 各主題自己畫：違反 DRY，補充包要重複實作
- 不分頁 sticky：@react-pdf 不支援

理由：「固定區塊 + 主題 tokens」最簡，未來新主題自動繼承無需改 legal-notice.tsx。

### Decision 5: PDF 區塊顯示「資料來源 + 版本日期」防責任歸屬糾紛

每條法規塊頂部標示：

```
資料來源：法務部全國法規資料庫
版本日期：2024-08-15
透過 OPCOS 同步於：2026-05-14
```

替代方案：

- 不標示：法律糾紛時客戶可能怪 AIRE 提供舊版
- 只標版本日期：來源不明，法律無據
- 連結原文 URL：紙本印出來連結沒用

理由：版本日期 + 來源 = 客戶法律免責；數位簽章 / 區塊鏈防偽 Phase 3+ 評估。

### Decision 6: 經紀人證號驗證採「即時 + 不阻擋」雙態 UX

仲介輸入證號 → debounce 500ms → 呼叫 OPCOS 證號驗證 API → UI 顯示三態（✓ 已驗證 / ✗ 證號不存在 / ⚠ 過期）。但**驗證失敗不阻擋說明書產出**（仲介老闆可以決定要不要繼續）。

替代方案：

- 失敗即阻擋：誤判時客戶卡死、體驗差
- 不驗證：基本款應該幫客戶把關
- 驗證在 PDF 渲染才做：太晚、客戶填完才知道錯

理由：「警示 + 留決定權給仲介老闆」符合台灣中小企業文化 + 法規未強制要求即時阻擋。

### Decision 7: 經紀人證號 cache 7 天（同法規同步週期）

證號驗證結果存 SQLite `realtor_licenses` 表，cache 7 天（與法規同步週期一致）。同一證號 7 天內不重複打 API。

替代方案：

- 不 cache 每次都打：浪費 OPCOS 流量 + 慢
- cache 永久：證號過期會誤判
- cache 1 天：客戶常用同證號、流量增加

理由：證號通常不會 7 天內過期，平衡流量與準確。

### Decision 8: OPCOS 端點走 HTTPS + Bearer token（既有授權架構）

OPCOS 法規 + 證號 API 走既有 OPCOS 授權架構（IP 鎖定 + Bearer token），不另外開放公共 endpoint。AIRE 客戶啟動時用既有 OPCOS session token 帶在 Authorization header。

替代方案：

- 開公共 endpoint：濫用風險、無流量歸屬
- 額外 OAuth：增加客戶端複雜度

理由：對齊既有 OPCOS 客戶端授權邏輯，無需新增認證機制。

### Decision 9: UI 設計系統 — 與 OPCOS 共用視覺 token（依 lessons.md L070）

RealtorLicenseField 三態（已驗證 / 錯誤 / 過期）採用 OPCOS design tokens 的 success / error / warning 色，icon 用 lucide-react 的 CheckCircle / XCircle / AlertTriangle。

替代方案：自定義圖示 / 顏色 → 與其他 OPCOS 系產品不一致。

### Decision 10: UX 互動模式 — 與 OPCOS 共用行為規則（依 lessons.md L070）

- 證號驗證 loading 採 OPCOS 三態 UI（loading spinner / 結果 / error）
- 法規同步背景任務不彈視窗、不打擾客戶
- 同步失敗時在「設定 → 同步狀態」頁顯示警示（非主流程阻塞）
- 文案統一：「✓ 已驗證」/ 「✗ 證號不存在」/ 「⚠ 證號已過期」（OPCOS 統一 wording）

替代方案：各 UI 元件自由設計 → 與未來 App 行為不一致。

## Implementation Contract

**Behavior:**

- 客戶在「設定 → 同步狀態」可看到法規條文最後同步時間 + 各條法規版本日期
- 客戶在 disclosure-form 輸入經紀人證號 → debounce 500ms → 即時 UI 顯示驗證結果
- 客戶產生 PDF 說明書 → 自動含「法規告知」頁（位於固定 4 頁尾端）+ 來源 / 版本標示
- 客戶離線時 → 法規 cache 仍可渲染、證號驗證顯示「⚠ 離線中、無法驗證」（cache 7 天內結果仍可信）
- 客戶 7 天未開 App → 啟動時自動拉新版法規（無感、背景）

**Interface / data shape:**

- SQLite tables:
  ```sql
  CREATE TABLE legal_clauses (
    law_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    version_date TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    source_url TEXT NOT NULL
  );
  CREATE TABLE realtor_licenses (
    license_number TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('verified','not_found','expired')),
    verified_at TEXT NOT NULL,
    cache_expires_at TEXT NOT NULL
  );
  ```
- OPCOS API:
  - `GET /v1/legal-clauses/version` → `{ latest_version: '2026-05-10', laws: [{ law_id, version_date }] }`
  - `GET /v1/legal-clauses/{law_id}` → `{ law_id, title, content_markdown, version_date, source_url }`
  - `GET /v1/realtor-license/{license_number}` → `{ license_number, status, expires_at }`
- Tauri IPC:
  - `sync_legal_clauses() -> Result<SyncResult, Error>`
  - `get_legal_clause(law_id) -> Result<LegalClause, Error>`
  - `verify_realtor_license(number) -> Result<LicenseStatus, Error>`

**Failure modes:**

- OPCOS 離線 → fallback to cache + UI 顯示「⚠ 法規同步失敗，使用 N 天前版本」
- 法規 SQL 寫入失敗 → typed `LegalClausesError::CacheWriteFailed` + 不阻擋 PDF 渲染（用上次成功版本）
- 證號 API 超時（> 3s）→ UI 顯示「⚠ 驗證逾時」+ 不阻擋下單
- 證號 cache 過期但離線 → 顯示「⚠ 離線中、最後驗證日期 YYYY-MM-DD」
- OPCOS 回 401（token 過期）→ 觸發既有 OPCOS 重新驗證流程，重試一次

**Acceptance criteria:**

- `cargo test --package aire_core legal_clauses realtor_license` 全綠（含同步 / cache / 證號 / 三態驗證）
- E2E `e2e/legal-clauses-sync.spec.ts` 通過：mock OPCOS 回新版 → 觸發 sync → DB 寫入 → PDF 渲染含新版日期
- E2E `e2e/license-verification.spec.ts` 通過：三態驗證 UI 切換 + 離線顯示「⚠ 離線中」
- 渲染 PDF 末頁含「法規告知」區塊 + 三條法規 + 各自版本日期
- 證號 cache 7 天 TTL 正確（測試含時間旅行 mock）

**Scope boundaries:**

- **In scope**: 法規同步 + cache + PDF 嵌入；證號驗證 + UI 三態 + cache；OPCOS 代理（雲端架構）；migrations 003；docs 同步狀態頁
- **Out of scope**: 月租加值、法規異動推播、全文檢索、AI 解讀、地方法規、阻擋下單、跨機構驗證、Twinkle Hub 法規 dataset 整理工作（OPCOS 後端範圍、本 SDD 假設已就緒）

## Risks / Trade-offs

- **Twinkle Hub 法規 dataset 尚未整理進 hub** → Mitigation: OPCOS 後端可暫時直接打 data.gov.tw 法務部 API、Phase 2 改吃 Twinkle Hub
- **OPCOS 後端尚未部署實際 endpoint** → Mitigation: spec 寫 placeholder URL（`https://opcos.example.tw/v1/...`），實際 endpoint 在 .env 補
- **法規 markdown 太長導致 PDF 末頁爆版** → Mitigation: 區塊使用 @react-pdf wrap={true} 自動分頁、超出時加「續下頁」標示
- **證號驗證 API 流量被濫用** → Mitigation: OPCOS 代理層加 rate limit + cache + 同一 IP 每分鐘上限
- **法規版本日期客戶看不懂中華民國年 vs 西元年** → Mitigation: 統一顯示「西元 YYYY 年 MM 月 DD 日」+ 副標「民國 NNN 年 NN 月 NN 日」（兩種並列）
- **客戶說明書印出後法規又改版（時間差）** → Mitigation: PDF 標示「資料同步日期」客戶能追溯，且法規通常不會週週改

## Migration Plan

**部署：**

1. 升級 binary
2. migration 003_legal_clauses.sql 建表
3. 啟動時觸發首次 sync（背景）→ 拉三條法規進 cache
4. 完成後既有 disclosure-form 自動含 RealtorLicenseField
5. 既有案件下一次重新渲染 PDF 時自動含法規告知頁

**現有資料移轉：**

- 既有案件資料不動
- 既有 PDF 不會自動重渲染、客戶若需新版要手動重新產生

**Rollback：**

- 升級失敗 revert binary，legal_clauses + realtor_licenses 表保留（舊版會忽略）

## Open Questions

- Twinkle Hub 法規 dataset 整理時程：Fish 決定（不卡 propose、Phase 3 動工前要 ready）
- 是否要做「法規異動 changelog」UI 給客戶看：MVP 不做、看真實使用回饋
- 是否含「不動產仲介經紀業管理條例施行細則」+ 其他附屬法規：先 cover 主法規、施行細則 Phase 2 評估
- OPCOS 端點 .env 變數命名是否統一前綴（OPCOS_LEGAL_* / OPCOS_REALTOR_*）：實作時對齊既有 OPCOS_API_BASE_URL 命名
