## Why

AIRE 已進入 Desktop-first 完整流程收斂期，但目前資訊分散在多個 SR、查詢紀錄 UI、OPCOS 授權討論、R02/COP 技術討論與實機驗收紀錄中。接手者很容易只看到其中一段，誤以為 SaaS、R02 Helper、COP API 或自動更新是同一個交付面。

需要一份圖表式 HTML 藍圖，把「本機開發 → Desktop App → macOS/Windows 驗收 → OO 授權串接 → 客戶 COP → 查詢紀錄 → 自動更新」整理成可直接打開、可交接、可討論的頁面。

## What Changes

- 新增一份離線可開啟的 HTML 系統藍圖，樣式參考 anismile 的 `dev-system-audit-2026-05-25.html`。
- 用指標卡、流程圖、泳道圖、表格與風險框呈現 AIRE 完整交付路線。
- 明確整理物件分類、案件流程、授權方式、OO 網站串接、本機資料責任、COP 憑證歸屬、驗收路線與自動更新順序。
- 更新 SR active index，讓接手者知道這份 HTML 是交接與對焦入口，不是產品功能實作。

## Non-Goals

- 不實作 R02、COP、授權、PDF、Tauri updater 或產品 UI 功能。
- 不把這份 HTML 當成客戶銷售頁。
- 不引入前端框架、CDN、build step 或外部圖表套件。
- 不改變 Desktop fullflow 或 auto-update SR 的任務順序。

## Capabilities

### New Capabilities

- `desktop-system-flow-blueprint-html`: AIRE 提供內部圖表式 HTML 藍圖，用於工程交接、CR 對焦與驗收路線確認。

### Modified Capabilities

- (none)

## Impact

- Affected specs: desktop-system-flow-blueprint-html
- Affected code:
  - New: docs/aire-desktop-system-blueprint-2026-05-25.html
  - Modified: openspec/SR-ACTIVE-INDEX.md
  - Removed: none
