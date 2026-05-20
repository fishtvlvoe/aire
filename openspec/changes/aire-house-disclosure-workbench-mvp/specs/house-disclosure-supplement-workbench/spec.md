## ADDED Requirements

### Requirement: Formal supplement workbench supports post-commission editing
After the draft has been used on site and the commission has been signed, the system SHALL support a formal supplement workbench for backfilling and correcting data.

#### Scenario: supplement after signed commission
- **WHEN** a user returns from the site with handwritten notes or contract updates
- **THEN** the user SHALL enter those updates in a supplement workbench
- **THEN** the supplement workbench SHALL NOT require recreating the case

##### Example: secretary backfills contract condition
- **GIVEN** case `AIRE-2026-001` already has a draft disclosure
- **WHEN** the secretary opens the supplement workbench
- **THEN** they can enter contract conditions without creating a new case

### Requirement: Supplement workbench reuses Page Contracts
Supplement data SHALL update the same Page Contract data model used by draft preview and PDF export.

#### Scenario: export after supplement
- **WHEN** supplement fields are saved
- **THEN** the preview and downloaded PDF SHALL be generated from the updated Page Contract data
- **THEN** preview and downloaded PDF SHALL show the same content

##### Example: saved supplement appears in PDF
- **GIVEN** the secretary fills `照片命名整理` as complete
- **WHEN** the disclosure is previewed and downloaded
- **THEN** both outputs use the updated supplement data
