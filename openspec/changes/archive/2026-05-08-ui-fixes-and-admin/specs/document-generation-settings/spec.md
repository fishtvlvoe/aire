## ADDED Requirements

### Requirement: Admin feature settings page controls document generation types

The system SHALL provide an admin-only settings page at /admin/features that lists all available document generation types. Only users with the admin role SHALL be able to access and modify these settings.

#### Scenario: Admin accesses feature settings
- **WHEN** an admin user navigates to /admin/features
- **THEN** the page SHALL display toggles for 5 document types: 不動產說明書, 物調表, 銷售 DM, 591 文案, 社群貼文

#### Scenario: Non-admin denied access
- **WHEN** a non-admin user attempts to navigate to /admin/features
- **THEN** the system SHALL redirect to the listings page or display an unauthorized message

#### Scenario: Admin enables a document type
- **WHEN** an admin toggles a document type to enabled and saves
- **THEN** the document generation page SHALL include that type as an available option for all users

#### Scenario: Admin disables a document type
- **WHEN** an admin toggles a document type to disabled and saves
- **THEN** the document generation page SHALL NOT show that type as an available option
