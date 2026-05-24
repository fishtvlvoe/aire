## ADDED Requirements

### Requirement: Disclosure PDF SHALL only use trusted registry data

The disclosure PDF generation flow SHALL distinguish pre-survey property investigation output from supplement-confirmed output. Confirmed registry-derived fields SHALL only be populated from trusted registry data. Trusted registry data is either successful MOI/COP API data saved with provenance or user-confirmed manual data completed during supplement. Unknown-source, mock, candidate, failed, unauthorized, or raw probe data SHALL NOT populate confirmed fields.

Pre-survey property investigation output SHALL be allowed to show candidate, public, and incomplete data for pre-commission negotiation only when those fields are labeled as pre-survey or pending confirmation. Pre-survey output SHALL NOT present those fields as confirmed registry facts.

#### Scenario: Legacy raw registry payload is not trusted

- **GIVEN** a case has `land_registry_data` without `schema = "aire.registry-provenance.v1"`
- **WHEN** the PDF assembler builds dossier data
- **THEN** confirmed registry-derived fields such as building area, construction date, certificate number, zoning, land area, and ownership scope SHALL NOT be populated from that payload

#### Scenario: Trusted MOI provenance populates PDF

- **GIVEN** a case has `land_registry_data.schema = "aire.registry-provenance.v1"`
- **AND** the `building_registry` entry has `source = "moi_api"`, `status = "success"`, and `trustedForPdf = true`
- **WHEN** the PDF assembler builds dossier data
- **THEN** building registry fields SHALL be eligible to populate confirmed fields

#### Scenario: Pre-survey output carries candidate data with labels

- **GIVEN** a case has candidate land or building data from public sources or NLSC CAD
- **WHEN** the system generates pre-survey property investigation output for pre-commission negotiation
- **THEN** the output SHALL show the candidate data only with source and pending-confirmation labels
- **AND** each candidate field SHALL show source and pending-confirmation status
- **AND** the output SHALL NOT label the candidate data as confirmed registry fact

#### Scenario: Supplement turns pre-survey fields into confirmed fields

- **GIVEN** a pre-survey field was marked pending confirmation
- **WHEN** the user completes supplement by uploading formal evidence or manually confirming with the owner
- **THEN** the field SHALL be saved with provenance status `manual_confirmed` or a trusted MOI/COP source
- **AND** the field SHALL become eligible for confirmed output
