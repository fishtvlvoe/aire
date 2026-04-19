## ADDED Requirements

### Requirement: Supplementary form renders secretary fields for all 13 types

The supplementary form SHALL support 13 property types with their `sourceType: 'secretary'` fields.

#### Scenario: Secretary fields auto-filtered
- **WHEN** secretary opens `/listings/[id]/supplementary` for any property type
- **THEN** form SHALL show ONLY fields with `sourceType: 'secretary'` or `sourceType: 'public-data'`
- **AND** fields with `sourceType: 'onsite'` or `'deed'` SHALL be read-only reference

### Requirement: Pre-commission data is visible as reference

Fields populated in pre-commission stage SHALL be visible (read-only) in the supplementary form for context.

#### Scenario: Pre-commission public data shown
- **WHEN** supplementary form opens
- **THEN** a collapsible "委託前已查資料" section SHALL show all fields populated in pre-commission stage
- **AND** section SHALL be read-only in supplementary view
- **AND** secretary CAN navigate back to pre-commission to edit if needed
