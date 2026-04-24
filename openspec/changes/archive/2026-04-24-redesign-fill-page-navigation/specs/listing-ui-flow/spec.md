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

### Requirement: Fill page navigation buttons use icon-only circular floating group

The navigation buttons on `/listings/[id]/fill` SHALL be rendered as a group of 56×56 pixel circular buttons with an icon and no text label. A hover tooltip implemented via the HTML `title` attribute SHALL provide the full text description (e.g., `暫存草稿`, `下一章節`, `去秘書後補`, `直接產出文件`).

Icons SHALL be inline SVG following Heroicons Outline v2 style (24×24, strokeWidth=2), consistent with `src/app/listings/page.tsx` patterns. External icon packages (lucide-react, @heroicons/react) SHALL NOT be added as dependencies.

Button color assignments:
- `暫存草稿`: gray (`bg-gray-500`)
- `下一章節` / `去秘書後補`: primary navy (`#1B3A6B`)
- `直接產出文件`: emerald green (`bg-emerald-600`)

Disabled state SHALL use `opacity-40` and `cursor-not-allowed`. Hover state SHALL apply a `scale-105` transform.

#### Scenario: Button renders as circular icon with tooltip

- **WHEN** the fill page renders the `下一章節` button
- **THEN** the button SHALL be 56×56 pixels, circular (`rounded-full`)
- **AND** SHALL contain an inline SVG icon (no text child)
- **AND** the `title` attribute SHALL be `下一章節` (or `本章節還有必填未完成` when disabled)

#### Scenario: Disabled button styling

- **WHEN** a navigation button is in disabled state
- **THEN** `opacity-40` SHALL be applied
- **AND** the `cursor-not-allowed` class SHALL be applied

### Requirement: Fill page layout aligns header and form cards and anchors action buttons inside the form card

The fill page SHALL render the header card (`資料填寫` with metadata chips) and the form card (`現勘表單` with chapter navigation and fields) at the same width, inside a shared max-width container so that the two cards visually form a single vertical group.

The navigation button group (the icon-only buttons from the preceding requirement) SHALL be positioned inside the form card's internal right-top area using CSS `sticky top-4` (or equivalent) so that:

1. The buttons SHALL visually belong to the form card (not float outside any card).
2. When the user scrolls down a long form, the buttons SHALL remain visible at the top-right of the viewport, anchored within the form card's boundaries.
3. The buttons SHALL NOT overflow outside the form card's white background.

The previous `fixed bottom-6 right-6` viewport-anchored positioning SHALL be removed.

#### Scenario: Cards share container width

- **WHEN** the fill page renders with a completed listing
- **THEN** the header card and the form card SHALL have the same rendered width
- **AND** both SHALL be children of the same max-width container

#### Scenario: Buttons stay inside form card while scrolling

- **WHEN** the form card has sufficient content to require vertical scrolling (e.g., 2000px height)
- **AND** the user scrolls down past the top of the form card
- **THEN** the navigation button group SHALL remain visible at the top-right of the form card's viewport-visible area
- **AND** the buttons SHALL NOT appear outside the form card's white background

#### Scenario: No viewport-fixed positioning

- **WHEN** the fill page is rendered
- **THEN** the navigation button group SHALL NOT use `position: fixed` relative to the viewport
- **AND** SHALL use `position: sticky` or `position: absolute` relative to the form card container
