## ADDED Requirements

### Requirement: Fill page navigation uses explicit primary action tied to completeness

The system SHALL display the primary action button on `/listings/[id]/fill` based on two conditions:
1. Whether there are more chapters with fields to fill after the current one.
2. Whether ALL required fields across ALL chapters are complete (`isComplete === true`).

When condition 1 is true (not on the last chapter), the primary button SHALL be labeled `下一章節` and navigate to the next chapter that has at least one field.

When condition 1 is false (on the last chapter) and condition 2 is true (all required filled), the page SHALL display TWO side-by-side primary buttons: `去秘書後補` (navigates to `/listings/[id]/supplementary`) and `直接產出文件` (navigates to `/listings/[id]/generating`). A helper text below SHALL read `選『去秘書後補』讓秘書補齊法律/行情資料後產出完整文件；選『直接產出』立即產出，秘書欄位將留空`.

When condition 1 is false and condition 2 is false, both primary buttons SHALL be visible but disabled, with an inline message `還有必填欄位未完成，無法產出`.

A secondary button SHALL always be present, labeled `暫存草稿`, which persists current form state to the DB with `status='draft'` and redirects to `/listings`.

The previous single-button pattern labeled `儲存並前往補件` SHALL be removed entirely — no variant of it SHALL remain.

#### Scenario: Mid-chapter navigation with incomplete chapter

- **WHEN** user is on chapter 2 of 5 and chapter 2 has an unfilled required field
- **THEN** the primary button SHALL show `下一章節` but be disabled with message `本章節還有必填未完成`
- **AND** the secondary `暫存草稿` button SHALL be enabled

#### Scenario: Move to next chapter

- **WHEN** user is on chapter 2 of 5 and all required fields in chapter 2 are filled
- **AND** chapter 3 has at least one field
- **AND** user clicks `下一章節`
- **THEN** the form SHALL switch to chapter 3
- **AND** the active chapter tab SHALL update

#### Scenario: Last chapter with all required complete — user picks secretary follow-up

- **WHEN** user is on the last chapter with fields
- **AND** all required fields across all chapters are filled (`isComplete === true`)
- **THEN** two side-by-side primary buttons SHALL appear: `去秘書後補` and `直接產出文件`
- **AND** clicking `去秘書後補` SHALL navigate to `/listings/[id]/supplementary`

#### Scenario: Last chapter with all required complete — user picks direct generation

- **WHEN** user is on the last chapter with fields
- **AND** all required fields are filled
- **AND** user clicks `直接產出文件`
- **THEN** the page SHALL navigate to `/listings/[id]/generating`
- **AND** secretary supplementary fields SHALL remain empty

#### Scenario: Last chapter but overall incomplete

- **WHEN** user is on the last chapter with fields
- **AND** at least one required field in an earlier chapter is unfilled
- **THEN** both `去秘書後補` and `直接產出文件` buttons SHALL be disabled
- **AND** an inline message SHALL read `還有必填欄位未完成，無法產出`

#### Scenario: Save draft from any state

- **WHEN** user clicks `暫存草稿` at any point
- **THEN** current form data SHALL be persisted to DB
- **AND** listing status SHALL remain `draft`
- **AND** user SHALL be redirected to `/listings`

### Requirement: All user-facing labels use pure Traditional Chinese

The system SHALL render all UI labels, button text, tooltips, page titles, and page headers in Traditional Chinese only. Mixed-language labels (Chinese + English together in a single label) SHALL NOT appear.

Specifically, the button previously labeled `Generate Documents 產出文件` SHALL be labeled `產出文件` with no English prefix.

Technical identifiers (API endpoint paths, variable names, file names, error codes) SHALL remain in English as they are not user-facing labels.

#### Scenario: Documents page action button

- **WHEN** the page `/listings/[id]/documents` renders
- **THEN** any button text SHALL contain only Traditional Chinese characters
- **AND** no English words (other than proper nouns like "PDF", brand names) SHALL appear inside button labels

#### Scenario: Scan codebase for mixed-language labels

- **WHEN** a scan is performed across `src/components/**/*.tsx` and `src/app/**/*.tsx`
- **THEN** no label string SHALL contain both Latin words of 3+ letters AND Chinese characters in the same string
- **AND** exception: proper nouns (PDF, AI, URL, API) are permitted
