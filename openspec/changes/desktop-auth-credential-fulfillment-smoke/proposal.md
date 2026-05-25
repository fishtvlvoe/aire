## Summary

Desktop customers may buy or sign in on the website with Google or LINE, but the current Desktop login only accepts email and password. This change defines the account-credential fulfillment path for Desktop without forcing customers to reset or type credentials every launch.

## Problem

- Google/LINE-only customers do not naturally have a Desktop password.
- A one-time password can bootstrap local login, but the app must keep a durable device session afterward.
- The login page needs clear customer language for web-purchased accounts, entitlement, and support recovery.

## Goals

- Let website-authenticated customers request or receive a Desktop login method.
- Support one-time bootstrap password or magic-code login from the OO/AIRE account surface.
- Persist an authenticated Desktop device session securely so customers do not re-login every app launch.
- Expose device/session status in System Settings.
- Add smoke/E2E coverage for first login, restart, logout, expired code, and entitlement failure.

## Non-Goals

- Do not make SaaS the primary AIRE workflow.
- Do not store Google/LINE OAuth tokens in the Desktop app.
- Do not bypass AIRE entitlement or customer plan checks.
