## Context

本 change 是文件與交接頁，不是產品功能。它要降低新對話與工程接手時的認知負荷，避免再次把 SaaS 頁、R02 Helper、COP API、Desktop App、OO 授權與自動更新混成同一件事。

參考樣式來源是 `/Users/fishtv/Development/products/anismile/docs/dev-system-audit-2026-05-25.html`，採用深色 audit 報告、metric cards、tag、table、flow-diagram、success/warn/critical/insight box。

## Goals / Non-Goals

### Goals

- 產出一個可直接打開的 HTML 檔案。
- 以圖表優先方式整理 AIRE 桌面完整版路線。
- 涵蓋物件、流程、授權方式、OO 串接、驗收與自動更新。
- 同時服務 Fish 對焦與工程接手。

### Non-Goals

- 不做產品頁面。
- 不新增 runtime dependency。
- 不要求 dev server。
- 不取代正式 SR；只作跨 SR 的視覺索引。

## Decisions

### Decision 1: Use a standalone HTML report

HTML SHALL be a standalone document under `docs/`, with inline CSS and no external assets. This keeps it easy to open, share, and archive.

### Decision 2: Match the audit-report visual language

The page SHALL reuse the dark audit-report pattern from anismile: top title, subtitle, table of contents, metric cards, flow diagrams, tables, and colored callout boxes.

### Decision 3: Separate customer language and engineering language

The blueprint MAY mention R02, COP, JSON, cache, ledger and Tauri updater because it is internal. However, it SHALL explicitly show that those words are not customer-facing workflow language.

### Decision 4: Document sequence, not implementation

The page SHALL show that Desktop fullflow and macOS/Windows validation come before auto-update work. It SHALL not instruct implementers to build updater before the full desktop app is accepted.

## Acceptance Notes

- The HTML must be readable in desktop and mobile widths.
- The page must include visible sections for object classification, flow, authorization, OO integration, validation, update and risk handling.
- The page must be usable without network access.
