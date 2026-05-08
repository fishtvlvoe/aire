## MODIFIED Requirements

### Requirement: Sidebar displays admin management section

The Sidebar component SHALL display an admin management section containing links to user management (/admin/users) and feature settings (/admin/features). This section MUST only be visible when the current user has the admin role.

#### Scenario: Admin user sees admin section
- **WHEN** a user with role "admin" views the sidebar
- **THEN** the sidebar SHALL display an admin section with links to "/admin/users" (user management) and "/admin/features" (feature settings)

#### Scenario: Non-admin user does not see admin section
- **WHEN** a user with role "agent" views the sidebar
- **THEN** the sidebar SHALL NOT display the admin management section

#### Scenario: Admin clicks user management link
- **WHEN** an admin user clicks the user management link in the sidebar
- **THEN** the browser SHALL navigate to /admin/users
