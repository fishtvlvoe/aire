## Summary

將系統從「全部塞在客戶端」的純本機部署，改為「客戶端 UI + 雲端資料」的混合架構，客戶端從 50GB 降至 500MB。

## Motivation

目前系統將所有功能（UI、LLM、PDF、實價登錄 50GB 資料、爬蟲）全部打包在一個 Docker 容器內交付客戶。這造成三個問題：

1. **安裝太慢**：50GB 映像檔要下載很久，客戶體驗差
2. **更新痛苦**：實價登錄資料更新時，每台客戶機都要重新下載
3. **爬蟲維護困難**：目標網站改版時，要逐台客戶更新爬蟲邏輯

混合架構的核心思路：**私人資料（案件、客戶資訊）留在客戶本機，公開資料（實價登錄、地震、謄本查詢）搬到雲端集中管理。**

雲端使用 **Hetzner Cloud CX32**（€7/mo ≈ NT$240，4GB RAM / 80GB SSD），部署成本可控、架構不綁定特定主機商（未來可換 DigitalOcean / Contabo / 自家 Mac mini + Cloudflare Tunnel）。

## Proposed Solution

### Phase 1: 建立雲端資料 API 服務

建立獨立的資料查詢微服務（`server/` 目錄），包含：

- **實價登錄查詢 API**：`GET /api/data/real-price?city=台南&district=東區&year=2024`
  - 資料來源：定期爬取內政部實價登錄開放資料，存入 SQLite
  - 只存客戶服務區域（台南），資料量約 2-3GB
- **地震資料查詢 API**：`GET /api/data/earthquake?lat=22.99&lng=120.21&radius=5`
  - 資料來源：中央氣象署開放資料 API
  - 快取近 5 年資料，約 500MB
- **謄本解析 API**：`POST /api/data/parse-transcript` + `Content-Type: text/plain`
  - 接收謄本文字，回傳結構化 JSON
  - 無狀態，不需要持久化

技術選型：
- Runtime：Node.js 22 + Express（輕量、與現有技術棧一致）
- 資料庫：SQLite（與客戶端一致，免維運）
- 容器化：獨立 Dockerfile + docker-compose（server-compose.yaml）

### Phase 2: 改造客戶端

- 新增 `src/lib/api-client/` 模組，統一封裝雲端 API 呼叫
- 修改現有 scraper 呼叫點（tax-calculator、bank-estimator），從直接讀本地 SQLite 改為呼叫 api-client
- 修改 pre-commission lookup，從本地爬蟲改為呼叫雲端 API
- 新增環境變數 `DATA_API_URL`（雲端 API 位址）
- Docker 映像瘦身：移除 50GB 資料和爬蟲依賴，保留 UI + LLM + PDF
- **順帶處理**：移除 Dockerfile 內 gemini-cli 重複安裝（從 v31-polish Non-Goals 移交）

### Phase 3: 部署與串接

- 建立部署腳本 `scripts/deploy-server.sh`：一鍵部署到 Hetzner CX32（架構雲端中性，腳本通用）
- 設定 HTTPS（Let's Encrypt + Caddy 反向代理）
- 健康檢查端點 `GET /api/health`
- 客戶端 Docker compose 只需設定 `DATA_API_URL` 指向雲端

## Non-Goals

- 不改變現有 UI 流程（案件列表、現勘表單、文件生成頁面不動）
- 不改變 LLM 串接方式（仍在客戶端本機呼叫 AI CLI）
- 不做多租戶（每個客戶看到的資料相同，都是公開資料）
- 不做使用者認證（雲端 API 只提供公開資料查詢，無隱私風險）
- 不遷移案件資料（SQLite 案件庫留在客戶端）

## Alternatives Considered

1. **純 SaaS**：全部搬到雲端。但需要處理多租戶、客戶資料安全、更高的伺服器成本。適合 20+ 客戶時再考慮。
2. **Cloudflare D1**：Serverless SQLite。但 10GB 上限可能不夠，且需要改寫資料庫驅動。
3. **Supabase**：代管 PostgreSQL。需要從 SQLite 遷移，增加複雜度。
4. **台灣本土 VPS（遠振/戰國策）**：需要手動管理 Linux，維護成本與 Hetzner 相同，但月費 TWD 1200-1500 約為 Hetzner CX32 的 5 倍，且歐洲機房對台灣用戶 latency 250ms 對純 API 查詢影響可接受。
5. **Oracle Cloud Always Free**：原計畫使用，但條款不穩、台灣連線品質差，改採 Hetzner。
6. **自家 Mac mini + Cloudflare Tunnel**：成本 $0/mo 但需要硬體常開，列為未來備案而非首選。
7. **Cloudflare R2 + Workers**：邊緣計算成本最低，但 Workers 無檔案系統不能跑 SQLite，D1 單 db 10GB 上限要切 5+ 個 db、JOIN 不可，整個資料層要重設計，工程量大。

## Impact

- Affected specs: container-deployment（部署架構大改）、pre-commission-lookup（查詢改為雲端 API），以及新增 data-api-endpoints、hybrid-deployment-architecture、public-data-lookup
- Affected code:
  - New: server/package.json
  - New: server/src/index.ts
  - New: server/src/routes/real-price.ts
  - New: server/src/routes/earthquake.ts
  - New: server/src/routes/parse-transcript.ts
  - New: server/Dockerfile
  - New: server/docker-compose.yaml
  - New: server/Caddyfile
  - New: src/lib/api-client/index.ts
  - New: src/lib/api-client/real-price.ts
  - New: src/lib/api-client/earthquake.ts
  - New: src/lib/api-client/transcript.ts
  - New: scripts/deploy-server.sh
  - Modified: src/lib/scrapers/tax-calculator.ts
  - Modified: src/lib/scrapers/bank-estimator.ts
  - Modified: src/app/api/pre-commission/[id]/lookup/route.ts
  - Modified: Dockerfile（瘦身 + 移除 gemini-cli 重複安裝）
  - Modified: docker/compose.yaml（DATA_API_URL）
  - Modified: .env.example（新增 DATA_API_URL，與 v31-polish 預留位置對齊）
  - Removed: 客戶端 Dockerfile 內 50GB 公開資料 COPY、爬蟲 Chromium 依賴
- 對其他 change 的依賴：
  - 依賴 fix-failing-tests 完成（測試基線必須綠才能跑回歸）
  - 與 v31-polish 在 .env.example 與 Dockerfile 上協調（v31 預留，本 change 追加）
