## ADDED Requirements

### Requirement: Server Containerization

雲端 API 服務 SHALL 以獨立 Docker 容器部署，不與客戶端共用映像。

- 基底映像：`node:22-slim`
- 包含編譯依賴：`python3`、`make`、`g++`（編譯 better-sqlite3）
- `npm ci --omit=dev` 安裝產品依賴
- 以非 root 使用者執行（如 `dataapi` uid 1001）
- EXPOSE 4000
- 包含 HEALTHCHECK 指令呼叫 `/api/health`

#### Scenario: 建置 server 映像

- **WHEN** 開發者執行 `docker build -t jianan-data-api server/`
- **THEN** 映像 SHALL 包含 Express、better-sqlite3、cors、helmet
- **AND** 映像大小 SHALL 控制在 500MB 以內

#### Scenario: HEALTHCHECK 偵測容器狀態

- **WHEN** Docker 執行 HEALTHCHECK
- **THEN** 容器內 curl `/api/health` 回 200 → 容器標示 healthy
- **AND** 連續多次 unhealthy → Docker 標示為 unhealthy

### Requirement: HTTPS via Caddy Reverse Proxy

雲端部署 SHALL 透過 Caddy 反向代理提供 HTTPS。

- Caddy 自動取得與續約 Let's Encrypt 憑證
- Caddyfile 設定簡潔（≤ 5 行）
- Caddy port 80/443 → data-api port 4000

#### Scenario: 自動取得 SSL 憑證

- **WHEN** Caddy 首次啟動且設定指向公開域名
- **THEN** Caddy SHALL 自動向 Let's Encrypt 申請憑證
- **AND** 服務 SHALL 透過 HTTPS 提供 API

### Requirement: Server Docker Compose Stack

`server/docker-compose.yaml` SHALL 定義雲端服務的 compose stack：

- `data-api` 服務：build from `.`，port 4000，volume `./data:/app/data`，restart always
- `caddy` 服務：image `caddy:2`，port 80/443，volume `./Caddyfile:/etc/caddy/Caddyfile`，depends_on data-api
- `Caddyfile` 反向代理設定

#### Scenario: 一次啟動完整 stack

- **WHEN** 在雲端執行 `docker compose up -d`
- **THEN** data-api + caddy 兩個容器 SHALL 啟動並就緒
- **AND** 公開域名 SHALL 透過 HTTPS 可訪問 API

### Requirement: Idempotent Deployment Script

部署腳本 `scripts/deploy-server.sh` SHALL 一鍵部署到任意 Linux + Docker 環境，腳本本身與雲端供應商無關。

- 參數：`$1` = 雲端主機 IP（首選 Hetzner CX32），`$2` = SSH key path（選填）
- 步驟：SSH → 建立 `/opt/jianan-data` → scp docker-compose.yaml + Caddyfile → docker compose pull → docker compose up -d
- 輸出部署結果與健康檢查 URL
- 可重複執行（冪等）

#### Scenario: 首次部署

- **WHEN** 開發者執行 `./scripts/deploy-server.sh <hetzner-ip>`
- **THEN** 腳本 SHALL 完成所有步驟並回報健康檢查 URL
- **AND** 健康檢查 URL SHALL 回 HTTP 200

#### Scenario: 重複部署（冪等性）

- **WHEN** 開發者再次執行同一腳本
- **THEN** 腳本 SHALL 不重複建立目錄、不破壞現有資料、僅更新映像並重啟服務

### Requirement: Client Image Slimming

客戶端 Docker 映像 SHALL 移除公開資料與爬蟲依賴，最終大小 ≤ 1GB（目標 500MB）。

- 移除實價登錄資料 COPY 步驟
- 移除爬蟲專用 Chromium（保留 PDF 用 Puppeteer）
- 移除 gemini-cli 重複安裝（從 v31-polish Non-Goals 移交）
- `docker/compose.yaml` 新增 `DATA_API_URL` 環境變數
- 移除公開資料 volume 掛載

#### Scenario: 客戶端不再內含實價登錄資料

- **WHEN** 開發者建置客戶端映像
- **THEN** 映像 SHALL 不含 50GB 實價登錄資料
- **AND** 映像大小 SHALL ≤ 1GB

#### Scenario: 客戶端透過環境變數連雲端

- **WHEN** 客戶啟動容器並設定 `DATA_API_URL=https://api.example.com`
- **THEN** 客戶端 SHALL 將公開資料查詢轉送至雲端 API
