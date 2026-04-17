## ADDED Requirements

### Requirement: System generates exactly five document types per listing

For a given listing in `ready-for-generation` state, the system SHALL produce five output files via Codex CLI.

#### Scenario: Generate all five documents
- **WHEN** user clicks "一鍵產文件" on a ready listing
- **THEN** system SHALL produce the following files in `data/outputs/<listing-id>/`:
  1. `不動產說明書.pdf` (PDF)
  2. `物調表.md` (Markdown)
  3. `591-PO文.md` (Markdown)
  4. `銷售DM.md` (Markdown)
  5. `FB社群貼文.md` (Markdown, containing 5 platform sections)
- **AND** listing state SHALL transition to `documents-ready`

#### Scenario: Partial generation failure
- **WHEN** Codex fails on one document (e.g., 591 PO 文)
- **THEN** other documents SHALL still be produced
- **AND** UI SHALL show per-document status (✓ / ✗ / 產生中)
- **AND** retry button SHALL be available per failed document

### Requirement: Real estate brochure is PDF with fixed 16-chapter format

The 不動產說明書 (real estate brochure) SHALL be a PDF following the Jianan brand 16-chapter template.

#### Scenario: Building type brochure
- **GIVEN** listing property_type in building category (apartment/highrise/townhouse/studio/storefront/factory/farmhouse)
- **WHEN** brochure is generated
- **THEN** PDF SHALL use building template with 16 chapters (cover → owner info → land markings → building markings → rights → usage → parking → defects → transaction → surroundings → market data → appendix)
- **AND** cover page SHALL include Jianan logo, property code, property name, broker info
- **AND** every page SHALL have consistent header (property code + name) and footer (page N / total)

#### Scenario: Land type brochure
- **GIVEN** listing property_type in land category (farmland/residential-land/commercial-land/industrial-land/rural-land/other-land)
- **WHEN** brochure is generated
- **THEN** PDF SHALL use land template with 16 chapters (cover → owner info → land markings → rights → usage restrictions → surroundings → market data → appendix)

### Requirement: Secondary documents are Markdown format

物調表、591 PO 文、銷售 DM、FB 社群貼文 SHALL be plain Markdown files.

#### Scenario: Survey sheet MD includes structured tables
- **WHEN** survey sheet is generated
- **THEN** file SHALL be valid Markdown
- **AND** contain tables for: 基本資料 / 現場現況 / 瑕疵風險 / 交易條件
- **AND** be AI-readable for future re-generation

#### Scenario: 591 PO 文 ready to paste
- **WHEN** 591 post is generated
- **THEN** file SHALL be formatted to paste directly into 591 platform
- **AND** include: 物件標題、地址、坪數、格局、售價、亮點 3-5 條、聯絡資訊
- **AND** NOT include Markdown heavy formatting that 591 ignores

#### Scenario: FB social content covers 5 platforms
- **WHEN** social media posts are generated
- **THEN** single MD file SHALL contain 5 sections separated by `---`:
  1. Facebook 粉絲團
  2. Instagram
  3. Threads
  4. LINE 社群
  5. YouTube Community
- **AND** each section SHALL have tailored copy + image prompt for that platform

### Requirement: Each document can be regenerated independently

Users SHALL be able to regenerate any single document without affecting others.

#### Scenario: Regenerate one document
- **WHEN** user clicks "重新產生" on the 591 PO 文 card
- **THEN** only 591 PO 文 SHALL be re-run via Codex
- **AND** other 4 documents SHALL remain unchanged
- **AND** new version SHALL overwrite the old file with timestamp in metadata
