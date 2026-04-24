## MODIFIED Requirements

### Requirement: Field visit form hydrates initial data from existing listing

The field visit form component SHALL accept an optional `initialData?: Record<string, unknown>` prop. WHEN the prop is provided and contains at least one key, the form SHALL populate each field's initial value from `initialData` by coercing values to strings (non-null primitives) or empty string (null/undefined/unsupported types).

The form SHALL perform a one-time hydration when `initialData` first transitions from `undefined` / empty object to a non-empty object (handling asynchronous parent loading). After the first hydration completes, subsequent `initialData` changes SHALL NOT overwrite user input — this SHALL be guarded by an internal `didHydrate` flag.

The property-type selector clear-form effect SHALL only execute when `propertyType` prop is `undefined` (i.e., uncontrolled mode). In controlled mode (parent passes `propertyType`), changing property types SHALL NOT clear the form because controlled mode implies editing an existing listing.

**Added in upload-first-autofill change**: `initialData` SHALL support two sources merged by precedence: (1) `field_visit_data` (agent-edited values), and (2) `extracted_data.merged_fields` (OCR-extracted values). Agent-edited values SHALL take precedence over OCR values on conflict — see `auto-fill-fields` capability's "User edit wins on conflict" requirement. Each field SHALL render a provenance badge indicating source (green = OCR-filled, orange = user-modified, yellow = parsing-in-progress, purple = LLM Vision, no badge = manual-only).

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

#### Scenario: Hydrate from OCR-extracted data with provenance

- **WHEN** a listing has `extracted_data.merged_fields.address = { value: "臺南市下營區十六甲段2195-0000地號", confidence: 0.97, from: "att_abc" }` and `field_visit_data.address` is empty
- **THEN** the `物件地址` field SHALL display `臺南市下營區十六甲段2195-0000地號`
- **AND** the field SHALL render a green provenance badge labelled `📄 已從 {filename} 帶入`
- **AND** subsequent agent edits SHALL transition the badge to orange `✏️ 已修改` (User edit wins on conflict)
