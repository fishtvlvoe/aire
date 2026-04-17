## Context

建安不動產目前使用 Next.js + better-sqlite3 的單機系統，透過 Codex CLI 呼叫 AI 產生文件。現有系統只支援 2 種物件類型（residential/farmland），但實際業務涉及 13 種類型，每種類型的現場勘查欄位與秘書後補欄位均不同。

客戶提供了完整的現場必問清單（12 種，DOCX）、秘書後補清單（12 種）、土地/建物物調表母版，作為欄位設計的依據。

系統部署方式：Docker 容器，掛載 Codex CLI（~/.superset/bin/codex）與認證資料（~/.codex），無需其他 API key。

## Goals / Non-Goals

**Goals:**

- 支援 13 種物件類型的欄位定義（第一版實作 6 種，其餘架構保留）
- 資料填寫頁採三層 Tab：共通欄位 / 類型專屬欄位 / 秘書後補欄位
- 新增「物件調查表」文件類型，整合所有資料輸出物件履歷
- 完整 5 頁 UI 流程（列表 → 新增選類型 → 填寫 → 產生中 → 文件輸出）
- 物件列表頁支援類型與狀態篩選

**Non-Goals:**

- 不動產說明書（成交後法律文件）不在此系統
- 可填寫式 PDF Form 不在此版本
- 第一版不實作：套房、店面、廠房、工業地、商業地、鄉村區建地、其他土地（架構預留）
- 多人權限管理（業務/秘書角色區分）不在此版本

## Decisions

### 物件類型 Schema 設計：三層欄位結構

採用三層欄位設計，避免為每種類型建立獨立資料表：

```
field_visit_data (JSON):
  common: {}          ← 所有類型共用
  building_common: {} ← 建物類共用（公寓/大樓/套房/透天/店面/廠房/農舍）
  land_common: {}     ← 土地類共用（農地/建地/商業地/工業地/鄉村/其他）
  type_specific: {}   ← 類型專屬欄位

supplementary_data (JSON):
  building: {}        ← 建物類共用後補
  land: {}            ← 土地類共用後補
  type_specific: {}   ← 類型專屬後補
```

**理由**：單一 JSON 欄位可彈性擴充，新增物件類型只需新增 type_specific schema，不需 DB migration。

### 物件類型 Enum 策略：字串 enum 取代數字 ID

DB 中 property_type 欄位使用字串 enum（如 `farmland`、`townhouse`），不用整數 ID。

**理由**：字串可讀性高，Codex prompt 直接使用，不需 ID→名稱對照表。

### 物件調查表：AI 整合輸出，非模板填充

物件調查表由 Codex CLI 根據填寫資料產生，格式為結構化 Markdown 再轉 PDF，而非固定 HTML 模板填充。

**理由**：每種物件類型的欄位組合差異大，固定模板維護成本高；AI 整合輸出可依類型自動調整呈現方式。

### UI 表單渲染：配置驅動（Config-driven）

13 種類型的表單欄位定義存放於 `src/lib/property-types/` 目錄下的 TypeScript 配置檔，前端根據選擇的類型動態渲染表單，不硬編碼。

**理由**：新增類型只需新增配置檔，不需修改 UI 元件。

### PDF 輸出：HTML → Puppeteer → PDF

物件調查表輸出流程：AI 產生 Markdown → 轉 HTML → Puppeteer 列印 PDF。

**理由**：現有系統已有 Puppeteer（Docker 已配置 Chromium），可重用；版型由 CSS 控制，一致性高。

### Implementation Distribution Strategy

| 代理 | 負責任務 |
|------|---------|
| Codex CLI | DB schema 更新、API routes、測試 |
| Copilot CLI | 物件類型配置檔、表單渲染邏輯、Codex prompt |
| Cursor | 5 頁 Next.js UI、表格元件、Tab 表單元件 |
| Kimi MCP | Code Review（3+ 檔案 diff） |

## Risks / Trade-offs

- **[Risk] JSON 欄位無型別安全** → Mitigation：用 Zod schema 在 API 層驗證，TypeScript 型別定義在 `property-types/` 配置
- **[Risk] Codex CLI 產生物件調查表耗時較長（6 種類型欄位多）** → Mitigation：進度頁顯示逐步完成狀態，非同步產生
- **[Risk] 第一版 6 種類型，UI 選類型頁需預留其餘 7 種「即將推出」狀態** → Mitigation：新增物件頁以 disabled 狀態顯示未實作類型，避免用戶混淆
