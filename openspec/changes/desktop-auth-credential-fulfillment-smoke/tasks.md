## 1. Account Fulfillment Contract

- [ ] 1.1 Implement Requirement: Desktop credential fulfillment and decision: OO owns identity, Desktop owns device session by defining the OO → Desktop contract for Google/LINE website purchasers; verify with contract tests.
- [ ] 1.2 Implement decision: customer copy avoids provider internals by adding a Desktop login help entry for customers without a password; verify visible copy is customer-readable and avoids OAuth/token/API wording.
- [ ] 1.3 Implement decision: one-time password is bootstrap only by adding one-time password/code exchange mock and failure states; verify expired/used/entitlement-missing paths.

## 2. Persistent Desktop Session

- [ ] 2.1 Implement Requirement: Persistent Desktop device session and decision: persistent session uses OS-secured storage by storing Desktop session secret in macOS Keychain and Windows Credential Manager; verify secret is not stored in localStorage/plain files.
- [ ] 2.2 Restore session on app launch and redirect to `/cases/new`; verify app relaunch keeps the user signed in.
- [ ] 2.3 Logout clears the OS credential and local metadata; verify next launch returns to login.

## 3. Settings and Smoke Evidence

- [ ] 3.1 Implement Requirement: Auth status in settings by showing account, plan/trial, entitlement and device-session status in System Settings; verify active/expired/not-configured states.
- [ ] 3.2 Add macOS and Windows smoke covering first login, relaunch, logout and PDF flow after restored session.
- [ ] 3.3 Update release acceptance checklist with auth evidence requirements; verify Spectra analyze/validate has 0 Critical/0 Warning.
