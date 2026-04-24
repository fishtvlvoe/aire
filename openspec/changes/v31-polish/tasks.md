# Tasks: v31-polish

## Wave 1: 快速修補（無依賴，可並行）

- [ ] [P] **metadata 品牌化** [Tool: copilot-codex]
  修改 `src/app/layout.tsx`：將 `metadata.title` 從 "Create Next App" 改為 "建安 AI 房產文件系統"，`metadata.description` 改為 "三段式 AI 房產文件自動產出系統"。若有 favicon 相關設定也一併更新。

- [ ] [P] **.env.example 補全** [Tool: copilot-codex]
  更新 `.env.example`，加入以下變數並附註中文說明：
  - `DB_PATH=./data/listings.db`（必填，SQLite 檔案路徑）
  - `DATABASE_PATH=`（Docker 環境覆蓋用，優先於 DB_PATH）
  - `LLM_BACKEND=codex`（AI 後端：codex / claude-code / gemini / ollama）
  - `CODEX_API_KEY=`（使用 codex 後端時必填）
  - `PUPPETEER_EXECUTABLE_PATH=`（可選，指定 Chromium 路徑）
  - `CHROMIUM_PATH=`（可選，Puppeteer 替代變數）
  - `DOSSIER_LOGO_PATH=`（可選，說明書 PDF logo 路徑）
  - `DATA_ROOT=./data`（可選，上傳/輸出根目錄）
  - `PORT=3000`（可選，監聽埠）
  - **註**：`DATA_API_URL` **不在本任務範圍**，保留給 hybrid-architecture Wave 3 追加（避免兩個 change 同時改 .env.example 造成衝突）

- [ ] [P] **CI/CD pipeline（spec: ci-cd-pipeline）** [Tool: copilot-codex]
  建立 `.github/workflows/ci.yml`：
  - name: CI
  - on: push (main), pull_request (main)
  - jobs.test: runs-on ubuntu-latest
    - checkout
    - setup-node 22, cache npm
    - npm ci
    - npm run test
    - npm run build
  - 環境變數：`DATABASE_PATH: ':memory:'`（與 vitest.config.ts 一致）
  - Puppeteer：設 `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true'`，安裝 `chromium-browser` apt 套件，設 `PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser`

## Wave 2: PDF 模板（串行，因為共用模板架構）

- [ ] **建立 survey PDF 模板（spec: professional-pdf-templates）** [Tool: copilot-codex]
  建立 `src/lib/pdf-generator/templates/survey.html` 和 `survey.css`：
  - 參考現有 `src/lib/pdf-generator/templates/dossier.html` + `dossier.css` 的結構
  - A4 格式、Noto Serif TC 字體
  - 頁首：建安不動產 logo + 物件地址
  - 頁尾：頁碼 + 日期
  - 內容區：物調表的各章節（基本資訊、建物現況、權利狀態、周邊環境）使用表格排版
  - 支援動態資料注入（Mustache 或模板字串替換）

- [ ] **建立 sales-dm PDF 模板** [Tool: copilot-codex]
  建立 `src/lib/pdf-generator/templates/sales-dm.html` 和 `sales-dm.css`：
  - 參考 dossier 模板結構
  - A4 格式，設計偏行銷風格（大標題、亮點條列、照片區塊）
  - 頁首：物件名稱 + 總價
  - 頁尾：經紀人聯絡資訊
  - 內容區：物件亮點、基本規格表、周邊生活圈

- [ ] **整合 PDF route 使用新模板** [Tool: copilot-codex]
  修改 `src/app/api/listings/[id]/pdf/route.ts`：
  - survey 類型：讀取 survey.html + survey.css，將 listing 資料注入模板，用 Puppeteer 渲染為 PDF
  - sales-dm 類型：讀取 sales-dm.html + sales-dm.css，同樣方式渲染
  - 移除原本 survey / sales-dm 的 `<pre>` 排版邏輯
  - 保留 disclosure 類型不變（已使用 dossier 模板）

## Wave 3: 驗證

- [ ] **全量測試 + build 驗證** [Tool: sonnet]
  執行 `npm run test` 確認 0 failures，執行 `npm run build` 確認 0 errors。啟動 dev server，用 curl 抓 `/api/listings/34/pdf?type=survey` 和 `/api/listings/34/pdf?type=sales-dm` 確認 PDF 產出正常（HTTP 200 + Content-Type: application/pdf）。Sonnet 子代理負責整合驗證並截圖確認。

---

**⚠️ Non-Goal 變更紀錄**：
- **Dockerfile gemini-cli 重複安裝優化**：原本提及「可順手修」，現移交給 hybrid-architecture Wave 3 一併處理（避免兩個 change 同時動 Dockerfile 造成 merge 衝突）。本 change 不再涉及 Dockerfile 任何修改。

**代理分工護欄**：
- 所有 `[Tool: copilot-codex]` 任務呼叫 Copilot CLI 時 MUST 加 `--add-dir src/` `--add-dir .github/` 限制範圍
- Copilot CLI prompt 結尾 MUST 加：「禁止修改或刪除 openspec/ 目錄下的任何檔案；禁止跑任何 git 指令（status / diff 除外，特別禁止 clean / restore / reset / checkout）」
- 所有 `[Tool: sonnet]` 任務由 Sonnet 子代理執行
- **Codex 與 Cursor 已禁用**（品質不穩），不在本 change 派工選項內
- 主對話（Opus）不寫程式碼，只負責派工、整合、驗收
