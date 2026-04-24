## Context

建安 AI 房產文件系統目前採用純本機部署：所有功能（UI、LLM、PDF、實價登錄資料、爬蟲）打包在一個 Docker 容器內，映像含 50GB 公開資料。客戶為台南房仲業者，目前 1 個客戶，預計擴展到 3-20 個。

系統架構圖：

```
客戶端（Windows Docker）              Hetzner CX32（雲端 VPS, €7/mo）
┌──────────────────────┐            ┌──────────────────────┐
│  Next.js UI          │            │  Express API Server  │
│  SQLite（案件資料）   │            │  SQLite（公開資料）   │
│  LLM CLI（AI 生成）  │  ←REST→   │                      │
│  Puppeteer（PDF）    │            │  /api/data/real-price│
│  api-client 模組     │            │  /api/data/earthquake│
│                      │            │  /api/data/transcript│
│  ~500MB              │            │  Caddy（HTTPS）      │
└──────────────────────┘            │  ~5GB                │
                                    └──────────────────────┘
```

**雲端主機選擇**：原計畫使用 Oracle Cloud Always Free，但因 Oracle 免費方案條款不穩、台灣連線品質不佳，改用 **Hetzner Cloud CX32**（€7/mo ≈ NT$240，4GB RAM / 80GB SSD，Helsinki 或 Falkenstein 機房）。架構本身雲端中性，未來如要換 DigitalOcean / Contabo / 自家 Mac mini + Cloudflare Tunnel 都可，只需改 IP + 重跑 deploy script。

## Goals / Non-Goals

**Goals:**

- 客戶端映像從 50GB 降至 500MB，安裝時間從 1 小時降至 5 分鐘
- 公開資料更新時只改雲端，客戶端不需重新部署
- 爬蟲維護集中化，改一次全部客戶生效
- 雲端成本可控（Hetzner CX32，€7/mo ≈ NT$240，3-20 個客戶分攤後可忽略）
- 客戶隱私資料不離開客戶電腦

**Non-Goals:**

- 不做多租戶或使用者認證（公開資料，無隱私風險）
- 不改變 UI 流程或 LLM 串接方式
- 不遷移案件資料到雲端
- 不做即時爬蟲（定期更新即可）

## Decisions

### D1: 雲端 API 框架 — Express（非 Next.js）

純 API 服務不需要 React SSR。Express 記憶體佔用小（Hetzner CX32 4GB RAM 綽綽有餘，未來換更小規格主機也跑得動），啟動快，Docker 映像更小。

### D2: 資料庫 — SQLite（非 PostgreSQL）

雲端端仍用 SQLite：與客戶端一致減少複雜度、讀多寫少場景效能足夠、Hetzner VPS 自管 SQLite 比起額外付費代管資料庫成本低，資料量預估 2-5GB。

### D3: HTTPS — Caddy 反向代理

Caddy 自動取得和續約 Let's Encrypt 憑證（零設定），設定檔 3 行，Docker 部署友好。

### D4: 客戶端 API Client 設計

`src/lib/api-client/` 統一封裝雲端 API 呼叫：

- `fetchDataAPI(path, options)` — 基底函式，帶 timeout（5 秒）和錯誤處理
- `queryRealPrice(city, district)` — 實價登錄查詢
- `queryEarthquake(lat, lng, radius)` — 地震資料查詢
- `parseTranscript(text)` — 謄本解析

### D5: 離線降級策略

雲端 API 不可用時：實價登錄/地震查詢回傳空結果 + 提示訊息；謄本解析回退到客戶端本地 parser（保留現有 transcript-parser）；案件填寫、AI 文件生成、PDF 產出不受影響。

api-client 加入 try-catch + 5 秒 timeout，失敗回傳 `{ available: false, data: null }`。

### D6: Docker Compose 拆分

- **server/docker-compose.yaml（雲端）**：data-api（Express, port 4000）+ caddy（HTTPS 443→4000）+ volume 掛載 SQLite
- **docker/compose.yaml（客戶端，修改現有）**：移除資料/爬蟲依賴，新增 `DATA_API_URL` 環境變數，映像縮至 500MB

### D7: 部署流程

開發者 docker build → push Docker Hub → `scripts/deploy-server.sh`（SSH 進 Hetzner CX32 → docker pull → compose up）。腳本本身與雲端供應商無關，僅需 Linux + Docker + SSH 環境即可。

### D8: 雲端 API 端點設計

| 端點 | 方法 | 參數 | 回傳 |
|------|------|------|------|
| `/api/data/real-price` | GET | city, district, year, type | `{ data: [{address, price, area, date}], total: number }` |
| `/api/data/earthquake` | GET | lat, lng, radius, since | `{ data: [{date, magnitude, depth, distance}], total: number }` |
| `/api/data/parse-transcript` | POST | body: 謄本文字 | `{ fields: {owner, area, ...}, confidence: number }` |
| `/api/health` | GET | — | `{ status: 'ok', db_size: '2.3GB', uptime: 12345 }` |

### D9: 實作分配（Codex / Cursor 已禁用）

| 模組 | 代理 | 原因 |
|------|------|------|
| server/ API 服務 | Copilot CLI | 標準 Express + SQLite CRUD |
| src/lib/api-client/ | Copilot CLI | 模組封裝 |
| 客戶端 scraper 改造 | Copilot CLI | 既有檔案修改 |
| Dockerfile + compose（含 gemini-cli 優化）| Copilot CLI | bash/docker 標準操作 |
| deploy-server.sh | Copilot CLI | bash script |
| 測試（API + 整合 + 回歸） | Sonnet 子代理 | 跨多模組整合測試，需推理 mock + timeout 邏輯 |
| Code Review | Kimi MCP | 多檔分析（不寫碼） |

**禁用工具**：Codex CLI、Cursor-agent（產出品質不穩，全面禁用）

## Risks / Trade-offs

### R1: 雲端主機商鎖定風險（已透過架構中性化解決）

風險：任何雲端主機商可能漲價、終止服務、或政策異動。
對策：架構不綁定特定供應商——Docker + Express + SQLite + Caddy 的組合可以在任何 Linux + Docker 環境上跑。**目前選用 Hetzner CX32**（€7/mo，歐洲機房），備案：DigitalOcean / Contabo / 自家 Mac mini + Cloudflare Tunnel。遷移只需：(1) 開新主機 (2) 改 deploy script 的 IP (3) 跑 docker compose up，估計 1.5 小時內完成。

### R2: 網路依賴

風險：客戶端查詢公開資料時需要網路。
對策：D5 離線降級策略確保核心功能（填表、AI 生成、PDF）不受影響。公開資料查詢本來就是「有更好、沒有也能用」的輔助功能。

### R3: SQLite 在雲端的並發限制

風險：多個客戶同時查詢時，SQLite 可能出現 database lock。
對策：公開資料是唯讀的（只有定期更新才寫入），read 不會互相 lock。開啟 WAL 模式允許讀寫並行。預估 3-20 個客戶的查詢量遠低於 SQLite 的讀取吞吐上限。
