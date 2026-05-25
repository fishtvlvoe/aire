## ADDED Requirements

### Requirement: Desktop credential fulfillment

AIRE Desktop SHALL provide a login path for customers whose website account was created with Google or LINE. The Desktop login method SHALL be issued from OO/AIRE account entitlement and SHALL not require the customer to invent a permanent password manually.

#### Scenario: Google or LINE purchaser receives a Desktop login method

- **WHEN** a website-authenticated customer opens the Desktop login help path
- **THEN** the customer SHALL be able to request a one-time Desktop password/code
- **AND** the code SHALL be tied to the customer's AIRE entitlement

##### Example:

- **GIVEN** `fish@example.com` purchased AIRE with Google login and has active entitlement
- **WHEN** the customer requests a Desktop login code
- **THEN** OO issues a one-time code scoped to `fish@example.com`
- **AND** Desktop can exchange that code for a device session

### Requirement: Persistent Desktop device session

AIRE Desktop SHALL persist a device session after successful login so reopening the app does not require credentials every time.

#### Scenario: App relaunch restores session

- **WHEN** a customer signs in successfully and closes the Desktop app
- **THEN** the next launch SHALL restore the session from OS-secured storage
- **AND** the app SHALL open the main Desktop workflow without asking for the password again

##### Example:

- **GIVEN** `fish@example.com` completed Desktop login on macOS and a session secret exists in Keychain
- **WHEN** the customer closes and reopens AIRE Desktop
- **THEN** Desktop restores the account session
- **AND** the first route is `/cases/new`

#### Scenario: Logout clears session

- **WHEN** the customer logs out
- **THEN** the OS-secured Desktop credential SHALL be removed
- **AND** the next launch SHALL return to the login page

##### Example:

- **GIVEN** a Windows Desktop session secret exists in Credential Manager
- **WHEN** the customer clicks logout
- **THEN** the Credential Manager entry is removed
- **AND** the next launch shows the login screen

### Requirement: Auth status in settings

System Settings SHALL show account email, plan/trial, AIRE entitlement and Desktop device-session status.

#### Scenario: Missing entitlement blocks Desktop use

- **WHEN** the account is valid but does not have AIRE entitlement
- **THEN** Desktop SHALL show a customer-readable entitlement error
- **AND** the app SHALL not open the full Desktop workflow

##### Example:

- **GIVEN** `buyer@example.com` has an OO account but no AIRE entitlement
- **WHEN** the account exchanges a Desktop login code
- **THEN** Desktop shows `此帳號尚未啟用 AIRE 桌面版`
- **AND** `/cases/new` is not opened
