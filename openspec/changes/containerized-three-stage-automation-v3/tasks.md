## Phase 1：容器化基礎設施（可獨立交付）

### 1. Docker Image 基礎建置

- [x] 1.1 [Tool: copilot-codex] 建立 Dockerfile：基於 node:22-slim，裝 Next.js 相依、Puppeteer + Chromium、中文字型（Noto Sans TC + Noto Serif TC），多階段 build — 實作 Requirement: Docker image builds successfully for linux/amd64；對應 Design: codex cli 放容器內（不走 bridge、不 mount 宿主 codex）
- [x] 1.2 [Tool: codex] 建立 docker/compose.yaml：定義 app service、volume mount、port 綁 127.0.0.1:3000 — 實作 Requirement: Container exposes only localhost、Data persists on host volume；對應 Design: 容器內資料持久化用 volume mount，不是 named volume
- [x] 1.3 [Tool: copilot-codex] 容器內安裝 Codex CLI 並驗證版本 — 實作 Requirement: Codex CLI is installed inside container；對應 Design: codex cli 放容器內（不走 bridge、不 mount 宿主 codex）
- [ ] 1.4 [Tool: codex] e2e 驗證：docker build && docker compose up -d，容器 < 60s 啟動，/api/health 回 200 — 實作 Requirement: Container health check reports readiness、Docker image builds successfully for linux/amd64；對應 Design: goals

### 2. Codex CLI 容器內登入機制

- [x] 2.1 [Tool: copilot-codex] 建立 src/lib/codex-client/：wrapper 呼叫 codex exec，錯誤處理（未登入/超時/額度超限）— 實作 Requirement: Codex CLI is installed inside container；對應 Design: codex cli 放容器內（不走 bridge、不 mount 宿主 codex）、codex cli 容器內在 windows docker desktop + wsl2 能不能跑
- [x] 2.2 [Tool: copilot-codex] 建立 /api/health endpoint — 實作 Requirement: Container health check reports readiness
- [ ] 2.3 [Tool: codex] 撰寫 codex-client 測試：模擬已登入/未登入/回應/錯誤四個情境 — 實作 Requirement: Codex CLI is installed inside container
- [x] 2.4 [Tool: gemini] 研究 Codex CLI OAuth 在容器內的登入限制（interactive TTY、Windows 瀏覽器 callback）— 對應 Design: codex cli 容器內在 windows docker desktop + wsl2 能不能跑

### 3. Windows 啟動腳本

- [x] 3.1 [Tool: copilot-gen] 建立 docker/start.bat：檢查 Docker Desktop、docker compose up、輪詢 health、開瀏覽器 — 實作 Requirement: Windows launcher provides one-click startup；對應 Design: windows 啟動腳本：批次檔 + powershell
- [x] 3.2 [Tool: copilot-gen] 建立 docker/first-login.bat：建立 %USERPROFILE%\建安AI\data\ 目錄、拉 image、執行 codex login — 實作 Requirement: Windows launcher provides one-click startup、Codex CLI is installed inside container
- [x] 3.3 [Tool: copilot-gen] 建立 docker/安裝說明.md：繁體中文安裝步驟、系統需求 — 對應 Design: 客戶電腦規格不確定
- [ ] 3.4 [Tool: codex] Mac 端模擬 Windows 流程驗證腳本邏輯 — 對應 Design: goals

### 4. 資料持久化

- [x] 4.1 [Tool: copilot-codex] 更新 src/lib/db/ 讀 env DATABASE_PATH=/app/data/db/app.sqlite — 實作 Requirement: Data persists on host volume
- [x] 4.2 [Tool: copilot-codex] 建立 uploads 與 outputs 目錄結構輔助函式，依 listing-id 分資料夾 — 實作 Requirement: Data persists on host volume
- [ ] 4.3 [Tool: codex] 測試：容器 down/up 後資料完整保留 — 實作 Requirement: Data persists on host volume；對應 Design: 資料安全（客戶資料不能外流）

### 5. Phase 1 驗收

- [ ] 5.1 [Tool: codex] e2e：啟動容器 → 登入 Codex → codex exec "hello" 成功 — 實作 Requirement: Codex CLI is installed inside container；對應 Design: goals
- [ ] 5.2 [Tool: kimi] CR：Dockerfile + compose.yaml + 啟動腳本一致性、安全性（無硬編 token、無 0.0.0.0 綁定）— 實作 Requirement: Container exposes only localhost；對應 Design: 資料安全（客戶資料不能外流）

---

## Phase 2：13 種類型補完 + 5 份文件產出器（核心變現）

### 6. 物件類型 13 種補完

- [x] 6.1 [Tool: cursor] 把 src/lib/property-types/index.ts 所有 available 改為 true — 實作 Requirement: Registry supports all 13 property types as available；對應 Design: 13 種類型全開，schema 差異化但共用 ui 元件
- [x] 6.2 [Tool: cursor] 為剩餘 7 種類型建立 schema 檔（套房/店面/廠房/商業地/工業地/鄉村區建地/其他土地）— 實作 Requirement: Registry supports all 13 property types as available；對應 Design: 13 種類型全開，schema 差異化但共用 ui 元件
- [x] 6.3 [Tool: cursor] 所有欄位補 sourceType + displayMode 屬性 — 實作 Requirement: Each field has sourceType and displayMode metadata；對應 Design: 欄位總表 metadata：sourcetype + displaymode
- [ ] 6.4 [Tool: codex] 撰寫 property-types 測試：13 類 getFieldSchema 非空、metadata 完整 — 實作 Requirement: Registry supports all 13 property types as available、Each field has sourceType and displayMode metadata

### 7. Form Renderer 修補

- [ ] 7.1 [Tool: copilot-codex] 修 src/lib/form-renderer/index.ts：schema key 支援 -、type 定義補 file — 實作 Requirement: Field visit form supports all 13 property types；對應 Design: 100% 可直接搬用（lib 核心層）、小幅修改可用
- [x] 7.2 [Tool: cursor] 重寫 FieldVisitForm.tsx 支援 13 類動態 schema — 實作 Requirement: Field visit form supports all 13 property types；對應 Design: 小幅修改可用
- [x] 7.3 [Tool: cursor] 重寫 SupplementaryForm.tsx 對齊 v3 秘書後補欄位 — 實作 Requirement: Supplementary form renders secretary fields for all 13 types；對應 Design: 小幅修改可用
- [ ] 7.4 [Tool: codex] 測試：13 類在 FieldVisitForm 下正確渲染 — 實作 Requirement: Field visit form supports all 13 property types

### 8. UI 按章節分群

- [x] 8.1 [Tool: cursor] 建立 src/lib/form-renderer/chapter-grouper.ts：三層 schema 合併重排為 9 章節 — 實作 Requirement: Form groups fields by chapter, not by layer
- [x] 8.2 [Tool: cursor] FieldVisitForm 改為章節 Tab — 實作 Requirement: Form groups fields by chapter, not by layer
- [x] 8.3 [Tool: cursor] 每個 Tab 加完成度 badge — 實作 Requirement: Form groups fields by chapter, not by layer
- [x] 8.4 [Tool: cursor] 欄位依 displayMode 顯示不同樣式（fixed/estimate/blank）— 實作 Requirement: Field visual style reflects displayMode；對應 Design: 欄位總表 metadata：sourcetype + displaymode

### 9. 5 份文件產出器（MD）

- [x] 9.1 [Tool: copilot-codex] 砍掉 src/lib/document-generator/types.ts 的 7+ 文件，改為 5 份 — 實作 Requirement: System generates exactly five document types per listing；對應 Design: 其他 4 份文件全部 md（物調表、591、dm、fb 貼文）、小幅修改可用
- [x] 9.2 [Tool: copilot-codex] 建立 document-generator/md/survey.ts：物調表 MD prompt + Codex 呼叫 — 實作 Requirement: Secondary documents are Markdown format、System generates exactly five document types per listing
- [x] 9.3 [Tool: copilot-codex] 建立 md/listing591.ts：591 PO 文 MD prompt — 實作 Requirement: Secondary documents are Markdown format
- [x] 9.4 [Tool: copilot-codex] 建立 md/dm.ts：銷售 DM 文案 MD prompt — 實作 Requirement: Secondary documents are Markdown format
- [x] 9.5 [Tool: copilot-codex] 建立 md/social.ts：FB 5 平台貼文 + 圖片提示詞 MD prompt — 實作 Requirement: Secondary documents are Markdown format
- [ ] 9.6 [Tool: codex] 每份文件 integration 測試 — 實作 Requirement: System generates exactly five document types per listing、Secondary documents are Markdown format

### 10. 不動產說明書 PDF（16 章）

- [ ] 10.1 [Tool: kimi] 分析 docs/extracted-dossier-schema.md，確認建物/土地章節結構 — 對應 Design: 不動產說明書：合併 16 頁附件為單一模板 + puppeteer pdf、16 章模板結構還沒完全萃取（copilot 任務待完成）
- [x] 10.2 [Tool: copilot-codex] 建立 document-generator/pdf/dossier-building.ts：建物版 16 章 prompt — 實作 Requirement: Real estate brochure is PDF with fixed 16-chapter format；對應 Design: 不動產說明書：合併 16 頁附件為單一模板 + puppeteer pdf
- [x] 10.3 [Tool: copilot-codex] 建立 pdf/dossier-land.ts：土地版 16 章 prompt — 實作 Requirement: Real estate brochure is PDF with fixed 16-chapter format；對應 Design: 不動產說明書：合併 16 頁附件為單一模板 + puppeteer pdf
- [x] 10.4 [Tool: cursor] 建立 pdf-generator/templates/dossier.html + dossier.css：16 章排版、建安 LOGO、頁眉頁腳 — 實作 Requirement: Real estate brochure is PDF with fixed 16-chapter format
- [x] 10.5 [Tool: copilot-codex] 更新 pdf-generator/dossier.ts：接收 16 章 Markdown → 合併 HTML → Puppeteer PDF — 實作 Requirement: Real estate brochure is PDF with fixed 16-chapter format；對應 Design: 100% 可直接搬用（lib 核心層）
- [ ] 10.6 [Tool: codex] 測試：建物與土地各一 fixture listing 產 PDF，驗證 16 章 + LOGO — 實作 Requirement: Real estate brochure is PDF with fixed 16-chapter format

### 11. 產文件協調與 API

- [x] 11.1 [Tool: copilot-codex] 更新 api/listings/[id]/generate：並行觸發 5 份文件產生 — 實作 Requirement: System generates exactly five document types per listing；對應 Design: 小幅修改可用
- [x] 11.2 [Tool: copilot-codex] 建立 api/listings/[id]/regenerate：接 {docType}，只重產單一 — 實作 Requirement: Each document can be regenerated independently
- [x] 11.3 [Tool: copilot-codex] 更新 api/listings/[id]/documents：列 5 份狀態與下載 URL — 實作 Requirement: System generates exactly five document types per listing
- [ ] 11.4 [Tool: codex] 測試：generate 一次產 5 份、regenerate 單獨重產不影響其他 — 實作 Requirement: Each document can be regenerated independently、System generates exactly five document types per listing

### 12. UI 重寫

- [x] 12.1 [Tool: cursor] 重寫 src/app/listings/page.tsx：真實 DB 資料、狀態 badge、篩選器 — 實作 Requirement: Form groups fields by chapter, not by layer；對應 Design: 砍掉重寫（不符 v3 架構）
- [x] 12.2 [Tool: cursor] 重寫 listings/[id]/fill：章節 Tab + FieldVisitForm — 實作 Requirement: Form groups fields by chapter, not by layer；對應 Design: 砍掉重寫（不符 v3 架構）
- [x] 12.3 [Tool: cursor] 重寫 listings/[id]/supplementary：秘書後補頁 — 實作 Requirement: Supplementary form renders secretary fields for all 13 types、Pre-commission data is visible as reference
- [x] 12.4 [Tool: cursor] 重寫 listings/[id]/generating：5 份文件實時進度 — 實作 Requirement: System generates exactly five document types per listing
- [x] 12.5 [Tool: cursor] 重寫 listings/[id]/documents：5 張卡片 + 重產按鈕 — 實作 Requirement: Each document can be regenerated independently、System generates exactly five document types per listing
- [x] 12.6 [Tool: cursor] 砍掉 SocialPostTabs.tsx、ShortVideoScript.tsx、MarketingFlowGuide.tsx — 對應 Design: 砍掉重寫（不符 v3 架構）、non-goals

### 13. Phase 2 驗收

- [ ] 13.1 [Tool: kimi] CR：document-generator 5 份文件 prompt 一致性 — 實作 Requirement: System generates exactly five document types per listing；對應 Design: implementation distribution strategy
- [ ] 13.2 [Tool: kimi] CR：UI 章節分群 + 13 類動態渲染 — 實作 Requirement: Form groups fields by chapter, not by layer、Field visit form supports all 13 property types
- [x] 13.3 [Tool: codex] npm test 全綠 — 對應 Design: goals
- [x] 13.4 [Tool: codex] npm run build 0 錯誤 — 對應 Design: goals

---

## Phase 3：階段一（委託前）UI + 爬蟲

### 14. Pre-commission UI

- [ ] 14.1 [Tool: cursor] 建立 src/app/pre-commission/new/page.tsx：屋主姓名/電話/地址/地號表單 — 實作 Requirement: Pre-commission lookup UI accepts owner + address/parcel input；對應 Design: 階段一 v3 第一版：ui + 手動貼 > 全自動爬蟲
- [ ] 14.2 [Tool: copilot-codex] 建立 api/pre-commission/route.ts：POST 建立 pre-commission state listing — 實作 Requirement: Listing state machine supports pre-commission stage、Pre-commission lookup UI accepts owner + address/parcel input
- [ ] 14.3 [Tool: cursor] 建立 pre-commission/[id]/page.tsx：顯示自動查詢 + 手動貼資料區 — 實作 Requirement: System auto-populates public data when available、Manual paste mode for unavailable sources
- [ ] 14.4 [Tool: cursor] 進入現場勘查按鈕：推進 state 到 field-visit — 實作 Requirement: Pre-commission state transitions to field-visit、Workflow rejects invalid transitions

### 15. Listing State 擴充

- [ ] 15.1 [Tool: copilot-codex] 更新 src/lib/db/schema.ts：新增 pre-commission state、pre_commission_data JSON 欄位 — 實作 Requirement: Listing state machine supports pre-commission stage；對應 Design: 100% 可直接搬用（lib 核心層）
- [ ] 15.2 [Tool: copilot-codex] 更新狀態機：pre-commission → field-visit — 實作 Requirement: Pre-commission state transitions to field-visit、Workflow rejects invalid transitions
- [ ] 15.3 [Tool: codex] 測試：state 轉換驗證（合法與非法）— 實作 Requirement: Workflow rejects invalid transitions

### 16. 公開資料爬蟲（繼承 v1 POC）

- [ ] 16.1 [Tool: cursor] 考古 v1 POC 爬蟲 code 位置，評估可用性 — 對應 Design: 爬蟲繼承 v1 poc 可用性未知
- [ ] 16.2 [Tool: gemini] 研究謄本、地籍圖、使用分區、實價登錄的最新 API/爬取方式 — 對應 Design: 階段一 v3 第一版：ui + 手動貼 > 全自動爬蟲
- [ ] 16.3 [Tool: copilot-codex] 建立 src/lib/pre-commission/lookup.ts：統一介面 — 實作 Requirement: System auto-populates public data when available
- [ ] 16.4 [Tool: copilot-codex] 實作可行站點的 scraper — 實作 Requirement: System auto-populates public data when available；對應 Design: 爬蟲繼承 v1 poc 可用性未知
- [ ] 16.5 [Tool: copilot-codex] 手動貼上謄本的 LLM 解析 fallback：Codex 抽結構化欄位 — 實作 Requirement: Manual paste mode for unavailable sources
- [ ] 16.6 [Tool: codex] 測試：mock 站點 + LLM fallback 都可運作 — 實作 Requirement: System auto-populates public data when available、Manual paste mode for unavailable sources

### 17. Pre-commission Data 顯示於 supplementary

- [ ] 17.1 [Tool: cursor] SupplementaryForm 新增「委託前已查資料」collapsible 唯讀區 — 實作 Requirement: Pre-commission data is visible as reference

### 18. Phase 3 驗收

- [ ] 18.1 [Tool: kimi] CR：pre-commission 整個流程 — 實作 Requirement: Pre-commission lookup UI accepts owner + address/parcel input、System auto-populates public data when available；對應 Design: implementation distribution strategy
- [ ] 18.2 [Tool: codex] e2e：新 listing → 階段一 → 階段三 → 5 份文件全產出 — 實作 Requirement: Listing state machine supports pre-commission stage、Pre-commission state transitions to field-visit、System generates exactly five document types per listing；對應 Design: goals

---

## Phase 4：發布與交付

### 19. 打包發布

- [ ] 19.1 [Tool: codex] docker build --platform linux/amd64 -t jianan-ai:v3.0.0 — 實作 Requirement: Docker image builds successfully for linux/amd64
- [ ] 19.2 [Tool: codex] 推 image 到私人 registry — 對應 Design: goals
- [ ] 19.3 [Tool: copilot-gen] 寫 release note（功能摘要 + 安裝步驟）— 對應 Design: goals、客戶電腦規格不確定
- [ ] 19.4 [Tool: codex] 打包 release zip（start.bat、first-login.bat、安裝說明.md、compose.yaml）— 實作 Requirement: Windows launcher provides one-click startup

### 20. 客戶驗收

- [ ] 20.1 建安不動產實機安裝測試（Fish 本機先跑過 → 客戶現場安裝）— 對應 Design: goals、客戶後續要 saas 化
- [ ] 20.2 業務 + 秘書操作 1 個真實物件完整跑流程 — 對應 Design: goals
- [ ] 20.3 客戶簽驗收單 — 對應 Design: goals
