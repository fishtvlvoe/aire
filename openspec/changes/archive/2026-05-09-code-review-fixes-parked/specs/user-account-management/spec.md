## MODIFIED Requirements

### Requirement: Admin-created users have username populated

When an admin creates a new user, the system SHALL set `username` to the user's email if no username is explicitly provided.

#### Scenario: Admin creates agent without username

- **WHEN** admin POST /api/admin/users with `{ email: "agent@example.com", password: "...", role: "agent" }`
- **THEN** the created user has `username = "agent@example.com"`
- **THEN** the agent can log in using `username = "agent@example.com"` via NextAuth credentials

### Requirement: Backfill existing users

Existing users with null username SHALL be backfilled with their email as username via a migration script.

#### Scenario: Existing user with null username

- **WHEN** the migration script runs and finds a user with `username = null` and `email = "old@example.com"`
- **THEN** the user's username is set to `"old@example.com"`

#### Scenario: Existing user with username already set

- **WHEN** the migration script runs and finds a user with `username = "admin"` and `email = "admin@example.com"`
- **THEN** the user's username remains `"admin"` (not overwritten)
