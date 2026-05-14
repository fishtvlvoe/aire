# legal-clauses-pdf-block Specification

## Purpose

Render an embedded "法規告知" PDF block at the end of the fixed 4 pages, containing the three central laws with their source attribution and version dates, shared across all themes via `useTheme()` tokens.

## ADDED Requirements

### Requirement: System SHALL render LegalNoticeBlock in fixed 4-page section

The system SHALL render the `<LegalNoticeBlock>` React PDF component as the last block of the fixed 4-page section (after Cover, Basic Info, Location Map). The block SHALL appear before any dynamic pages (photo gallery, condition survey, life amenities).

#### Scenario: Legal notice appears at fixed page 4 of minimum case

- **WHEN** a minimum residential case (no photos, no survey, no amenities) renders
- **THEN** the legal notice block appears as part of page 4 of the resulting PDF AND no dynamic pages exist before it

#### Scenario: Legal notice appears before dynamic pages of full case

- **WHEN** a full residential case (photos + survey + amenities) renders
- **THEN** the legal notice block appears before the first photo gallery page in PDF page order

##### Example: Concrete page-order assertion for full residential case

- **GIVEN** a residential case with `{ photos: [p1, p2, p3, p4], survey: {filled}, amenities: {filled}, caseId: 'C0001' }`
- **WHEN** the rendered PDF page order is inspected via `pdf-parse` page text extraction
- **THEN** the first occurrence of any law title (e.g., "不動產經紀業管理條例") in the page-text array has a lower page index than the first occurrence of any photo gallery marker (e.g., "現況照片 1/4") or condition survey marker (e.g., "建物用途")

### Requirement: Block SHALL display three laws with version metadata

The system SHALL render each of the three laws (`real-estate-broker-act`, `consumer-protection-relevant`, `fair-trade-relevant`) as a sub-section with the law `title` as the heading, the `content_markdown` rendered as PDF text, and a metadata footer "資料來源：[source_label] / 版本日期：YYYY-MM-DD（民國 NNN 年 NN 月 NN 日）/ 同步日期：YYYY-MM-DD" derived from `source_url`, `version_date`, and `fetched_at`.

#### Scenario: Each law has heading, content, and metadata footer

- **WHEN** the legal notice block renders with all three laws in cache
- **THEN** the rendered React PDF tree contains 3 Text nodes matching the three law titles AND 3 metadata footer Text nodes containing the substring "資料來源：" AND each footer contains both Western year and Republic-of-China year representations

### Requirement: Block SHALL consume theme tokens for typography

The system SHALL apply theme tokens from `useTheme()` to the heading color, body color, font sizes, and section spacing. The block SHALL NOT hard-code any color hex or font size value.

#### Scenario: Theme A and Theme C render legal block with different colors

- **WHEN** the same legal notice block renders once with `theme-a-minimal` and once with `theme-c-tech-elegant`
- **THEN** the heading color, body color, and accent color differ between the two renders (verified by inspecting style props on the rendered React PDF nodes)

### Requirement: Block SHALL handle long content via wrap and continuation

The system SHALL apply `wrap={true}` to the law content and SHALL render a continuation marker "（續下頁）" on overflow, ensuring no content is cut off when laws exceed one page worth of vertical space.

#### Scenario: Long law content wraps with continuation marker

- **WHEN** the `real-estate-broker-act` `content_markdown` exceeds one page of vertical space at the chosen font size
- **THEN** the rendered PDF splits the law content across at least 2 pages AND the bottom of the first overflow page contains the Text "（續下頁）"

### Requirement: Block SHALL render empty-state placeholder when cache is empty

The system SHALL detect missing law entries (e.g., first run with no network) and SHALL render a placeholder Text "（法規資料同步中，下次重新產出說明書時將自動補入）" inside the block area instead of the laws.

#### Scenario: Empty cache renders placeholder

- **WHEN** `legal_clauses` table is empty and PDF renders
- **THEN** the legal notice block contains exactly one Text node with content "（法規資料同步中，下次重新產出說明書時將自動補入）" AND no law headings appear

### Requirement: Block SHALL use Republic-of-China year alongside Western year for version dates

The system SHALL format `version_date` and `fetched_at` as "YYYY 年 MM 月 DD 日（民國 NNN 年 MM 月 DD 日）" where `NNN = YYYY - 1911`. This satisfies Taiwan legal-document convention.

#### Scenario: Date 2024-08-15 renders both year systems

- **WHEN** a law has `version_date = '2024-08-15'`
- **THEN** the rendered metadata footer contains the substring "2024 年 08 月 15 日" AND "民國 113 年 08 月 15 日"

### Requirement: Block SHALL fit at the start of a new page (page break before)

The system SHALL apply `break={true}` (or equivalent @react-pdf page-break-before semantics) to the legal notice block so that it always starts on a new page rather than appearing inline at the bottom of the Location Map page.

#### Scenario: Block starts at a fresh page

- **WHEN** the Location Map page ends with content at vertical position 60% down the page
- **THEN** the legal notice block does NOT appear immediately below the Location Map content; instead it starts at a new page (verified by inspecting page numbers in the rendered PDF tree)
