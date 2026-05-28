## ADDED Requirements

### Requirement: Case workbench SHALL prevent formal import data mismatch

The case workbench SHALL prevent a case address and confirmed registry target from being overwritten or visually contradicted by unrelated demo formal import data. Formal registry data shown in the workbench SHALL match the active case provenance or be blocked.

#### Scenario: Hsinchu case does not show Taipei demo data

- **WHEN** a case address is `新竹市北區四維路130號4樓之3`
- **AND** browser development formal import has no real formal source
- **THEN** the workbench SHALL NOT show `台北市大安區和平東路`
- **THEN** the workbench SHALL NOT show `建號 778-2`
- **THEN** the workbench SHALL NOT show `北松字第012345號`

### Requirement: Formal import review SHALL use a full-width readable layout

The case workbench SHALL render candidate confirmation, formal import, property summary, and PDF check as readable full-width work surfaces. The layout SHALL keep candidate identifiers, summaries, status, cost, and actions visually aligned for review.

#### Scenario: Candidate confirmation is readable in the main work surface

- **WHEN** the user opens formal import for a case with candidate parcels
- **THEN** the candidate list is rendered in the main content surface with distinct columns for candidate key, summary, status, and action
- **THEN** the candidate list is not constrained to a narrow right-side card

#### Scenario: PDF check remains readable with many fields

- **WHEN** the user opens PDF check with ten or more fields
- **THEN** the PDF check table is rendered in a full-width scroll-safe surface
- **THEN** field labels, values, sources, and statuses remain readable without overlapping
