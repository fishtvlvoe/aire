## MODIFIED Requirements

### Requirement: Document generation page includes template selection

The document generation page SHALL display a template selector dropdown that lists all available templates for the current document type. The selector SHALL default to the template marked as is_default=1 for that doc_type. If no templates exist, the system SHALL use the built-in fallback template (current fixed template). The user SHALL be able to switch templates and preview each one before exporting.

#### Scenario: Template selector shows available templates
- **WHEN** a user navigates to the document generation page for a listing
- **THEN** the page SHALL display a dropdown listing all templates for the relevant doc_type, with the default template pre-selected

#### Scenario: No custom templates available
- **WHEN** no templates exist for the current doc_type
- **THEN** the system SHALL use the built-in fallback template and hide the template selector

#### Scenario: User switches template
- **WHEN** a user selects a different template from the dropdown
- **THEN** the preview area SHALL update to show the newly selected template rendered with the current listing data
