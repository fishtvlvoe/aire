<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# AGENTS.md — three-ai 智慧房仲平臺導航手冊

> 本檔是 GenAI 代理理解 three-ai 專案的入口。執行任何程式碼工作前請完整閱讀本檔。

## 專案概要

**一句話目的**：不動產媒合平臺搭配智慧文件生成系統，助房仲業務透過上傳謄本／權狀秒速生成合規的房產說明書及法律交易文件，加速 30–40 分鐘的資料手抄流程。

**核心價值**：
- **文件自動化**：上傳 PDF 謄本 → OCR + LLM 解析 → 自動帶入欄位 → 一鍵生成 5 份正式文件
- **多房型支援**：7 種房產類型（大樓華廈、透天厝、套房、農舍、廠房、商業地、店面）
- **LLM 靈活切換**：Codex / Claude Code / Gemini / Ollama（Adapter Pattern 支援）
- **輕量部署**：Docker multi-stage 優化至 500MB，可本機開發或雲端佈署

## 技術棧速查

| 層級 | 技術 | 版本 |
|------|------|------|
| **前端框架** | Next.js + React | 16.2.4 / 19.2.4 |
| **語言** | TypeScript | 5.x |
| **UI 框架** | Tailwind CSS | 4.x |
| **資料庫** | SQLite (better-sqlite3) | 12.9.0 |
| **文件生成** | Puppeteer + pdf-parse + marked | latest |
| **LLM 後端** | Codex CLI / Claude Code / Gemini / Ollama | - |
| **測試** | Playwright + Vitest | 1.59.1 / 2.1.9 |
| **包管理** | npm | - |

**版本基準**（2026-04-27）：
- Next.js 16.2.4 — `package.json` 核定
- Node.js 18+ — 隱含

## 域→程式碼對應表

| 域 | 職責 | 相關 SPEC | 路徑 |
|---|---|---|---|
| **listing** | 物件主檔案、工作流程、欄位驗證 | listing-workflow, listing-ui-flow, field-visit-form, property-dossier | `src/app/listings/`, `src/lib/listings/` |
| **documents** | PDF 生成、範本管理、文件版本控制 | document-generation, disclosure-document-generation, five-documents-generator, post-listing-marketing | `src/lib/document-generator/`, `src/app/api/listings/[id]/documents/` |
| **data-collection** | 欄位定義、補充資料蒐集、OCR 結果驗證 | pre-listing-data-collection, supplementary-form, field-visit-form | `src/lib/schemas/`, `src/lib/property-types/` |
| **property** | 房型註冊、市場資料查詢、佣金計算 | property-type-registry, pre-commission-lookup | `src/lib/property-types/`, `src/app/api/pre-commission/` |
| **llm-infra** | LLM 後端切換、prompt 管理、API 呼叫層 | llm-backend-adapter, container-deployment | `src/lib/codex-client/`, `docker/` |

## 快速硬規則

1. **Never hard-delete listing without audit trail** — 所有刪除必須寫入 audit log，不可直接清除
2. **Never modify document template without version control** — 文件範本修改須記版本，確保歷史追蹤
3. **Never run LLM inference on untrusted PDF input** — PDF 來源必須經過驗證，不可直接送給 LLM
4. **Never deploy without Docker build test** — 每次部署前必須成功跑過 `docker build` 測試
5. **Never expose API keys in environment logs** — LLM API key 禁止印出到日誌

## SPEC 目錄（完成 16 個）

### Core Listing & Workflow
- **listing-workflow** — 物件 3 階段工作流程（新建→現勘→完成）
- **listing-ui-flow** — 前端表單導航、頁面流轉邏輯
- **field-visit-form** — 現場勘查表單定義及提交規則
- **property-dossier** — 物件檔案單頁展示

### Document Generation
- **document-generation** — 五份正式文件生成流程及 API 合約
- **disclosure-document-generation** — 不動產說明書特定邏輯
- **five-documents-generator** — 5 個文件範本管理
- **post-listing-marketing** — 物件上市後行銷文案自動生成

### Data Collection & Property
- **pre-listing-data-collection** — 初始欄位蒐集、OCR 結果驗證
- **supplementary-form** — 補充資料（管理費、銀行估價等）表單
- **property-type-registry** — 房型列表、欄位動態調整、驗證規則
- **pre-commission-lookup** — 佣金查詢 API（連外部雲端 API）

### LLM & Infrastructure
- **llm-backend-adapter** — LLM 後端切換機制（env-driven selector）
- **container-deployment** — Docker 多階段構建、優化配置

## 開發慣例

### 提 PR 格式
- **Title**：`[domain] action: brief description`
  - 例：`[documents] feat: add page number to disclosure PDF`
  - 例：`[llm-infra] fix: handle gemini rate limit gracefully`
- **Description**：包含以下內容
  - 變更原因（為什麼）
  - 相關 SPEC（若有更新）
  - 測試驗證方式（`npm run test` 結果）
  - 若涉及 docker，需附 `docker build` 成功截圖

### Commit 規範
- 遵守 Conventional Commits（`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`）
- 中文訊息（message）；英文 scope
- 每個 commit 須通過 `npm run lint` + `npm run test`

### 測試要求
- 新邏輯（> 10 行）必須附單元測試
- 文件生成邏輯必須 Playwright E2E 驗證（截圖驗證 PDF 內容）
- OCR / LLM 相關需附 fixture（真實或 mock PDF）
- 目標覆蓋率 > 70%（執行 `npm run test -- --coverage`）

## 程式碼生成規則

### 資料層
- **Database Access**：只用 better-sqlite3，禁止直接 SQL 拼接；使用參數化查詢
- **Schema Migration**：建新表用 `CREATE TABLE IF NOT EXISTS`；擴展用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- **Audit Logging**：每個 INSERT/UPDATE/DELETE 都須寫入 `audit_logs` 表

### API & 路由
- **錯誤回應**：統一 format `{ error: string, code?: string, details?: any }`
- **Rate Limiting**：Cloud API 呼叫須包裹在 rate limiter 中（待 SPEC-003）
- **輸入驗證**：所有 request body 必須經過 schema validation（Zod）

### LLM 呼叫
- **Prompt 版本化**：放在 `src/lib/codex-client/prompts/` 目錄，用版本號管理
- **Context 大小**：PDF OCR 結果 + listing 資料不可超過 LLM token limit，超過需分批
- **Timeout**：LLM 呼叫 timeout 設定 60s；超過返回 504

### 前端 / UI
- **表單狀態**：用 React state 管理，禁止 URL query 存複雜物件
- **自動帶入標記**：綠色 badge「📄 已從 XX 帶入」；手改後「✏️ 已修改」灰色
- **錯誤訊息**：用 toast 通知，避免 alert()

## 常用指令

```bash
# 開發
npm run dev          # 本機開發 (http://localhost:3000)

# 構建 & 測試
npm run build        # 生產構建
npm run lint         # ESLint 檢查
npm run test         # 跑 Vitest 單元測試
npm run cleanup:drafts  # 清理空的草稿物件

# Docker（部署）
docker build -t jianan-ai:latest .
docker compose up -d

# 工作流（Spectra）
# 提案新功能
npx spectra propose <change-name>
# 查詢 spec
npx spectra ask "What is the document generation flow?"
# 結檔
npx spectra archive <change-name>
```

## GenAI 文件導航

| 我想... | 參考資源 |
|--------|--------|
| **了解系統整體架構** | `docs/analysis/` (待補 SA-001) |
| **查詢 API 合約** | `openspec/specs/<domain>/spec.md` 或 `docs/specs/SPEC-*.md` |
| **新增房型或欄位** | 更新 `docs/specs/SPEC-006-property-registry.md`；修改 `src/lib/property-types/` |
| **開始實作新功能** | 執行 `/spectra-propose`；確認 `docs/specs/` 有對應 SPEC |
| **查看架構決策理由** | `docs/adr/ADR-*.md`（如 ADR-002 LLM 切換機制） |
| **部署到生產環境** | `docker/` 目錄 + `docker-compose.yaml`；見 `container-deployment` SPEC |
| **理解 LLM 後端切換** | `docs/adr/ADR-002-llm-backend-pluggability.md` + `src/lib/codex-client/adapters/` |
| **調查效能瓶頸** | 檢查 `src/lib/document-generator/` 的 PDF 構建時間；LLM 推論時間 via `codex-client` metrics |

## 活躍改動狀態

| Change 名稱 | 狀態 | 預期完成 | 影響域 |
|-----------|------|--------|-------|
| **upload-first-autofill** | 🔧 In Progress | 2026-04-28 | listing, data-collection |

## 相關專案

- **[1-設計哲學](../../1-設計哲學/)** — Fish 的創業決策模型 & 第一性原理
- **[stitch_ai](../../../stitch_ai/)** — 舊版本（已廢棄，參考用）

## 文件維護提醒

**同步觸發**：
- ✅ API 端點新增 / 修改 → 更新 `docs/specs/SPEC-*.md`
- ✅ 跨域架構決策 → 新增 `docs/adr/ADR-*.md`
- ✅ 房型邏輯變更 → 更新 `docs/specs/SPEC-006-property-registry.md`
- ✅ LLM 後端新增 → 更新 `docs/adr/ADR-002-llm-backend-pluggability.md`

**Governance Rules**：見 `docs/README.md`

---

> retrofit 產生於 2026-04-27，來源：CLAUDE.md, package.json, openspec/specs/, openspec/changes/
