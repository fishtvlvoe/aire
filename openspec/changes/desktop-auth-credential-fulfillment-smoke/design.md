## Context

Desktop fullflow needs a reliable local login story before wider customer release. Customers can enter through OPCOS/OO with Google or LINE, while Desktop is a native app that should work after initial authorization without repeated manual login.

## Decisions

### Decision: OO owns identity, Desktop owns device session

OO remains the source of truth for account identity, plan, trial, entitlement and login provider. Desktop receives only a short-lived bootstrap credential or device authorization result, then stores a refreshable local session.

### Decision: One-time password is bootstrap only

If a customer uses Google or LINE on the web, OO can issue a one-time Desktop password or code. Desktop exchanges it for a device session and never asks for that one-time password again.

### Decision: Persistent session uses OS-secured storage

Desktop stores a refresh token or device session secret in macOS Keychain / Windows Credential Manager. Local app storage may keep non-secret metadata only, such as email, plan, entitlement and last refresh time.

### Decision: Customer copy avoids provider internals

Login copy should say `用網站購買的帳號登入` and `取得桌面版登入碼`; it should not expose OAuth, token, API, callback or provider implementation details.

## Implementation Contract

- Desktop login offers email/password plus a customer help path for Google/LINE website purchasers.
- A one-time Desktop password/code can be exchanged for a device session.
- Reopening the app restores the session without asking for credentials while the device session remains valid.
- Logout removes the OS-secured credential and returns to login.
- System Settings shows account email, plan/trial, entitlement and Desktop device-session status.
- Smoke tests cover first login, relaunch, logout, expired bootstrap credential and missing entitlement.

## Risks

- Device session refresh failures could lock customers out offline. Mitigation: keep a grace window and show support recovery.
- Credential handoff crosses OO and AIRE repos. Mitigation: split API contract from Desktop storage implementation and test with mocked OO responses first.
