# disclosure-form-residential Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Residential disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='residential'`, organized into 5 tabs in this order: `標示` (identification), `權利` (rights), `稅費` (tax & fees), `現況` (current condition), `附件` (attachments).

The form SHALL include at minimum the following field groups, each persisted as keys in `disclosure_drafts.payload_json`:

##### Example: residential field groups by tab

| Tab | Field keys (subset) | Type |
| --- | --- | --- |
| 標示 | `building_lot_no`, `land_lot_no`, `floor_area`, `building_age`, `building_structure`, `floor_total`, `floor_this` | text, number |
| 權利 | `ownership_type`, `mortgage_status`, `other_rights` | enum, text |
| 稅費 | `tax_land_value`, `tax_building_value`, `tax_property_tax_annual`, `tax_land_value_tax_annual` | number |
| 現況 | `condition_leakage`, `condition_renovation`, `condition_illegal_addition`, `condition_defects_notes` | boolean, text |
| 附件 | `attachment_property_deed`, `attachment_floor_plan`, `attachment_photos_notes` | boolean, text |

#### Scenario: Form renders all tabs on initial load

- **WHEN** the user opens a residential case edit page
- **THEN** five tab triggers are visible with labels `標示`, `權利`, `稅費`, `現況`, `附件`, and the `標示` tab is selected by default

#### Scenario: Switch tabs preserves entered values

- **WHEN** the user enters `floor_area=35.6` in `標示`, switches to `現況`, then switches back to `標示`
- **THEN** the value `35.6` is still present in the `floor_area` input

---
### Requirement: Field validation rules

The system SHALL validate residential fields on blur and before save:

- Number fields (`floor_area`, `building_age`, `floor_total`, `tax_*`) MUST accept positive numbers including decimals with up to 2 decimal places; negative values MUST be rejected.
- Text fields `building_lot_no`, `land_lot_no` MUST NOT be empty for `status='completed'` transition; while in `draft` they SHALL be allowed to be empty.
- Boolean fields (`condition_*`, `attachment_*`) MUST be tri-state: `true`, `false`, or `unknown`.

##### Example: validation results

| Field | Input | Result |
| --- | --- | --- |
| `floor_area` | `35.6` | accept |
| `floor_area` | `-5` | reject: `不可為負數` |
| `floor_area` | `35.123` | reject: `小數最多 2 位` |
| `building_age` | `0` | accept |
| `building_lot_no` | empty (status=draft) | accept |
| `building_lot_no` | empty (status=completed) | reject: `建物地號為必填` |

#### Scenario: Negative number rejected

- **WHEN** the user types `-5` in `floor_area` and blurs the field
- **THEN** the field displays the error message `不可為負數` and the value is not saved to draft

#### Scenario: Empty required field blocks completion transition

- **WHEN** the user clicks `標示為完成` on a residential case where `building_lot_no` is empty
- **THEN** the system blocks the transition and displays inline errors on missing required fields

---
### Requirement: Draft autosave

The system SHALL debounce field changes by 1000 milliseconds and call the IPC command `save_draft(case_id, payload)` to upsert into `disclosure_drafts`. The form SHALL flush a final save when the window emits a close event before unmount.

##### Example: autosave timing

- **GIVEN** the user types `floor_area=35` at t=0ms
- **WHEN** no further input occurs by t=1000ms
- **THEN** `save_draft` is invoked exactly once with the current full payload

#### Scenario: Save status indicator

- **WHEN** an autosave completes successfully
- **THEN** the top-right status indicator displays `已儲存 HH:mm:ss` in Asia/Taipei time

#### Scenario: Save failure does not block input

- **WHEN** `save_draft` fails with a DB error
- **THEN** the indicator displays `儲存失敗，已保留輸入` in red, the user can continue editing, and the next debounced cycle retries

---
### Requirement: Form reload from saved draft

The system SHALL hydrate the form from `disclosure_drafts.payload_json` when the user opens an existing residential case, using `schema_version` to apply forward-compatible defaults for any new fields added in future migrations.

#### Scenario: Reopen case with saved draft

- **WHEN** the user closes the application, restarts it, and reopens a residential case where a draft was saved with three fields filled
- **THEN** the form displays the three field values exactly as last saved, with all other fields at their default (empty for text, null for number, `unknown` for tri-state booleans)
