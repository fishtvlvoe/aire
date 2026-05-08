## ADDED Requirements

### Requirement: Admin can upload HTML templates

The system SHALL provide an API endpoint POST /api/admin/templates that accepts an HTML file upload with metadata (name, description, doc_type). The uploaded file MUST be validated for: file extension (.html or .htm), file size (2MB maximum), presence of at least one Mustache variable marker ({{), and sanitized with DOMPurify to remove script tags while preserving style tags. The template metadata SHALL be stored in the templates SQLite table and the HTML content SHALL be saved to data/templates/{id}.html.

#### Scenario: Successful template upload
- **WHEN** an admin uploads a valid HTML file with name "品牌模板A" and doc_type "disclosure"
- **THEN** the system SHALL return HTTP 201 with the created template metadata including id, name, doc_type, and is_default=false

#### Scenario: File too large
- **WHEN** an admin uploads an HTML file larger than 2MB
- **THEN** the system SHALL return HTTP 400 with error message indicating the size limit

#### Scenario: Missing variable markers
- **WHEN** an admin uploads an HTML file containing no {{ markers
- **THEN** the system SHALL return HTTP 400 with error message indicating the template must contain variable placeholders

#### Scenario: Malicious script tags removed
- **WHEN** an admin uploads an HTML file containing script tags
- **THEN** the system SHALL strip all script tags before saving, preserving style tags and other HTML content

### Requirement: Admin can list all templates

The system SHALL provide an API endpoint GET /api/admin/templates that returns all templates with their metadata. Results SHALL be filterable by doc_type query parameter.

#### Scenario: List all templates
- **WHEN** an admin sends GET /api/admin/templates
- **THEN** the system SHALL return HTTP 200 with an array of template objects sorted by created_at descending

#### Scenario: Filter by doc_type
- **WHEN** an admin sends GET /api/admin/templates?doc_type=disclosure
- **THEN** the system SHALL return only templates with doc_type "disclosure"

### Requirement: Admin can delete a template

The system SHALL provide an API endpoint DELETE /api/admin/templates/{id} that removes the template metadata from the database and deletes the HTML file from data/templates/{id}.html.

#### Scenario: Successful deletion
- **WHEN** an admin sends DELETE /api/admin/templates/5
- **THEN** the system SHALL remove the database row and HTML file, returning HTTP 200

#### Scenario: Delete non-existent template
- **WHEN** an admin sends DELETE /api/admin/templates/999 for a template that does not exist
- **THEN** the system SHALL return HTTP 404

### Requirement: Admin can set a default template

The system SHALL provide an API endpoint PATCH /api/admin/templates/{id} that accepts { is_default: true }. Setting a template as default SHALL unset the previous default template for the same doc_type (set is_default=0) before setting the new one (is_default=1).

#### Scenario: Set new default
- **WHEN** an admin sets template 3 as default for doc_type "disclosure", and template 1 was previously the default
- **THEN** template 1 SHALL have is_default=0 and template 3 SHALL have is_default=1

##### Example: Default swap
- **GIVEN** templates: T1(doc_type=disclosure, is_default=1), T2(doc_type=disclosure, is_default=0), T3(doc_type=dm, is_default=1)
- **WHEN** admin sets T2 as default
- **THEN** T1.is_default=0, T2.is_default=1, T3.is_default=1 (T3 unchanged because different doc_type)
