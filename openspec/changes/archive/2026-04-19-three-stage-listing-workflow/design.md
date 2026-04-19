## Context

建安不動產目前使用 Next.js + Supabase + Claude API 的既有系統（物件分析助手，委託前估價用途）。本次新增三階段流程自動化模組，作為獨立功能加入，不修改現有估價分析邏輯。

**部署策略（已確認）**：以 Docker Container 封裝整個執行環境（Node.js、Puppeteer、SQLite、所有依賴套件）。客戶只需安裝 Docker Desktop，不需自行安裝 Node.js 或設定環境變數，不受 Mac/Windows 差異影響。第一版在客戶 Windows 本機執行（`docker compose up` → 瀏覽器開 localhost），待跑順後同一個 Image 可直接部署至 VPS 轉為 SaaS，不需改程式碼。

三個階段的資料流：
- **委託前**：業務攜帶現場必問表至物件現場勘查，填寫後拍照回傳；秘書另行調閱謄本、地籍圖、使用分區等地政公開資料
- **委託中**：秘書或業務在電腦端將兩批資料輸入系統，三個 AI Provider 並行產出六種文件（Codex → 正式文件、Haiku → 行銷文字、Gemini → 社群內容）
- **委託後**：系統產出社群貼文文字與短影片劇本，業務手動發布至各平台

使用者：房仲業務員（現場）、行政秘書（電腦端資料彙整）

## Goals / Non-Goals

**Goals:**

- 定義現場必問表的欄位結構（支援農地、住宅兩種物件類型）
- 設計資料輸入介面（Web，手機/電腦瀏覽器皆可操作）
- 透過三個 AI Provider 並行產出六種文件內容（Codex CLI、Claude Haiku、Gemini）
- 正式文件（不動產說明書、物調表、銷售 DM）轉換為 PDF 輸出
- 社群貼文（591、五大平台）以純文字呈現於畫面，可複製貼上
- 支援五大平台貼文格式差異（Facebook、Instagram、Threads、TikTok、YouTube）

**Non-Goals:**

- AI 語音客服
- 自動上架 591 或自動發文至社群平台
- 謄本 OCR 自動辨識
- 實價登錄自動查詢（本階段由人工提供）
- 行動裝置原生 App

## Decisions

### 資料輸入方式：Web 表單（分兩段填寫）

業務在現場用手機瀏覽器填寫「現場必問表」（第一段），秘書回到辦公室後在電腦補填「秘書後補欄位」（第二段）。同一筆物件記錄，分兩次填寫完成後才觸發文件產出。

**替代方案考量**：Google 表單（客戶提及過）→ 無法整合到系統資料流、無法觸發 Claude API，放棄。LINE 回傳截圖 → 需 OCR，複雜度高，非本次範圍。

### PDF 產出技術：Puppeteer（伺服器端）

系統以 HTML 模板渲染文件內容，由 Puppeteer 在伺服器端轉換為 PDF。前端提供下載按鈕。Docker Container 內跑 Linux 環境，Puppeteer 使用內建 Chromium，無 Windows/Mac 路徑差異問題，無 timeout 限制。

**替代方案考量**：WeasyPrint（Python）→ 需額外維護 Python 服務，架構複雜；前端 jsPDF → 排版控制差，中文支援不穩定。Puppeteer 在 Docker Linux 環境內最穩定。

### 社群貼文：純文字顯示 + 複製按鈕（各平台分頁）

每個平台各有一個分頁，顯示對應格式的貼文文字，旁邊有「複製」按鈕。平台差異（字數、換行、hashtag 位置）由 Claude prompt 內處理。

**替代方案考量**：統一格式輸出 → 各平台規則差異大（Threads 500字、TikTok 2200字、YouTube 說明欄），一份貼文無法同時適用，放棄。

### AI Provider 分工：三個 Provider 並行，依文件類型切分

| Provider | 負責文件 | 呼叫方式 |
|----------|---------|---------|
| **Codex CLI** | 不動產說明書、物調表（正式文件）| `codex exec` CLI |
| **Claude Haiku** (`claude-haiku-4-5`) | 591 刊登文、銷售 DM（行銷文字）| `@anthropic-ai/sdk` |
| **Gemini** (`gemini-2.0-flash`) | 社群貼文×5、短影片劇本（社群內容）| `@google/generative-ai` |

切換方式：`.env` 設定 `DOCUMENT_GENERATOR_PROVIDER=codex|haiku|gemini|all`，`all`（預設）三者並行產出，全部成功才標記 `documents-ready`。

介面抽象：`FormalDocumentGenerator`、`MarketingDocumentGenerator`、`SocialDocumentGenerator` 三個專責介面，由 `TriProviderDocumentGenerator` 統籌並行呼叫並合併結果。

**開發代理分工（tasks.md 標註）：**

| 任務類型 | 負責代理 |
|---------|---------|
| 業務邏輯、API routes、Provider 實作 | Copilot CLI |
| 執行測試、Docker shell 驗證、E2E | Codex CLI |
| UI 元件、表單、純文字輸出介面 | Cursor-agent |
| Code Review（diff > 10 行）| Kimi CLI |
| 統籌、審核、整合 | Claude Sonnet（主對話）|

### Claude API 呼叫時機：全部欄位填寫完成後一次觸發

秘書確認「現場必問」和「秘書後補」兩段資料都填完後，按「產出文件」按鈕，一次觸發 `TriProviderDocumentGenerator` 並行呼叫三個 Provider，合併產出全部六種文件內容。三者必須全部成功才標記 `documents-ready`，任一失敗顯示錯誤並允許重試。

**替代方案考量**：每存一個欄位就即時產出 → 成本高且產出不完整，放棄。

### 物件類型支援：農地、住宅（第一版）

現場必問表依物件類型顯示不同欄位。第一版支援農地與住宅，其他類型（商辦、店面）列為未來擴充。

### FlowGo 整合：方案 A（手動銜接，第一版）

委託後階段，系統產出短影片劇本文字後，業務手動複製劇本貼入 FlowGo 的文字節點，由 FlowGo 跑「文字 → 圖片 → 影片」流程產出短影片。

**第一版不需要修改 FlowGo**，只需要房仲系統把劇本呈現清楚（純文字 + 複製按鈕）。

**預留擴充點（方案 B）**：FlowGo 後端已有標準化 REST API，未來可直接從房仲系統呼叫 FlowGo API 觸發節點流程，達到全自動化。此次不實作，但在 `post-listing-marketing` 模組中預留 `FlowGoAdapter` 介面，SaaS 版接上即可。

### Docker Container 封裝：跨平台執行環境

整個系統打包為 Docker Image，包含 Node.js runtime、Puppeteer + Chromium、SQLite、所有 npm 依賴。客戶電腦（Windows）只需安裝 Docker Desktop，執行 `docker compose up` 即可啟動，瀏覽器開 `localhost:3000` 使用。

交付物：`docker-compose.yml` + 安裝說明文件（一頁，步驟 ≤ 5 步）。

**替代方案考量**：打包 .exe（Electron）→ 需維護兩份打包流程（Mac/Windows），更新麻煩；要求客戶裝 Node.js → 環境設定出錯率高，支援成本大。Docker 一套解決所有平台問題。

### 本機 → SaaS 遷移路徑

第一版設計需確保日後可平滑遷移至雲端，遵守以下原則：

- **執行環境**：Docker Image 本機版和 VPS 版完全相同，部署到雲端只需 `docker compose up` 在伺服器上執行
- **資料層**：使用 SQLite（本機）但資料模型與 PostgreSQL 相容，遷移時只換 DB driver，不改 schema
- **AI 引擎**：`DocumentGenerator` 介面抽象，本機版注入 Codex CLI 實作，SaaS 版注入 Claude API 實作
- **檔案儲存**：PDF 存 Container 內 `/output` 目錄（掛載至本機），SaaS 版替換為 Cloudflare R2，路徑邏輯集中在 `StorageAdapter`
- **設定**：所有環境相關設定（路徑、API key、port）集中在 `.env`，不寫死在程式碼中

## Risks / Trade-offs

- **欄位清單未完整定義** → 客戶需提供「物件進來後需填寫哪些欄位」的完整清單，規格確認前以農地/住宅已知欄位為準，預留擴充空間
- **PDF 模板格式** → 不動產說明書、物調表需符合建安不動產的公司格式，需客戶提供樣版；第一版用合理預設，上線前需客戶確認
- **Codex CLI 產出品質** → 文件內容依賴 Codex CLI，需設計結構化 prompt 並測試邊界情況（欄位空白、異常資料）；SaaS 遷移時換成 Claude API 需重新驗證 prompt
- **FlowGo 手動銜接** → 第一版業務需手動複製劇本貼入 FlowGo，多一道人工步驟；若業務忘記操作，影片就不會產出；可接受，待 SaaS 版用 API 解決
- **Docker Desktop 安裝門檻** → 客戶需安裝 Docker Desktop（Windows 版），首次安裝約 5 分鐘；需確認客戶 Windows 版本支援（Windows 10/11 64-bit）；安裝後不需其他設定

## Open Questions

1. 客戶能否提供完整的現場必問表欄位清單（農地 + 住宅）？
2. 不動產說明書和物調表的公司格式樣版是否可提供？（PDF 模板設計依賴此）
3. 銷售 DM 是否有固定版型？還是 AI 自由產出文字即可？
4. 短影片劇本的格式需求？（口播稿、分鏡腳本、還是簡單文字大綱？）
