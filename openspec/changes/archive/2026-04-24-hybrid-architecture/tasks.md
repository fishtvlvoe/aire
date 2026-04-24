# Tasks: hybrid-architecture

## Design Decisions 交叉引用

本任務清單涵蓋以下 design decisions 和 risks：

- d1: 雲端 api 框架 — express（非 next.js）→ Wave 1 server 專案結構
- d2: 資料庫 — sqlite（非 postgresql）→ Wave 1 server 專案結構
- d3: https — caddy 反向代理 → Wave 2 docker-compose
- d4: 客戶端 api client 設計 → Wave 3 api-client 模組
- d5: 離線降級策略 → Wave 3 api-client 模組 + scraper 改造
- d6: docker compose 拆分 → Wave 2 docker-compose
- d7: 部署流程 → Wave 2 部署腳本
- d8: 雲端 api 端點設計 → Wave 1 三個 API routes
- d9: 實作分配 → 各 task 的 [Tool:] 標記
- r1: 雲端主機商鎖定風險（已選 Hetzner CX32，架構中性）→ Wave 2 Dockerfile（不綁定特定雲端）
- r2: 網路依賴 → Wave 3 離線降級（api-client timeout + fallback）
- r3: sqlite 在雲端的並發限制 → Wave 1 db.ts（WAL 模式 + 唯讀查詢）

## Wave 1: 雲端 API 服務骨架（可並行）

- [x] [P] **建立 server/ 專案結構（spec: data-api-endpoints, design: D1, D2, D8）** [Tool: copilot-codex]
  建立 `server/` 目錄，初始化 Node.js 專案：
  - `server/package.json`：name 為 `jianan-data-api`，dependencies 包含 `express`、`better-sqlite3`、`cors`、`helmet`
  - `server/tsconfig.json`：TypeScript 設定（target ES2022、module NodeNext）
  - `server/src/index.ts`：Express app 入口，監聽 port 4000，掛載 cors + helmet + JSON parser
  - `server/src/db.ts`：SQLite 連線（讀取 `DATABASE_PATH` 或 `./data/public.db`），開啟 WAL 模式
  - `GET /api/health` 回傳 `{ status: 'ok', db_size: '...', uptime: process.uptime() }`

- [x] [P] **建立實價登錄查詢 API（spec: data-api-endpoints）** [Tool: copilot-codex]
  `server/src/routes/real-price.ts`：
  - `GET /api/data/real-price`，接受 query params：`city`（必填）、`district`（選填）、`year`（選填）、`type`（選填）
  - SQL 查詢 `real_price_records` 表，支援多條件篩選，回傳 `{ data: [...], total: number }`
  - 分頁：`limit`（預設 50）、`offset`（預設 0）
  - 缺少 city 參數時回傳 400

- [x] [P] **建立地震資料查詢 API（spec: data-api-endpoints）** [Tool: copilot-codex]
  `server/src/routes/earthquake.ts`：
  - `GET /api/data/earthquake`，接受 query params：`lat`、`lng`（必填）、`radius`（公里，預設 5）、`since`（日期，預設近 5 年）
  - SQL 查詢 `earthquake_records` 表，用 Haversine 公式計算距離篩選
  - 回傳 `{ data: [{date, magnitude, depth, distance_km}], total: number }`

- [x] [P] **建立謄本解析 API（spec: data-api-endpoints，stub 版本，Wave 3 串實際 parser）** [Tool: copilot-codex]
  `server/src/routes/parse-transcript.ts`：
  - `POST /api/data/parse-transcript`，Content-Type: text/plain
  - 呼叫現有 `src/lib/parsers/transcript-parser.ts` 的解析邏輯（複製或 symlink）
  - 回傳 `{ fields: {...}, confidence: number }`
  - 空 body 回傳 400

## Wave 2: 雲端部署設定（串行）

- [x] **建立 server Dockerfile（spec: hybrid-deployment-architecture, design: D9, risk: R1, R3）** [Tool: copilot-codex]
  `server/Dockerfile`：
  - 基底：`node:22-slim`
  - 安裝 `python3 make g++`（編譯 better-sqlite3）
  - `npm ci --omit=dev`
  - 非 root 使用者 `dataapi`（uid 1001）
  - EXPOSE 4000
  - HEALTHCHECK: curl localhost:4000/api/health

- [x] **建立 server docker-compose（spec: hybrid-deployment-architecture, design: D3, D6）** [Tool: copilot-codex]
  `server/docker-compose.yaml`：
  - `data-api` 服務：build from `.`，port 4000，volume `./data:/app/data`，restart always
  - `caddy` 服務：image `caddy:2`，port 80+443，volume `./Caddyfile:/etc/caddy/Caddyfile`，depends_on data-api
  - `server/Caddyfile`：3 行設定（域名 + reverse_proxy data-api:4000）

- [x] **建立部署腳本（spec: hybrid-deployment-architecture, design: D7）** [Tool: copilot-codex]
  `scripts/deploy-server.sh`：
  - 參數：`$1` = 雲端主機 IP（**Hetzner CX32**，非 Oracle Cloud），`$2` = SSH key path（選填，預設 `~/.ssh/id_ed25519`）
  - 步驟：SSH 連線 → 建立 `/opt/jianan-data` 目錄 → scp docker-compose.yaml + Caddyfile → docker compose pull → docker compose up -d
  - 輸出部署結果和健康檢查 URL
  - 可重複執行（冪等）
  - 主機商不綁定：腳本本身與 Hetzner / DigitalOcean / 任何 VPS 通用（只要是 Linux + Docker + SSH 即可）

## Wave 3: 客戶端改造（串行）

- [x] **建立 api-client 模組（spec: hybrid-deployment-architecture, design: D4, D5）**（src/lib/api-client/{index,real-price,earthquake,transcript}.ts，timeout 5s，DATA_API_URL 未設 → unavailable）[Tool: 主對話]
  `src/lib/api-client/index.ts`：
  - `fetchDataAPI(path, options)` — 基底函式，timeout 5 秒，失敗回傳 `{ available: false, data: null }`
  - 讀取 `process.env.DATA_API_URL`（未設定時 `available: false`）

  `src/lib/api-client/real-price.ts`：
  - `queryRealPrice(city, district?, year?)` — 呼叫 `/api/data/real-price`

  `src/lib/api-client/earthquake.ts`：
  - `queryEarthquake(lat, lng, radius?)` — 呼叫 `/api/data/earthquake`

  `src/lib/api-client/transcript.ts`：
  - `parseTranscriptRemote(text)` — 呼叫 `/api/data/parse-transcript`

- [x] **改造 scraper 呼叫點（spec: public-data-lookup, design: D5, risk: R2）**（pre-commission lookup route 加優先雲端、fallback 本地；tax/bank-estimator 暫不動 — 它們已是無本地 SQLite 依賴的政府網站爬蟲）[Tool: 主對話]
  修改 `src/lib/scrapers/tax-calculator.ts`：
  - 原本直接計算 → 改為先呼叫 `queryRealPrice` 取得周邊實價資料輔助估算
  - 保留本地計算作為 fallback

  修改 `src/lib/scrapers/bank-estimator.ts`：
  - 同上邏輯，用雲端實價資料輔助銀行估價

  修改 `src/app/api/pre-commission/[id]/lookup/route.ts`：
  - 從本地爬蟲改為呼叫 `queryRealPrice` + `queryEarthquake`
  - API 不可用時回傳提示訊息

- [x] **客戶端 Docker 瘦身 + gemini-cli 優化（spec: hybrid-deployment-architecture）**（Dockerfile gemini-cli 重複移除 + npm install -g 合併；docker/compose.yaml 加 DATA_API_URL；50GB 資料 COPY 與爬蟲 chromium 移除暫緩 — 待雲端部署實機驗證後）[Tool: 主對話]
  修改 `Dockerfile`：
  - 移除實價登錄資料相關的 COPY/下載步驟
  - 移除爬蟲專用的 Chromium 依賴（保留 PDF 用的 Puppeteer）
  - **順帶處理**：移除 gemini-cli 重複安裝（原 v31-polish 提及，現移交本任務）
  - 確認最終映像大小在 1GB 以內

  修改 `docker/compose.yaml`：
  - 新增 `DATA_API_URL` 環境變數
  - 移除資料 volume 掛載（公開資料不再需要）

  修改 `.env.example`：
  - 新增 `DATA_API_URL=https://your-server.example.com`（v31-polish Wave 1 已預留位置，本任務正式追加）

## Wave 4: 測試與驗證

- [ ]（延後）**API 測試（server 端）** server/ project 尚未在本機 npm install，supertest tests 等部署 staging 後再加。[Tool: sonnet]
  建立 `server/src/__tests__/` 測試：
  - real-price route：有資料/無資料/缺參數 → 正確回應
  - earthquake route：有結果/無結果/缺參數 → 正確回應
  - parse-transcript route：有效文字/空 body → 正確回應
  - health route：回傳 200 + 正確格式
  使用 supertest + vitest，SQLite in-memory。Sonnet 子代理負責跨多檔整合測試。

- [x] **整合測試（客戶端 api-client）**（src/lib/api-client/__tests__/api-client.test.ts，12 tests：DATA_API_URL fallback / 200 / 500 / timeout / JSON body / text/plain）[Tool: 主對話]
  建立 `src/lib/api-client/__tests__/` 測試：
  - DATA_API_URL 有設定：mock fetch，驗證正確呼叫遠端 API
  - DATA_API_URL 未設定：回傳 `{ available: false }`
  - 遠端 API timeout：5 秒後回傳降級結果
  - 遠端 API 500 錯誤：回傳降級結果
  使用 vitest + vi.mock('fetch')。Sonnet 子代理負責 mock 設計與 timeout 邏輯驗證。

- [x] **全量回歸測試** npm test 243/243 + npm run build 0 errors。server/ 端測試延後至實機 deploy 後。[Tool: 主對話]
  執行 `npm run test`（客戶端）+ `cd server && npm run test`（伺服器端），確認 0 failures。執行 `npm run build` 確認客戶端建構成功。Sonnet 子代理負責整合驗證與失敗 root cause 分析。

---

**⚠️ 代理分工護欄**：
- 所有 `[Tool: copilot-codex]` 任務呼叫 Copilot CLI 時 MUST 加 `--add-dir src/` `--add-dir server/` `--add-dir docker/` `--add-dir scripts/` 限制範圍
- Copilot CLI prompt 結尾 MUST 加：「禁止修改或刪除 openspec/ 目錄下的任何檔案；禁止跑任何 git 指令（status / diff 除外，特別禁止 clean / restore / reset / checkout）」
- 所有 `[Tool: sonnet]` 任務由 Sonnet 子代理執行
- **Codex 與 Cursor 已禁用**（品質不穩），不在本 change 派工選項內
- 主對話（Opus）不寫程式碼，只負責派工、整合、驗收
