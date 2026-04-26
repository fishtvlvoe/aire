# ADR-001: SQLite 本地 vs Cloud API 資料切割

| 欄位 | 值 |
|------|-----|
| **決策日期** | 2026-04-18 |
| **狀態** | Accepted |
| **相關文件** | SPEC-001 (auth), SPEC-002 (audit-trail), container-deployment spec |
| **影響範圍** | 資料層架構、API 層邏輯、部署拓樸 |

## 背景

系統同時需要：
- **本地資料**：使用者操作（建立物件、編輯欄位、上傳檔案）→ 需離線可用、快速存取、完整審計
- **外部資料**：房市行情 (real-price)、地震風險 (earthquake)、過去成交紀錄 (transcript) → 第三方 API、無需本地持久化

兩類資料混存在 SQLite 會導致：
- 外部 API 故障時整個系統無法啟動
- 難以升級或切換外部資料來源
- 本地儲存無限膨脹（累積歷史查詢結果）
- 備份策略複雜（本地資料需版本控制，外部快取不需）

## 考慮選項

### 選項 A — 全部用 Cloud Database（PostgreSQL / Firebase）

**優點**：
- 統一架構，無同步邏輯
- 支援分散式讀寫
- 自動備份

**缺點**：
- 離線不可用（核心業務需求）
- 初期成本高（雲端資料庫每月 $50+）
- 網路延遲影響使用體驗
- 廠商鎖定（遷移成本高）

### 選項 B — SQLite 本地 + 遠端暫存快取（Redis / Memcached）

**優點**：
- 保留離線能力
- 快取加速外部查詢

**缺點**：
- 增加部署複雜度（需獨立快取服務）
- 快取同步邏輯易出 bug
- 容器部署時快取管理困難

### 選項 C — SQLite 本地（業務資料）+ Cloud API 客戶端（外部資料）✅ **選中**

**優點**：
- ✅ 離線可用：核心業務（物件、表單）不依賴網路
- ✅ 簡潔架構：無外部依賴（資料庫、快取），只需 HTTP 連線
- ✅ 快速迭代：可獨立升級外部 API 而不影響本地系統
- ✅ 成本控制：無月費；API 呼叫量低可用免費額度
- ✅ 容器化友善：SQLite embedded，`docker run` 立即可用

**缺點**：
- 需手動管理本地 ↔ 外部資料同步（可接受：查詢時同步，不違反 eventual consistency）
- 外部資料快取需手動管理（TTL 設定，過期清理）
- 無法跨地域複製（但當前只有單一部署點）

## 決策

**採用選項 C**：SQLite 本地儲存使用者操作資料（listing、form、audit），Cloud API 只讀外部資料。

### 實施細則

**本地 SQLite 儲存的表**：
- `listings` — 物件主檔案（建立、編輯、刪除流程）
- `field_visit_form` — 現場勘查表單資料
- `supplementary_form` — 補充資料表單
- `documents` — 生成的 PDF 引用及版本
- `users` — 業務人員帳號（登入驗證）
- `audit_logs` — 操作審計日誌
- `api_keys` — API 金鑰（內部服務用）
- `property_types` — 房型定義（快取）

**Cloud API 查詢的資料**（不持久化，按需查詢）：
- `real-price`: 歷史成交行情（`GET /api/price?address=...`）
- `earthquake`: 地震風險等級（`GET /api/earthquake?lat=...&lng=...`）
- `transcript`: 過去成交紀錄（`GET /api/transaction?property_id=...`）

**同步策略**：
- 使用者查詢外部資料時，系統發送 HTTP 請求到 Cloud API
- 短期快取結果在記憶體（TTL 5 分鐘），避免重複呼叫
- 若 Cloud API 無法連線，系統降級：顯示「網路連線中斷，部分資料可能已過期」提示，但不阻塞核心業務流程
- 定期（每天凌晨）清理快取過期資料

## 後果

### 正面影響

✅ **離線可用**：業務人員無網路時仍可填表、瀏覽歷史物件，待連線恢復後自動同步

✅ **快速啟動**：容器無需初始化外部服務，`docker run` 3 秒啟動

✅ **低成本**：無月費雲端服務；API 呼叫量 < 1000/月 可全免費

✅ **版本控制友善**：SQLite 檔案可備份到 git，開發環境無需遠端服務

### 負面影響 & 應對

❌ **資料同步邏輯需維護**
- 應對：封裝 `CloudApiClient` 層，統一處理快取 + 降級邏輯

❌ **多人環境下本地狀態可能不一致**（一人修改，另一人看不到）
- 應對：當前單機使用，後續若多人協作需升級至 Cloud Sync（例 Firebase Realtime）

❌ **審計日誌只在本機，跨裝置無法追蹤**
- 應對：定期上傳審計日誌到雲端（Log Shipping），但可延後實施

## 遷移計畫

1. **Phase 1（完成）**：建立本地 SQLite schema，實現 CRUD
2. **Phase 2（進行中）**：集成 Cloud API 查詢層 + 記憶體快取
3. **Phase 3（計畫）**：實現降級機制 + 離線模式指示
4. **Phase 4（未來）**：若需多裝置同步，評估升級方案

---

> retrofit 產生於 2026-04-27，來源：openspec/specs/container-deployment, llm-backend-adapter
