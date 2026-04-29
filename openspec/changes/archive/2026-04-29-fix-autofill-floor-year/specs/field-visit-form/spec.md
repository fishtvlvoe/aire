## MODIFIED Requirements

### Requirement: Provenance Badge for Compound Floor Field

The provenance badge for the `floor_count` compound field SHALL check
`mergedFields.floor_total` (and fall back to `mergedFields.floor_current`)
rather than `mergedFields.floor_count`.

Since the OCR key `stories` maps to `floor_total`, `mergedFields.floor_count`
will never exist. The badge source MUST be aligned with the actual sub-key
that carries the OCR-extracted value.

### Requirement: OCR Prefill — Compound Field Sub-Key Fill

When OCR prefill writes `form.floor_total`, the `floor_count` compound field
renderer SHALL display the value in the 總樓層 (total floors) input.
The 所在樓層 (current floor) input SHALL remain empty as its value is not
available in the building transcript and requires manual input.
