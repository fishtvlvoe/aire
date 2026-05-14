## ADDED Requirements

### Requirement: License Verification via Unified Backend

License verification SHALL be performed by the Supastarter backend on Zeabur, replacing the standalone Vercel-hosted license server.

#### Scenario: AIRE desktop license activation

- WHEN a user enters a license serial number in the AIRE desktop app
- THEN the app SHALL send a POST request to the Zeabur backend at /api/license/activate
- AND the backend SHALL validate the serial, bind it to the machine ID, and return activation status
- AND the response SHALL include the license tier and feature flags

##### Example:

User enters serial "AIRE-2026-ABCD-1234" on machine with ID "mac-arm64-a1b2c3". POST to https://api.aire.tw/api/license/activate with body {"serial": "AIRE-2026-ABCD-1234", "machineId": "mac-arm64-a1b2c3"}. Response: {"status": "activated", "tier": "professional", "features": ["pdf", "ocr", "multi-listing"], "expiresAt": "2027-05-10T00:00:00Z"}.

#### Scenario: License check on app startup

- WHEN the AIRE desktop app starts
- THEN it SHALL verify the cached license with the Zeabur backend
- AND if the backend is unreachable, it SHALL allow a grace period of 7 days using the cached license

##### Example:

App starts, sends GET to https://api.aire.tw/api/license/verify with cached token. Backend returns 200 with {"valid": true, "daysRemaining": 180}. If backend returns network error (ECONNREFUSED), app checks local cache timestamp "2026-05-08T10:00:00Z" — within 7 days, so app launches normally with offline indicator.

#### Scenario: License transfer between machines

- WHEN an admin requests a license transfer via the admin dashboard
- THEN the Supastarter backend SHALL unbind the old machine and allow reactivation on a new machine

##### Example:

Admin clicks "Transfer License" for serial "AIRE-2026-ABCD-1234" in the Supastarter admin dashboard. Backend sets machineId to null and activationCount to 0 for that serial. The user can now activate the same serial on a different machine via the AIRE desktop app.

### Requirement: License Billing Integration

License management SHALL be integrated with Supastarter billing module for subscription and payment tracking.

#### Scenario: New license purchase

- WHEN a customer purchases a license through the billing portal
- THEN the Supastarter backend SHALL generate a serial number and associate it with the customer organization
- AND send the serial via email using the Supastarter email template system

##### Example:

Customer pays NT$3,600/year via Stripe checkout. Stripe webhook fires event "checkout.session.completed" with metadata {"orgId": "org_abc123"}. Backend generates serial "AIRE-2026-EFGH-5678", inserts into licenses table with orgId, sends email to customer@example.com with subject "您的 AIRE 授權序號" containing the serial and activation instructions.

#### Scenario: License renewal

- WHEN a license subscription renews via Stripe/Lemon Squeezy
- THEN the backend SHALL automatically extend the license expiration date
- AND the AIRE desktop app SHALL reflect the updated status on next verification

##### Example:

Stripe fires "invoice.payment_succeeded" for subscription "sub_xyz789". Backend finds the associated serial "AIRE-2026-ABCD-1234", extends expiresAt from "2027-05-10" to "2028-05-10". Next time the AIRE desktop app calls /api/license/verify, it receives the updated expiresAt and updates the local cache.
