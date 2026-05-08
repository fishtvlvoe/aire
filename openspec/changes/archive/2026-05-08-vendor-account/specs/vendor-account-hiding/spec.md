## ADDED Requirements

### Requirement: hide-vendor-from-user-list

All user management queries that return user lists for client-facing UI SHALL exclude records where `is_vendor = 1`.

#### Scenario: admin views user list

- **WHEN** a client admin navigates to the user management page
- **THEN** the user list does NOT include any vendor accounts (is_vendor = 1)

##### Example: vendor hidden from user list

- **GIVEN** users table contains: `[{id:1, username:"admin", is_vendor:0}, {id:2, username:"agent1", is_vendor:0}, {id:3, username:"vendor-fish", is_vendor:1}]`
- **WHEN** the admin user list API is called
- **THEN** the response contains only users with id 1 and 2; user id 3 is not included

### Requirement: vendor-can-login-normally

A vendor account SHALL be able to authenticate through the standard login form using the same NextAuth CredentialsProvider flow as regular users.

#### Scenario: vendor logs in

- **WHEN** a vendor enters their username and password on the login page
- **THEN** the system authenticates them as an admin user and grants full admin access

##### Example: vendor login succeeds

- **GIVEN** users table contains a vendor account: `{username: "vendor-fish", password_hash: "$2b$10$abc...", role: "admin", is_vendor: 1}`
- **WHEN** the vendor submits username `"vendor-fish"` and the correct password
- **THEN** `authorizeCredentials()` returns `{id: "3", name: "vendor-fish"}` and a JWT token is issued with admin role

### Requirement: vendor-count-excluded-from-setup-check

The `hasUsers()` check in middleware (used to determine whether to redirect to first-admin-setup) SHALL count all users including vendor accounts. This prevents the edge case where only a vendor account exists but the system still prompts for first admin creation.

#### Scenario: only vendor account exists

- **WHEN** the users table contains only a vendor account (is_vendor = 1) and no regular users
- **THEN** `hasUsers()` returns true, and the system does NOT redirect to the first-admin-setup page
