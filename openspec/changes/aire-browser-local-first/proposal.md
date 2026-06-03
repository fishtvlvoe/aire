# AIRE 瀏覽器本地優先版（Browser Local-First Edition）

## Why

> 現況校正：AIRE 自 2026-05-28 起已脫離 Tauri，改採 **browser-local-runtime** 模式（本機 Node `standalone` server 跑 127.0.0.1，系統瀏覽器當 UI；Tauri 已 PARKED，見 `src-tauri/PARKED.md`）。本 change 的起點是 browser-local-runtime，不是 Tauri。

無論 Tauri 安裝包或 browser-local-runtime 的本機 Node 啟動器，只要交付物包含「要在 Windows 執行的本機程式」，就持續遭遇代碼簽名障礙：

- 無簽名的 `.exe` / 啟動器觸發 Windows Defender SmartScreen 紅色警告，客戶不敢安裝
- 標準 OV 證書（$70-300/年）無法保證消除警告，需累積「信譽分數」
- EV 證書（$300-800/年）才能即時過關，但審核週期長（2-4 週）、需公司登記文件
- 同時 macOS 還要額外 Apple Developer（$99/年）

這個「簽名稅」已成為交付瓶頸，而且會**每年重複發生**。我們需要一條**連本機啟動器都不要**的交付通道：純瀏覽器 SPA，零本機 runtime，同時保持「資料存在用戶端」這個核心產品承諾。

### 與既有交付通道的關係（三通道並存，非互斥）

| 通道 | 對應能力 | 客群 | 簽名需求 |
|-----|---------|------|---------|
| 企業簽名版 | `windows-enterprise-managed-signing-delivery` | 企業受管端點 | 企業內 CA 簽署 |
| Node 本地版 | `browser-local-runtime`（現況、已上線） | 一般用戶、要本機資料 | 啟動器需簽名 |
| **純瀏覽器版** | **`aire-browser-local-first`（本 change）** | 自帶電腦、零安裝 | **無** |

本 change 是「再進一步」演進 `browser-local-runtime`：把仍跑在本機 Node 的 SQLite / 加密 / 檔案 / 外部 API 四項能力，分別搬到 wa-sqlite+OPFS / Web Crypto / OPFS / CF Worker gateway。

## What Changes

- **新增** `aire-browser-local-first` 能力規格：定義純瀏覽器版 AIRE 的架構、資料儲存、API 代理與授權模式。
- **修改** `cloudflare-worker/src/index.ts`：擴充 CF Worker 作為 API 閘道，代理地政系統、法條同步、執照驗證等所有外部 API。
- **新增** `src/lib/db/browser-sqlite.ts`：以 `wa-sqlite` + OPFS 取代現況的 `better-sqlite3`（Node 本地 SQLite），在瀏覽器內實現加密 SQLite。
- **新增** `src/lib/crypto/browser-vault.ts`：以 Web Crypto API（應用層 AES-GCM）取代現況 Node 端加密 + 本機金鑰，實現主密碼加密與金鑰儲存。
- **新增** 純瀏覽器版的靜態 export build profile，部署至 Cloudflare Pages。**不改動現有 `next.config.ts` 的 `standalone` 設定**（那是 browser-local-runtime 的生命線，改回 `export` 會破壞現有上線版本，見 `src-tauri/PARKED.md`）。
- **修改** 資料存取層：將殘留的 6 處 Tauri `invoke()` 與 browser-local-runtime 的本機 API 呼叫，改為瀏覽器 DB/OPFS 層或 `fetch()` 呼叫 CF Worker API。
- **新增** Device ID 瀏覽器指紋機制，取代硬體綁定。

## Non-Goals

- 本次不改變產品核心流程（地址查詢 → 案件建立 → PDF 產出）。
- 本次不實作多裝置同步或點對點備份（保留未來擴充空間，但不在 scope）。
- 本次不移除或棄用既有 `browser-local-runtime`（Node 本地版）程式碼，也不改動其 `standalone` config 與本機 server 路徑（多通道並行，純瀏覽器版為新增交付通道）。Tauri 維持 PARKED 狀態。
- 本次不處理離線法條排程同步（瀏覽器版首次上線時，法條同步改為手動觸發）。
- 本次不改變授權定價模式（仍為單機/單帳號授權）。

## Capabilities

### New Capabilities

- `aire-browser-local-first`: 定義瀏覽器版 AIRE 的架構、資料主權模型、API 代理閘道、與授權驗證機制。
- `browser-device-id`: 定義瀏覽器環境下的裝置識別與授權綁定策略。
- `cf-worker-api-gateway`: 定義 Cloudflare Worker 作為外部 API 代理閘道的路由、認證、與錯誤處理。

### Modified Capabilities

- `app-settings-and-license`: 調整授權驗證流程，支援瀏覽器版 Device ID 與 CF Worker 代理路徑。

## Impact

- Affected specs:
  - `aire-browser-local-first`
  - `browser-device-id`
  - `cf-worker-api-gateway`
  - `app-settings-and-license`（MODIFIED）
- Affected code:
  - `cloudflare-worker/src/index.ts`（擴充路由）
  - `cloudflare-worker/src/handlers/`（新增 handler）
  - `src/lib/db/`（新增瀏覽器 SQLite 層）
  - `src/lib/crypto/`（新增瀏覽器加密層）
  - `src/app/`（6 處殘留 Tauri IPC + 本機 API 呼叫 → DB/OPFS 層或 fetch）
  - 純瀏覽器版獨立 export build profile（**不改現有 `next.config.ts` 的 `standalone`**）
- Dependencies 新增:
  - `wa-sqlite`（瀏覽器 SQLite WASM）
  - `@sqlite.org/sqlite-wasm`（替代方案備用）
  - `idb-keyval`（IndexedDB 簡化操作）
- 環境變數新增:
  - `LAND_REGISTRY_CLIENT_ID`（CF Worker 環境變數）
  - `LAND_REGISTRY_CLIENT_SECRET`（CF Worker 環境變數）
  - `OPCOS_API_TOKEN`（CF Worker 環境變數）
