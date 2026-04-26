# three-ai — 文件治理中樞

> 本檔定義專案文件的分層、命名規範及同步觸發條件。GenAI 代理在執行任何文件工作前須完整閱讀本檔。
>
> 參考：`AGENTS.md` 為程式碼導航；本檔為文件導航及版本治理。

## SDD 文件分類

| 類型 | 目錄 | 命名格式 | 觸發條件 |
|------|------|--------|--------|
| **SA** (系統分析) | `docs/analysis/` | `SA-{3位數}_{描述}.md` | 里程碑 / 重大架構異動 |
| **ADR** (架構決策) | `docs/adr/` | `ADR-{3位數}_{描述}.md` | 跨域二選一技術決策 |
| **SPEC** (介面合約) | `docs/specs/` | `SPEC-{3位數}_{描述}.md` | **API 新增或行為異動（強制）** |
| **INFRA** (基礎設施) | `docs/infra/` | `INFRA-{3位數}_{描述}.md` | 部署拓樸 / CI 異動 |

**命名正規式**：`^(SA|ADR|SPEC|INFRA)-\d{3}_[a-z0-9-]+\.md$`

## 真理來源

**SPEC 是開發的主要參考**。每次介面或行為異動都須直接更新 SPEC 內容及 Changelog。

**最低維護規則**：任何涉及介面或行為異動的 PR 都須同時更新對應 SPEC 的內容及版本記錄。

## ADR 觸發條件

✅ **需要 ADR**：
- 架構分層策略（例：SQLite local vs Cloud API 切割）
- 認證方案設計（例：JWT dual-token）
- 二選一技術決策（例：Kafka vs Event Hubs）
- 跨域共用元件設計決策

❌ **不需要 ADR**：
- 新增 CRUD API（見 SPEC）
- 改 cache TTL 預設值
- 簡單 bug fix

## 候選文件（延遲評估）

下列文件按觸發條件建立（**不預先建空殼**）：

| 文件 | 觸發條件 |
|------|--------|
| `SA-001_system-architecture.md` | 完成首次整體架構快照 |
| `SPEC-001_auth-identity.md` | 實作使用者身份驗證及 RBAC |
| `SPEC-002_audit-trail.md` | 實作操作日誌及硬刪除防護 |
| `SPEC-003_api-security.md` | 實作 API key / rate limit / input validation |
| `SPEC-004_notification-system.md` | 實作非同步任務隊列及狀態通知 |
| `SPEC-005_data-portability.md` | 實作 CSV export / import / listing 遷移 |
| `SPEC-006_property-registry.md` | 新增房型或大幅欄位異動 |
| `ADR-001_sqlite-cloud-split.md` | 文件庫分割決策確定後 |
| `ADR-002_llm-backend-pluggability.md` | LLM 多後端支援決策 |
| `ADR-003_docker-optimization.md` | Docker image 優化策略確定後 |
| `INFRA-001_deployment-pipeline.md` | CI/CD 流程異動 |

## 文件索引

| 文件 | 路徑 | 狀態 |
|------|------|------|
| **SPEC-001: 身份驗證與 RBAC** | `docs/specs/SPEC-001_auth-identity.md` | 待補 |
| **SPEC-002: 操作日誌** | `docs/specs/SPEC-002_audit-trail.md` | 待補 |
| **SPEC-003: API 安全** | `docs/specs/SPEC-003_api-security.md` | 待補 |
| **SPEC-004: 通知系統** | `docs/specs/SPEC-004_notification-system.md` | 待補 |
| **SPEC-005: 資料可移植性** | `docs/specs/SPEC-005_data-portability.md` | 待補 |
| **ADR-001: SQLite vs Cloud 切割** | `docs/adr/ADR-001_sqlite-cloud-split.md` | 待補 |
| **ADR-002: LLM 後端切換** | `docs/adr/ADR-002_llm-backend-pluggability.md` | 待補 |
| **ADR-003: Docker 優化** | `docs/adr/ADR-003_docker-optimization.md` | 待補 |
| **已完成 Spec 清單** | `openspec/specs/` | ✅ 16 個 |

## Intent-Driven 導航

### 我想了解系統整體架構

→ 見 `docs/analysis/SA-001_system-architecture.md`（待補）

目前參考：
- `AGENTS.md` 「域→程式碼對應表」
- `openspec/specs/` 各 spec 之間的 `@trace` 關聯

### 我想新增房型或修改欄位

1. 讀 `docs/specs/SPEC-006_property-registry.md`（待補）
2. 修改 `src/lib/property-types/schemas/{type}.ts`
3. 執行 `npm run test` 驗證
4. 若涉及新欄位，同時更新 `docs/specs/SPEC-001_auth-identity.md` 的權限範圍

### 我想開始實作新功能

1. 執行 `/spectra-propose <change-name>` 建立 proposal
2. 確認對應的 SPEC 已存在於 `docs/specs/` 或 `openspec/specs/`
3. 執行 `/spectra-apply` 開始工作
4. 完成後執行 `/spectra-archive` 結檔

### 我想查看 API 合約

→ 見 `docs/specs/SPEC-*.md` 或 `openspec/specs/<domain>/spec.md`

例：
- 文件生成 API → `openspec/specs/document-generation/spec.md`
- OCR 解析規則 → `openspec/specs/pre-listing-data-collection/spec.md`

### 我想查看架構決策的理由

→ 見 `docs/adr/ADR-*.md`

例：
- 為何用 SQLite 而非雲端資料庫？→ ADR-001
- 為何支援多個 LLM 後端？→ ADR-002
- 為何用 Docker multi-stage？→ ADR-003

### 我想部署到生產環境

1. 讀 `docs/infra/INFRA-001_deployment-pipeline.md`（待補）或 `docker/` 目錄
2. 確認 `docker build -t jianan-ai:latest .` 成功
3. 檢查 `docker-compose.yaml` 環境變數
4. 執行 `docker compose up -d`
5. 驗證 `http://localhost:3000` 可存取

### 我想了解 LLM 後端切換機制

1. 讀 `docs/adr/ADR-002_llm-backend-pluggability.md`
2. 參考 `src/lib/codex-client/adapters/` 各後端實作
3. 設定環境變數：`LLM_BACKEND=claude-code|gemini|ollama|codex`
4. 見 `openspec/specs/llm-backend-adapter/spec.md` 接口合約

### 我想報告或排除效能瓶頸

1. 檢查 PDF 構建時間：`src/lib/document-generator/` 的 puppeteer 操作
2. 檢查 LLM 推論時間：`src/lib/codex-client/` 的呼叫延遲
3. 檢查資料庫查詢：`src/lib/db/` 的 SQL 邏輯
4. 若瓶頸影響多個模組，建立新 ADR；若局限單一功能，更新該功能的 SPEC

## 文件同步觸發

| 事件 | 更新對象 | 誰負責 |
|------|--------|-------|
| **API 端點新增 / 修改** | `docs/specs/SPEC-*.md` + `Changelog` | PR author |
| **跨域架構決策** | 新增 `docs/adr/ADR-*.md` | tech lead |
| **房型邏輯變更** | `docs/specs/SPEC-006_property-registry.md` | PR author |
| **LLM 後端新增** | `docs/adr/ADR-002_llm-backend-pluggability.md` | tech lead |
| **部署流程異動** | `docs/infra/INFRA-001_deployment-pipeline.md` | DevOps |
| **重大里程碑** | 新增 `docs/analysis/SA-*.md` 快照 | tech lead |

---

> retrofit 產生於 2026-04-27，來源：openspec/specs/, openspec/changes/, ZeroSpec 模板
