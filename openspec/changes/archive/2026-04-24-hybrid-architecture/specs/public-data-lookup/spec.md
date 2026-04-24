## ADDED Requirements

### Requirement: Client API Client Module

客戶端 SHALL 透過 `src/lib/api-client/` 模組統一封裝雲端 API 呼叫，包含基底 fetch、real-price、earthquake、transcript 四個檔案。

- `fetchDataAPI(path, options)` — 基底函式，timeout 5 秒、含 try-catch
- 讀取 `process.env.DATA_API_URL` 決定基底位址；未設定時 SHALL 回傳 `{ available: false, data: null }`
- `queryRealPrice(city, district?, year?)` — 呼叫 `/api/data/real-price`
- `queryEarthquake(lat, lng, radius?)` — 呼叫 `/api/data/earthquake`
- `parseTranscriptRemote(text)` — 呼叫 `/api/data/parse-transcript`

#### Scenario: DATA_API_URL 已設定

- **WHEN** 客戶端呼叫 `queryRealPrice('台南', '東區', 2024)`
- **THEN** 模組 SHALL fetch `${DATA_API_URL}/api/data/real-price?city=台南&district=東區&year=2024`
- **AND** 回傳 `{ available: true, data: [...] }`

#### Scenario: DATA_API_URL 未設定

- **WHEN** 環境變數 `DATA_API_URL` 為空
- **THEN** 任何 api-client 函式呼叫 SHALL 立刻回傳 `{ available: false, data: null }`，不發任何網路請求

### Requirement: Offline Degradation Strategy

雲端 API 不可用時（網路失敗、timeout、5xx），客戶端 SHALL 降級回傳空結果而非 throw error，使核心功能（填表、AI 生成、PDF）不受影響。

- timeout 設為 5 秒
- 失敗統一回傳 `{ available: false, data: null }`（或同等結構）
- 謄本解析 SHALL 額外提供「回退到本地 parser」的選項，呼叫端可決定是否使用

#### Scenario: 雲端 API timeout

- **WHEN** 客戶端呼叫 `queryRealPrice` 且雲端 5 秒未回應
- **THEN** 模組 SHALL 回傳 `{ available: false }`
- **AND** UI SHALL 顯示「公開資料暫時無法查詢」提示，不阻擋業務流程

#### Scenario: 雲端 API 回 500 錯誤

- **WHEN** 客戶端呼叫且雲端回 HTTP 500
- **THEN** 模組 SHALL 回傳 `{ available: false }`，不 throw error

#### Scenario: 謄本解析降級

- **WHEN** 客戶端呼叫 `parseTranscriptRemote` 失敗
- **THEN** 呼叫端 SHALL 可選擇 fallback 到本地 `transcript-parser`，繼續完成現勘流程

### Requirement: Scraper Refactor to Cloud API

既有 scraper 模組 SHALL 改為呼叫 api-client 而非直接讀本地 SQLite。

- `src/lib/scrapers/tax-calculator.ts`：改用 `queryRealPrice` 取得周邊實價輔助估算（保留本地計算為 fallback）
- `src/lib/scrapers/bank-estimator.ts`：同上邏輯
- `src/app/api/pre-commission/[id]/lookup/route.ts`：從本地爬蟲改為呼叫 `queryRealPrice` + `queryEarthquake`，API 不可用時回傳提示訊息

#### Scenario: tax-calculator 使用雲端資料

- **WHEN** 客戶端執行稅金計算
- **THEN** 模組 SHALL 呼叫 `queryRealPrice` 取得參考價
- **AND** API 不可用時 SHALL 退回本地計算

#### Scenario: pre-commission lookup 改走雲端

- **WHEN** 業務在系統內查詢委託前資料
- **THEN** lookup route SHALL 呼叫雲端 `queryRealPrice` 與 `queryEarthquake`
- **AND** 雲端不可用時 SHALL 回應「公開資料暫時無法查詢，請稍後再試」
