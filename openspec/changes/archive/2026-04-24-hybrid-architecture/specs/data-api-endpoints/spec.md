## ADDED Requirements

### Requirement: Cloud Real-Price Lookup API

雲端 API 服務 SHALL 提供 `GET /api/data/real-price` 端點，接受 query params 並回傳實價登錄資料。

- 必填參數：`city`（縣市名稱）
- 選填參數：`district`（行政區）、`year`（年份）、`type`（建物類型）、`limit`（預設 50）、`offset`（預設 0）
- 回傳 JSON：`{ data: [{address, price, area, date}], total: number }`
- 缺少 `city` 時 SHALL 回 HTTP 400

#### Scenario: 查詢台南東區 2024 年成交

- **WHEN** 客戶端 GET `/api/data/real-price?city=台南&district=東區&year=2024`
- **THEN** 伺服器 SHALL 從 SQLite 查詢符合條件的記錄
- **AND** 回傳 `{ data: [...], total: <number> }` 結構

#### Scenario: 缺少必填參數

- **WHEN** 客戶端 GET `/api/data/real-price?district=東區`（缺 city）
- **THEN** 伺服器 SHALL 回 HTTP 400 + 錯誤訊息

#### Scenario: 分頁

- **WHEN** 客戶端 GET `/api/data/real-price?city=台南&limit=10&offset=20`
- **THEN** 伺服器 SHALL 回傳第 21–30 筆記錄

### Requirement: Cloud Earthquake Lookup API

雲端 API 服務 SHALL 提供 `GET /api/data/earthquake` 端點，根據經緯度回傳周邊地震記錄。

- 必填參數：`lat`、`lng`
- 選填參數：`radius`（公里，預設 5）、`since`（日期，預設近 5 年）
- 回傳 JSON：`{ data: [{date, magnitude, depth, distance_km}], total: number }`
- 距離計算 SHALL 使用 Haversine 公式
- 缺少 lat 或 lng 時 SHALL 回 HTTP 400

#### Scenario: 查詢台南某點周邊 5 公里

- **WHEN** 客戶端 GET `/api/data/earthquake?lat=22.99&lng=120.21&radius=5`
- **THEN** 伺服器 SHALL 用 Haversine 公式計算距離並篩選 5 公里內的地震
- **AND** 每筆記錄 SHALL 包含 `distance_km` 欄位

#### Scenario: 缺少必填參數

- **WHEN** 客戶端 GET `/api/data/earthquake?lat=22.99`（缺 lng）
- **THEN** 伺服器 SHALL 回 HTTP 400 + 錯誤訊息

### Requirement: Cloud Transcript Parse API

雲端 API 服務 SHALL 提供 `POST /api/data/parse-transcript` 端點，接收謄本純文字並回傳結構化欄位。

- Content-Type：`text/plain`
- Request body：謄本文字
- 回傳 JSON：`{ fields: {owner, area, ...}, confidence: number }`
- 空 body 時 SHALL 回 HTTP 400
- 內部呼叫共用解析邏輯（與客戶端 `src/lib/parsers/transcript-parser.ts` 等價）

#### Scenario: 解析有效謄本文字

- **WHEN** 客戶端 POST 包含謄本文字的 request
- **THEN** 伺服器 SHALL 回傳 `{ fields: {...}, confidence: <0..1> }`

#### Scenario: 空 body

- **WHEN** 客戶端 POST 空 body
- **THEN** 伺服器 SHALL 回 HTTP 400 + 錯誤訊息

### Requirement: Health Check Endpoint

雲端 API 服務 SHALL 提供 `GET /api/health` 端點，回傳服務狀態。

- 回傳 JSON：`{ status: 'ok', db_size: string, uptime: number }`
- 必須無認證即可訪問
- HEALTHCHECK 應從此端點判斷容器健康

#### Scenario: 健康檢查

- **WHEN** 客戶端或 Docker HEALTHCHECK GET `/api/health`
- **THEN** 伺服器 SHALL 回 HTTP 200 + `{ status: 'ok', db_size: '...', uptime: <number> }`
