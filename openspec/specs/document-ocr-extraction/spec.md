# document-ocr-extraction Specification

## Purpose

TBD - created by archiving change 'upload-first-autofill'. Update Purpose after archive.

## Requirements

### Requirement: Three-layer OCR pipeline

系統 SHALL 對上傳的 PDF / 圖片執行三層 OCR pipeline，平衡精度與成本：

- **Layer 1 (PDF 文字層)**：對有文字層的 PDF 直接抽文字（pdfjs-dist），規則 parser 抽欄位
- **Layer 2 (本地 OCR)**：對影像 PDF / jpg / png 跑 PaddleOCR（首選）或 Tesseract.js（fallback）
- **Layer 3 (LLM Vision)**：Layer 1+2 信心度低時，透過 LLM_BACKEND 補強（業務 opt-in，需設定 API key）

每層執行後，系統 SHALL 評估信心度；達標即停，不繼續往下層。

#### Scenario: 電子檔謄本 PDF 走 Layer 1

- **WHEN** 業務上傳由地政事務所核發的電子檔謄本 PDF
- **THEN** 系統 SHALL 用 pdfjs-dist 抽取文字層
- **AND** 規則 parser SHALL 抽出欄位（地號、面積、所有權人、公告土地現值、建物門牌、總面積、主要建材、建築完成日期、權利範圍...）依 design.md D8 欄位清單與 `sample-inventory.md` 對照表
- **AND** 信心度 ≥ 0.95 → 不啟動 Layer 2/3

#### Scenario: 影像 PDF 或權狀照片走 Layer 2

- **WHEN** 業務上傳手機拍攝的權狀照片，或影像版謄本（無文字層）
- **THEN** Layer 1 抽出空文字 → 觸發 Layer 2 OCR（PaddleOCR / Tesseract.js）
- **AND** 信心度 ≥ 0.80 → 完成
- **AND** 信心度 < 0.80 且業務有 Layer 3 opt-in → 走 Layer 3

#### Scenario: LLM Vision 補強時業務 opt-in

- **WHEN** Layer 1+2 失敗且業務未設定 LLM_BACKEND vision API key
- **THEN** 系統 SHALL 標記為「無法解析，請手動輸入」
- **AND** SHALL NOT 自動發送資料到外部 API（保護客戶隱私）

#### Scenario: LLM Vision 啟用時業務見明確同意提示

- **WHEN** 業務首次啟用 LLM Vision Layer 3
- **THEN** UI SHALL 顯示「將傳送您的文件影像至 {provider} 解析」確認對話框
- **AND** 業務確認後才觸發 API call


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Extracted result schema

OCR 抽取結果 SHALL 儲存於 `listings.extracted_data` 欄位，採用統一 JSON schema：

```json
{
  "by_attachment": {
    "<attachmentId>": {
      "filename": "...",
      "category": "transcript|land-title|contract|cadastral-map|other",
      "extracted_at": "<ISO timestamp>",
      "ocr_layer": "1|2|3",
      "fields": {
        "<fieldKey>": { "value": "...", "confidence": 0.0-1.0 }
      },
      "raw_text": "<截斷至 5000 字元的 OCR 原文>"
    }
  },
  "merged_fields": {
    "<fieldKey>": { "value": "...", "from": "<attachmentId>", "confidence": 0.0-1.0 }
  }
}
```

#### Scenario: 多份同類文件 conflict 解決

- **WHEN** 業務上傳 2 份謄本，皆抽出 `address` 欄位
- **THEN** `merged_fields.address` SHALL 取信心度較高那份
- **AND** 信心度相同時取較新上傳那份
- **AND** UI 顯示「另有 1 份來源（{舊 attachment 檔名}）的值為 X，是否切換」下拉

#### Scenario: 業務手動覆蓋自動帶入

- **WHEN** 自動帶入後業務手動修改該欄位
- **THEN** `field_visit_data.<key>` SHALL 更新為業務值（以業務為準，詳見 `auto-fill-fields` 之 User edit wins on conflict requirement）
- **AND** `merged_fields.<key>` SHALL 保留原始 OCR 值作為 raw cache（v1 UI 不提供回溯）
- **AND** UI 徽章 SHALL 從「📄 已從文件帶入」改為「✏️ 已修改」（橘色）


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Partial extraction does not block flow

OCR pipeline 對任一文件執行 SHALL 容許部分欄位失敗。即使有欄位未抽出（例如 pdfjs 無法解析某 section、regex 未命中特定格式變異），系統 SHALL 寫入已成功抽取的欄位到 `extracted_data.by_attachment`，並 SHALL NOT 阻擋業務進入下一章節。未抽到的欄位 SHALL 留空，由業務手填補足。

#### Scenario: 部分欄位成功部分失敗

- **WHEN** pdfjs 成功抽出 50 個欄位，有 10 個欄位規則 parser 未命中
- **THEN** `extracted_data.by_attachment.<id>.fields` SHALL 寫入 50 個成功欄位
- **AND** 未命中的 10 個欄位 SHALL NOT 出現在 `fields` 內（視為「無此資料」）
- **AND** `merged_fields` SHALL 合併可用欄位
- **AND** UI SHALL NOT 顯示錯誤 toast；業務 SHALL 可繼續後續章節作業

#### Scenario: 業務在部分帶入下完成物件建立

- **WHEN** OCR 只抽到 60% 欄位（例如：成功抽地號、面積，未抽到公告土地現值）
- **THEN** 成功欄位 SHALL 顯示綠色徽章「📄 已從...帶入」
- **AND** 未抽到欄位 SHALL 顯示無徽章（視覺等同 manual 手填）
- **AND** 業務 SHALL 可儲存物件並產出 PDF（不強制所有欄位有值）


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Multi-section PDF splitting

單一 PDF 檔案 SHALL 支援同時包含多個 section 的切分與分別解析。謄本常見結構包括「土地標示部 / 土地所有權部 / 土地他項權利部 / 建物標示部 / 建物所有權部 / 建物他項權利部」六種 section，系統 SHALL 用 section header（例：`*************** 土地標示部 ****************`）偵測邊界，切分後分別送至對應 parser（land-parser / building-parser），最終合併為單一 `ExtractedFields` 物件。

依 `sample-inventory.md` 26 份黃金樣本分析，切分策略必須能處理「純土地」「純建物」「土地+建物混合」「含他項權利」四種組合。

#### Scenario: 單 PDF 含土地 + 建物兩個 section

- **WHEN** 業務上傳一份 PDF，內含 page 1 = 土地謄本、page 2 = 建物謄本
- **THEN** 系統 SHALL 以 section header 切出兩個 section
- **AND** section「土地標示部」+「土地所有權部」SHALL 送入 land-parser
- **AND** section「建物標示部」+「建物所有權部」SHALL 送入 building-parser
- **AND** 兩 parser 輸出 SHALL 合併為單一 `ExtractedFields`，寫入 `extracted_data.by_attachment.<id>.fields`
- **AND** UI SHALL 同時帶入「基本資料」章節的地號欄位與「建物資料」章節的建號欄位

#### Scenario: 單 PDF 僅含土地 section

- **WHEN** 業務上傳純土地謄本 PDF
- **THEN** section splitter SHALL 偵測到「土地標示部」「土地所有權部」（可能含「土地他項權利部」）
- **AND** 僅呼叫 land-parser
- **AND** 建物相關欄位 SHALL 留空（無徽章）

##### Example: 下營區十六甲段 2195 號土地謄本

- **GIVEN** 上傳檔 `台南市下營區十六甲段2195-0000_20260202.pdf`
- **WHEN** pdfjs 抽取文字層後送入 section-splitter
- **THEN** splitter output SHALL 為 `[{ name: "土地標示部" }, { name: "土地所有權部" }]`（2 個 section）
- **AND** land-parser 輸出 SHALL 含 `地號 = "臺南市下營區十六甲段2195-0000地號"`、`面積 = 1271.00`、`使用分區 = "特定農業區"`、`使用地類別 = "農牧用地"`、`公告土地現值 = 1100`、`所有權人 = "顏＊＊"`、`權利範圍 = "1/1"`
- **AND** building-parser SHALL NOT 被呼叫
- **AND** 建物章節欄位（建號、建物門牌、總面積）SHALL 為 undefined 且 UI 無徽章

#### Scenario: 含他項權利 section

- **WHEN** 業務上傳含抵押權設定的謄本 PDF
- **THEN** section splitter SHALL 偵測到「土地他項權利部」或「建物他項權利部」
- **AND** 對應 parser SHALL 抽出抵押權人、擔保金額、登記日期等欄位
- **AND** 欄位 SHALL 帶入「法律資料」章節

##### Example: 中西區星鑽段 0420 號含抵押權謄本

- **GIVEN** 上傳檔 `台南市中西區星鑽段0420-0000_20260206.pdf`，含土地標示部 + 土地所有權部 + 土地他項權利部 + 建物標示部 + 建物所有權部 + 建物他項權利部共 6 個 section
- **WHEN** section-splitter + mixed-parser 處理完成
- **THEN** `extracted_data.fields.encumbrances` SHALL 為 list，含 `{ 權利種類: "抵押權", 權利人: "第一商業銀行股份有限公司", 權利人統編: "05052322", 登記日期: "2001-07-13", 字號: "台南土字第131510號" }`
- **AND** 該欄位 SHALL 帶入「法律資料」章節，徽章顯示綠色「📄 已從文件帶入」
- **AND** 共同擔保地號 SHALL 為 `[{ 地段: "星鑽段", 地號: "0420-0000" }]`、共同擔保建號 SHALL 為 `[{ 地段: "星鑽段", 建號: "00660-000" }]`


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: extract API endpoint

系統 SHALL 提供 `POST /api/listings/{id}/extract` endpoint 觸發指定 attachment 或所有未解析 attachment 的 OCR。同步模式回 200 + extract 結果；非同步模式（attachments POST 背景觸發）回 202 Accepted。錯誤回應遵循「Standard error response contract」。

#### Scenario: 觸發單一 attachment 解析

- **WHEN** 客戶端 POST `/api/listings/36/extract?attachmentId=att_abc`
- **THEN** server SHALL 載入該 attachment 檔案、執行 OCR pipeline、寫入 `extracted_data.by_attachment.att_abc`
- **AND** 重新計算 `merged_fields`
- **AND** 回應 HTTP 200 `{ extracted: { fields, confidence }, merged_fields }`

#### Scenario: 觸發所有未解析 attachment 解析

- **WHEN** 客戶端 POST `/api/listings/36/extract`（無 query）
- **THEN** server SHALL 對所有未在 `extracted_data.by_attachment` 中的 attachment 執行 OCR
- **AND** 回應 HTTP 200 含總數量與解析結果

#### Scenario: Attachment 不存在

- **WHEN** 客戶端 POST `/api/listings/36/extract?attachmentId=att_missing`
- **THEN** server SHALL 回 HTTP 404 `{ error: "attachment not found", code: "ATTACHMENT_NOT_FOUND", detail: { attachmentId: "att_missing" } }`


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Extract status polling endpoint

系統 SHALL 提供 `GET /api/listings/{id}/extract-status` endpoint，供前端 polling 每個 attachment 的 OCR 執行狀態。前端用此端點驅動「⏳ 解析中...」黃色徽章的出現與消失，以及 extract 完成時的 toast 通知。

Response payload 格式：

```json
{
  "by_attachment": {
    "<attId>": {
      "status": "pending" | "parsing" | "done" | "failed",
      "started_at": "<ISO timestamp, optional>",
      "completed_at": "<ISO timestamp, if done/failed>",
      "error": "<string, if failed>"
    }
  }
}
```

#### Scenario: 前端 polling 解析進度

- **WHEN** 業務上傳謄本後，前端每 2 秒 GET `/api/listings/36/extract-status`
- **AND** attachment `att_abc` 正在執行 OCR pipeline
- **THEN** server SHALL 回 HTTP 200 `{ by_attachment: { att_abc: { status: "parsing", started_at: "..." } } }`
- **AND** OCR 完成後下次 polling SHALL 回 `status: "done"` 與 `completed_at`

#### Scenario: Attachment OCR 失敗

- **WHEN** attachment 的 OCR pipeline 三層皆失敗（或 Layer 3 未 opt-in）
- **THEN** extract-status 回 `{ by_attachment: { <attId>: { status: "failed", error: "all OCR layers failed" } } }`
- **AND** 前端 UI 徽章 SHALL 從黃色「⏳ 解析中」改為「⚠ 無法解析，請手動輸入」
- **AND** 業務 SHALL 可繼續手填（flow 不阻擋）


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Listing GET returns extracted_data

`GET /api/listings/{id}` response payload SHALL 包含完整 `listing.extracted_data` 欄位（若 non-null）。前端 FieldVisitForm 從 `listing.extracted_data.merged_fields` 取 OCR 欄位值與 provenance 作為 `initialData` 的補強來源（與 `field_visit_data` 合併，業務手填優先）。

#### Scenario: 載入含 extracted_data 的 listing

- **WHEN** 客戶端 GET `/api/listings/36`
- **AND** listing 36 已完成一份謄本 OCR，`extracted_data.merged_fields.address = { value: "臺南市下營區十六甲段2195-0000地號", from: "att_abc", confidence: 0.97 }`
- **THEN** response SHALL 含 `listing.extracted_data.merged_fields.address`
- **AND** 前端 FieldVisitForm 傳入 `initialData` 時 SHALL 合併 `field_visit_data`（高優先）與 `extracted_data.merged_fields`（低優先）

#### Scenario: 既有 listing 無 extracted_data

- **WHEN** 客戶端 GET `/api/listings/12`（建立於本 change 上線前）
- **THEN** response 中 `listing.extracted_data` SHALL 為 null
- **AND** 前端 SHALL 僅使用 `field_visit_data` 作為 initialData（不顯示任何 OCR 徽章）


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Delete attachment cascades to extracted_data

`DELETE /api/listings/{id}/attachments?attachmentId={attId}` 端點 SHALL 在刪除 attachment 檔案的同時 cascade 清除 `extracted_data.by_attachment.<attId>` entry，並**重新計算** `merged_fields`（保留其他來源提供的欄位值）。

#### Scenario: 刪除唯一提供某欄位的 attachment

- **WHEN** listing 36 僅有 1 份謄本 att_abc，提供 `merged_fields.address`
- **AND** 客戶端 DELETE `/api/listings/36/attachments?attachmentId=att_abc`
- **THEN** server SHALL 從 `extracted_data.by_attachment` 移除 att_abc
- **AND** `merged_fields.address` SHALL 被移除（無其他來源）
- **AND** 前端 UI 再載入時 address 欄位 SHALL 回到空值（若 `field_visit_data.address` 也空）

#### Scenario: 刪除其中一份、多來源保留

- **WHEN** listing 36 有兩份謄本 att_a (conf 0.95) + att_b (conf 0.97) 皆提供 `address`
- **AND** merged_fields.address 目前取 att_b
- **AND** 客戶端 DELETE att_b
- **THEN** server SHALL 從 `by_attachment` 移除 att_b
- **AND** `merged_fields.address` SHALL 重新計算取 att_a（次高信心度）


<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->

---
### Requirement: Standard error response contract

所有本 change 新增與修改的 API endpoint SHALL 採用統一 error payload 格式與 HTTP status code 對應表。

```json
{
  "error": "human-readable message",
  "code": "UPPERCASE_SNAKE_CASE",
  "detail": { /* optional */ }
}
```

HTTP status code：200 (OK) / 202 (Accepted, async) / 400 (invalid request) / 404 (not found) / 409 (conflict) / 500 (internal)。

#### Scenario: Invalid request body

- **WHEN** 客戶端 POST `/api/listings/36/extract` 帶 body 但 JSON 格式錯誤
- **THEN** server SHALL 回 HTTP 400 `{ error: "invalid json", code: "INVALID_JSON" }`

#### Scenario: Internal OCR failure

- **WHEN** OCR pipeline 所有層都擲出 unhandled exception（例如 pdfjs crash）
- **THEN** server SHALL 回 HTTP 500 `{ error: "ocr pipeline failed", code: "OCR_PIPELINE_ERROR", detail: { layer: "1", message: "pdfjs error: ..." } }`
- **AND** attachment 的 extract-status SHALL 標記為 `failed`

<!-- @trace
source: upload-first-autofill
updated: 2026-05-03
code:
  - scripts/verify-disclosure-pdf.ts
  - package.json
  - src/lib/ocr/pdf-text-layer.ts
  - src/app/api/listings/[id]/field-visit/route.ts
  - src/lib/pdf-generator/survey-sales.ts
  - .opencode/skills/spectra-discuss/SKILL.md
  - AGENTS.md.before-zerospec-20260427
  - AIRE-ui-test.js
  - src/lib/db/schema.ts
  - src/app/layout.tsx
  - src/lib/codex-client/types.ts
  - .env.example
  - .opencode/commands/spectra-ingest.md
  - .cursorrules
  - .github/prompts/spectra-commit.prompt.md
  - docs/README.md
  - src/lib/ocr/field-mapping.ts
  - .github/skills/spectra-discuss/SKILL.md
  - src/lib/ocr/index.ts
  - src/app/api/listings/[id]/extract/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - next.config.ts
  - .opencode/commands/spectra-audit.md
  - src/lib/codex-client/adapters/claude-code.ts
  - CLAUDE.md
  - docs/specs/SPEC-002_audit-trail.md
  - src/lib/ocr/parsers/building-parser.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-discuss.md
  - kimi-usage-ux-issue-body.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - listings.db
  - .opencode/skills/spectra-propose/SKILL.md
  - src/components/ui/ProvenanceBadge.tsx
  - src/hooks/useExtractStatus.ts
  - src/lib/document-generator/types.ts
  - src/lib/ocr/normalize.ts
  - migrations/003_add_extracted_data.sql
  - src/lib/pdf-generator/templates/survey.html
  - .github/skills/spectra-archive/SKILL.md
  - src/lib/codex-client/adapters/codex.ts
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/document-generator/build-input.ts
  - .opencode/skills/spectra-commit/SKILL.md
  - src/lib/external-links/url-builder.ts
  - src/test-setup.ts
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/adr/ADR-001_sqlite-cloud-split.md
  - src/lib/ocr/parsers/land-parser.ts
  - .github/skills/spectra-apply/SKILL.md
  - Dockerfile
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/adapters/ollama.ts
  - src/components/Sidebar.tsx
  - src/components/ui/ExtractProgress.tsx
  - .github/prompts/spectra-archive.prompt.md
  - src/components/forms/SupplementaryForm.tsx
  - src/components/LLMVisionConsentDialog.tsx
  - src/lib/pdf-generator/templates/sales-dm.html
  - .github/prompts/spectra-audit.prompt.md
  - src/lib/schemas/supplementary-schema.ts
  - playwright.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - src/lib/ocr/section-splitter.ts
  - src/lib/pdf-generator/dossier.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/llm-vision-prompts.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/api/listings/[id]/generate/route.ts
  - .opencode/commands/spectra-commit.md
  - src/app/api/listings/[id]/extract-status/route.ts
  - src/components/ui/SourceSwitcher.tsx
  - src/lib/ocr/text-cleanup.ts
  - .opencode/commands/spectra-ask.md
  - docs/specs/SPEC-005_data-portability.md
  - src/lib/ocr/parsers/mixed-parser.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-debug.md
  - src/lib/pdf-generator/templates/dossier.html
  - docs/specs/SPEC-003_api-security.md
  - src/app/listings/[id]/supplementary/page.tsx
  - docs/adr/ADR-003_docker-optimization.md
  - src/lib/document-generator/pdf/acroform-overlay.ts
  - .github/skills/spectra-commit/SKILL.md
  - docs/specs/SPEC-001_auth-identity.md
  - .github/prompts/spectra-apply.prompt.md
  - docs/specs/SPEC-004_notification-system.md
  - .github/prompts/spectra-discuss.prompt.md
  - src/app/listings/[id]/fill/page.tsx
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/index.ts
  - src/lib/db/index.ts
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/api/listings/[id]/field-visit/switch-source/route.ts
  - AIRE.db
  - src/app/api/listings/[id]/pdf/route.ts
  - kimi-statusline-feature-request.md
  - vitest.config.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - .github/skills/spectra-propose/SKILL.md
  - docs/adr/ADR-002_llm-backend-pluggability.md
  - src/components/forms/FieldVisitForm.tsx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/app/api/listings/[id]/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - e2e/external-market-lookup.spec.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/ocr/__tests__/text-cleanup.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - e2e/autofill-upload.spec.ts
  - src/components/__tests__/MarketLookupPanel.test.tsx
  - e2e/screenshot-market-lookup.spec.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/ocr/__tests__/section-splitter.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/normalize.test.ts
-->