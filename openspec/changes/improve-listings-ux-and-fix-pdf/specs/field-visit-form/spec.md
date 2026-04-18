## ADDED Requirements

### Requirement: Field visit form hydrates initial data from existing listing

The field visit form component SHALL accept an optional `initialData?: Record<string, unknown>` prop. WHEN the prop is provided and contains at least one key, the form SHALL populate each field's initial value from `initialData` by coercing values to strings (non-null primitives) or empty string (null/undefined/unsupported types).

The form SHALL perform a one-time hydration when `initialData` first transitions from `undefined` / empty object to a non-empty object (handling asynchronous parent loading). After the first hydration completes, subsequent `initialData` changes SHALL NOT overwrite user input — this SHALL be guarded by an internal `didHydrate` flag.

The property-type selector clear-form effect SHALL only execute when `propertyType` prop is `undefined` (i.e., uncontrolled mode). In controlled mode (parent passes `propertyType`), changing property types SHALL NOT clear the form because controlled mode implies editing an existing listing.

#### Scenario: Load existing listing for edit

- **WHEN** user navigates to `/listings/{id}/fill` for a listing whose `field_visit_data` contains `{"address": "台南市中西區民族路三段191號", "price": "500"}`
- **THEN** the `物件地址` field SHALL display `台南市中西區民族路三段191號`
- **THEN** the `委託總價` field SHALL display `500`

#### Scenario: Hydrate only once

- **WHEN** the form has been hydrated from `initialData` and the user has edited the `物件地址` field to `新地址`
- **WHEN** the parent component re-fetches and passes a new `initialData` object with the original address
- **THEN** the `物件地址` field SHALL continue to display `新地址` (user input preserved, no re-hydration)

#### Scenario: Empty initial data

- **WHEN** `initialData` is `undefined` or `{}`
- **THEN** the form SHALL render with all fields empty
- **THEN** no hydration effect SHALL occur

### Requirement: Chapter navigation badge shows full-field completion with required indicator

Each chapter-navigation tab button SHALL display a badge with the format `filled/total` where `filled` counts all fields (required and non-required) whose trimmed string value is non-empty, and `total` counts all fields in the chapter (required and non-required).

The badge SHALL apply visual states based on completion:
- All fields filled (`filled === total`) → green background with checkmark icon
- Required fields all filled but non-required remain (`filledRequired === totalRequired && filled < total`) → amber background
- At least one required field unfilled (`filledRequired < totalRequired`) → gray background WITH a red dot indicator (width 8px, height 8px, background `#EF4444`, circular) overlaid at the top-right corner of the badge

#### Scenario: Chapter with required fields unfilled

- **WHEN** a chapter has 2 required fields (1 filled) and 3 non-required fields (2 filled)
- **THEN** the tab badge SHALL display `3/5` on a gray background
- **THEN** a red dot SHALL appear at the top-right of the badge

#### Scenario: Chapter with all required filled, some non-required empty

- **WHEN** a chapter has 2 required fields (both filled) and 3 non-required fields (1 filled)
- **THEN** the tab badge SHALL display `3/5` on an amber background
- **THEN** no red dot SHALL appear

#### Scenario: Chapter fully completed

- **WHEN** a chapter has 2 required fields (both filled) and 3 non-required fields (all filled)
- **THEN** the tab badge SHALL display `5/5` on a green background with a checkmark icon

### Requirement: Submit button remains clickable and validation errors jump to incomplete chapter

The form submission button on the `/listings/[id]/fill` page SHALL remain clickable at all times except when an in-flight save request is pending (`submitting === true`). Removing the `!isComplete` disabling condition SHALL be required.

WHEN the user clicks the submit button and the form has at least one required field unfilled, the system SHALL:
1. Prevent the save API call from being dispatched.
2. Locate the first chapter (in chapter order) whose `filledRequired < totalRequired` and set it as the active chapter.
3. Apply a `highlight-missing` visual state to every unfilled required field in that chapter (red border and red helper text `此欄位必填`).
4. Display a banner at the top of the form content reading `尚有 N 個必填欄位未完成，已為您跳至「章節 X」` where `N` is the total count of unfilled required fields across all chapters and `X` is the title of the active chapter.

WHEN the user clicks the submit button and all required fields are filled, the system SHALL dispatch the save API call as before (`POST /api/listings/{id}/field-visit` returning HTTP 200 on success).

The banner SHALL automatically dismiss when the user fills all required fields in the highlighted chapter OR when the user manually clicks a close button on the banner.

#### Scenario: Click submit with incomplete required fields

- **WHEN** the form has required fields unfilled in chapter 2
- **WHEN** user clicks the `儲存並前往補件` button
- **THEN** the button SHALL NOT be disabled (not grayed out before click)
- **THEN** no `POST /api/listings/{id}/field-visit` request SHALL be sent
- **THEN** the active chapter SHALL change to chapter 2
- **THEN** the unfilled required fields in chapter 2 SHALL display red borders
- **THEN** a banner SHALL display with the format `尚有 {N} 個必填欄位未完成，已為您跳至「{chapterTitle}」`

#### Scenario: Click submit with all required fields filled

- **WHEN** all required fields across all chapters are filled
- **WHEN** user clicks the `儲存並前往補件` button
- **THEN** `POST /api/listings/{id}/field-visit` SHALL be dispatched with the form payload
- **THEN** HTTP 200 response SHALL trigger navigation to `/listings/{id}/supplementary`

#### Scenario: Banner auto-dismiss when fields are filled

- **WHEN** the validation banner is visible due to unfilled required fields
- **WHEN** user fills in all required fields in the highlighted chapter
- **THEN** the banner SHALL automatically disappear without user interaction

#### Scenario: Submit button during save

- **WHEN** a save request is in flight (`submitting === true`)
- **THEN** the submit button SHALL be disabled with `cursor-not-allowed` and display `儲存中...` text
