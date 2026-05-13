## ADDED Requirements

### Requirement: Land disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='land'`, organized into 4 tabs in this order: `標示` (identification), `權利` (rights), `稅費` (tax & fees), `現況` (current condition).

The form SHALL include at minimum the following field groups, each persisted as keys in `disclosure_drafts.payload_json`:

##### Example: land field groups by tab

| Tab | Field keys (subset) | Type |
| --- | --- | --- |
| 標示 | `land_lot_no`, `land_area`, `zoning_use`, `urban_district`, `land_category` | text, number |
| 權利 | `ownership_type`, `share_ratio`, `mortgage_status`, `other_rights` | enum, text |
| 稅費 | `tax_land_value`, `tax_announced_present_value`, `tax_land_value_tax_annual` | number |
| 現況 | `condition_access`, `condition_boundary_clear`, `condition_tenant_present`, `condition_defects_notes` | boolean, text |

#### Scenario: Form renders all tabs on initial load

- **WHEN** the user opens a land case edit page
- **THEN** four tab triggers are visible with labels `標示`, `權利`, `稅費`, `現況`, and the `標示` tab is selected by default

#### Scenario: Switch tabs preserves entered values

- **WHEN** the user enters `land_area=120.5` in `標示`, switches to `現況`, then switches back to `標示`
- **THEN** the value `120.5` is still present in the `land_area` input

### Requirement: Field validation rules

The system SHALL validate land fields on blur and before save:

- Number fields (`land_area`, `share_ratio`, `tax_*`) MUST accept positive numbers; `share_ratio` MUST be between `0` and `1` inclusive (e.g., `0.25` for 1/4 share).
- Text field `land_lot_no` MUST NOT be empty for `status='completed'` transition.
- Tri-state booleans accept `true`, `false`, `unknown`.

##### Example: validation results

| Field | Input | Result |
| --- | --- | --- |
| `land_area` | `120.5` | accept |
| `land_area` | `0` | accept |
| `share_ratio` | `0.5` | accept |
| `share_ratio` | `1.5` | reject: `持分比例需介於 0 到 1` |
| `share_ratio` | `-0.1` | reject: `持分比例需介於 0 到 1` |
| `land_lot_no` | empty (status=completed) | reject: `地號為必填` |

#### Scenario: Share ratio outside range rejected

- **WHEN** the user types `1.5` in `share_ratio` and blurs the field
- **THEN** the field displays `持分比例需介於 0 到 1` and the value is not saved to draft

#### Scenario: Empty required field blocks completion transition

- **WHEN** the user clicks `標示為完成` on a land case where `land_lot_no` is empty
- **THEN** the system blocks the transition and displays an inline error on the missing field

### Requirement: Draft autosave

The system SHALL debounce field changes by 1000 milliseconds and call the IPC command `save_draft(case_id, payload)` to upsert into `disclosure_drafts`. The form SHALL flush a final save when the window emits a close event before unmount.

#### Scenario: Save status indicator

- **WHEN** an autosave completes successfully
- **THEN** the top-right status indicator displays `已儲存 HH:mm:ss` in Asia/Taipei time

#### Scenario: Save failure does not block input

- **WHEN** `save_draft` fails with a DB error
- **THEN** the indicator displays `儲存失敗，已保留輸入` in red and the user can continue editing

### Requirement: Form reload from saved draft

The system SHALL hydrate the land form from `disclosure_drafts.payload_json` when the user opens an existing land case, using `schema_version` to apply forward-compatible defaults for any future fields.

#### Scenario: Reopen case with saved draft

- **WHEN** the user reopens a land case where a draft was saved with two fields filled
- **THEN** the form displays the two field values exactly as last saved, with all other fields at their default (empty for text, null for number, `unknown` for tri-state booleans)
