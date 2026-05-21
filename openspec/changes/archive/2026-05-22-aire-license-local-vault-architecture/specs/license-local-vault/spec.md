## ADDED Requirements

### Requirement: cloud-license-local-data-boundary

AIRE SHALL separate cloud licensing data from customer real-estate case data.

#### Scenario: license check does not upload case data

- **GIVEN** a customer activates or revalidates an AIRE license
- **WHEN** the AIRE Client contacts AIRE Cloud
- **THEN** the request SHALL include only account, license, device, entitlement, version, and telemetry fields explicitly allowed by policy
- **AND** the request SHALL NOT include plaintext case data, owner data, land registry documents, uploaded photos, generated disclosure text, or PDF contents

### Requirement: device-bound-license-seat

AIRE SHALL bind license usage to an enrolled device before enabling protected product features.

#### Scenario: enrolled device opens AIRE

- **GIVEN** a license seat is active and bound to the current device
- **WHEN** the user opens AIRE
- **THEN** protected features SHALL be enabled according to the locally cached entitlement and cloud revalidation policy

#### Scenario: unbound device attempts to use the same license

- **GIVEN** a license seat is already bound to another device and no seat is available
- **WHEN** an unbound device attempts activation
- **THEN** AIRE SHALL reject activation or require an approved device transfer flow

### Requirement: local-interface-not-public-url

AIRE SHALL avoid exposing protected customer workflows through a shareable public URL in Phase 1.

#### Scenario: local app shell opens workflow

- **GIVEN** the user launches AIRE on an enrolled device
- **WHEN** the product UI opens
- **THEN** the interface SHALL run in the local app shell or a loopback-only local UI
- **AND** there SHALL be no public URL that another user can open from another device

#### Scenario: non-loopback access attempts local UI

- **GIVEN** AIRE uses a localhost browser UI in a future phase
- **WHEN** another device on the same network attempts to open the UI through the computer's LAN IP
- **THEN** AIRE SHALL reject the request

### Requirement: local-vault-encryption

AIRE SHALL store customer case data in an encrypted local vault controlled by the customer device.

#### Scenario: cloud is compromised

- **GIVEN** AIRE Cloud account, billing, license, or update systems are compromised
- **WHEN** an attacker accesses cloud-side data
- **THEN** the attacker SHALL NOT obtain plaintext real-estate case data from AIRE Cloud because AIRE Cloud does not store that plaintext

### Requirement: optional-ip-policy

AIRE SHALL treat IP allowlisting as an enterprise-only policy when enabled, and IP binding SHALL NOT be the default enforcement mechanism.

#### Scenario: dynamic office IP changes

- **GIVEN** a licensed device remains enrolled but the customer's public IP changes
- **WHEN** IP allowlisting is not enabled
- **THEN** AIRE SHALL continue to rely on device binding and license revalidation rather than blocking only because the public IP changed

### Requirement: aire-first-domain-launch

AIRE SHALL be launchable through an AIRE-specific product domain before the full opcOS ecosystem hub is complete.

#### Scenario: MVP launch uses AIRE product domain

- **GIVEN** the full `opcos.me` product hub is not yet implemented
- **WHEN** a customer wants to subscribe to AIRE
- **THEN** `aire.opcos.me` SHALL provide the customer-facing AIRE surface for pricing, download, checkout, license activation, and support entry points
- **AND** AIRE launch SHALL NOT be blocked by missing cross-product launcher features

### Requirement: entitlement-service-before-ecosystem

AIRE SHALL implement a narrow entitlement service before implementing a full multi-product ecosystem account hub.

#### Scenario: AIRE app validates entitlement

- **GIVEN** a customer launches the AIRE Tauri App
- **WHEN** the app checks license status
- **THEN** it SHALL call an entitlement service that returns license, seat, device, feature, expiry, and update eligibility data
- **AND** the entitlement service SHALL NOT require access to customer case plaintext

#### Scenario: future opcOS migration

- **GIVEN** AIRE already has active licenses on `aire.opcos.me`
- **WHEN** `opcos.me` later becomes a unified account hub
- **THEN** existing AIRE licenses SHALL be migratable into the shared account model without moving local case data into cloud storage
