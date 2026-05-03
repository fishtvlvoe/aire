# upload-first-flow Specification

## Purpose

TBD - created by archiving change 'upload-first-autofill'. Update Purpose after archive.

## Requirements

### Requirement: Upload as first step in listing creation flow

物件建立流程 SHALL 把「文件/照片上傳」作為章節導航的第一步，置於「基本資料」「建物資料」「現況」「法律資料」「補充資料」之前。

業務上傳的所有檔案（謄本 / 權狀 / 合約 / 地籍圖 / 室內外照片）SHALL 經過 `document-ocr-extraction` 解析後，提供給後續章節透過 `auto-fill-fields` 自動帶入欄位。

#### Scenario: 新建物件，導航第一步是上傳

- **WHEN** 業務從 `/listings/new` 建立新物件
- **THEN** 系統 SHALL 跳轉到 `/listings/{id}/fill`
- **AND** 章節導航的第一個 tab SHALL 是「照片/文件」
- **AND** 後續 tab 順序為：基本資料 → 建物資料 → 現況 → 法律資料 → 補充資料

#### Scenario: 既有物件（已有 field_visit_data）載入時不強制跳回上傳

- **WHEN** 業務開啟既有 listing（`field_visit_data` 非空）
- **THEN** 章節導航順序仍是 upload-first
- **AND** 預設停留章節 SHALL 是「基本資料」（不強制跳回上傳，避免業務誤以為要重做）


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
  - three-ai-ui-test.js
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
  - three-ai.db
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
### Requirement: Upload allows skip to manual entry

業務 SHALL 可以選擇「跳過上傳，全部手動輸入」直接進入後續章節，避免 OCR 流程阻擋。

#### Scenario: 業務無文件可上傳

- **WHEN** 業務在「照片/文件」章節點擊「跳過，全部手動輸入」按鈕
- **THEN** 系統 SHALL 跳轉到「基本資料」章節
- **AND** 所有欄位 SHALL 為空白（無 auto-fill 來源）
- **AND** 不阻擋後續章節作業

##### Example: 急件物件、業務手上無謄本

- **GIVEN** listing id = 99 為 draft 狀態，`extracted_data` 為 NULL，`attachments` 為空 list
- **WHEN** 業務進入 `/listings/99/fill` 停留在「照片/文件」tab 並點擊右上角「跳過，全部手動輸入」
- **THEN** URL SHALL 導向 `/listings/99/fill?chapter=basic-info`
- **AND** 「基本資料」tab 所有 input 欄位 value SHALL 為空字串
- **AND** `listings.extracted_data` SHALL 維持 NULL
- **AND** 章節徽章 SHALL 顯示 `0/N`（N 為該 propertyType 的欄位總數）


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
  - three-ai-ui-test.js
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
  - three-ai.db
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
### Requirement: Async extract triggered after each upload

每個檔案上傳成功後，系統 SHALL 立即觸發 `document-ocr-extraction` 解析（非同步），業務在解析期間可繼續其他章節作業。

#### Scenario: 上傳成功後立即解析

- **WHEN** 業務上傳「陳世曉-謄本.pdf」
- **THEN** 系統 SHALL 回應 200 含 attachment metadata
- **AND** 系統 SHALL 在背景觸發 `POST /api/listings/{id}/extract?attachmentId={id}`
- **AND** 解析期間 UI SHALL 顯示「解析中...」進度提示

#### Scenario: 解析完成後通知前端

- **WHEN** extract 完成且寫入 `listing.extracted_data`
- **THEN** 前端 SHALL 透過 polling 或 SSE 收到通知
- **AND** UI SHALL 顯示「資料已帶入，請檢查欄位」toast

#### Scenario: 業務切到後續章節時 extract 還沒完成

- **WHEN** 業務上傳後立即切到「基本資料」章節，extract 仍進行中
- **THEN** 章節 header SHALL 顯示「OCR 解析中... 等待完成才會自動帶入」
- **AND** 業務可手填欄位（不阻擋）
- **AND** extract 完成時 SHALL NOT 覆蓋業務已手填的值

##### Example: extract 耗時 8 秒，業務在第 2 秒已手填 address

- **GIVEN** listing id = 55，業務於 T+0 秒上傳 `中西區星鑽段.pdf`（2.4MB，含 6 個 section，extract 預估耗時 8 秒）
- **WHEN** 業務於 T+1 秒切到「基本資料」tab
- **AND** 業務於 T+2 秒手填 `address = "臺南市中西區自由路10號"`（在 extract 完成前）
- **AND** extract 於 T+8.3 秒完成，OCR 結果 `merged_fields.address = "臺南市中西區星鑽段0420-0000地號"`
- **THEN** T+1 到 T+8.3 秒期間章節 header SHALL 顯示「OCR 解析中...」
- **AND** T+8.3 秒後 `field_visit_data.address` SHALL 維持 `"臺南市中西區自由路10號"`（業務手填值不被覆蓋）
- **AND** address 欄位徽章 SHALL 顯示橘色「✏️ 已修改」或提示「⚠ 文件中為『臺南市中西區星鑽段0420-0000地號』，目前手填為『臺南市中西區自由路10號』」

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
  - three-ai-ui-test.js
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
  - three-ai.db
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