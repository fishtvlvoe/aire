## ADDED Requirements

### Requirement: is-vendor-column

The users table SHALL include an `is_vendor` column (INTEGER NOT NULL DEFAULT 0) to distinguish vendor accounts from regular user accounts.

#### Scenario: schema migration adds is_vendor

- **WHEN** the migration `005_vendor_account.sql` runs
- **THEN** the users table gains an `is_vendor` column with default value 0, and all existing user records have `is_vendor = 0`
