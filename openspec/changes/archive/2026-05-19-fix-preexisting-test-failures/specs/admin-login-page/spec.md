# Admin Login Page

## MODIFIED Requirements

### Requirement: Post-Login Redirect Target

**Status**: Modified

**Previously**: After successful login, the page redirected to `/cases`.

**Updated**: After successful login, `router.push("/dashboard")` SHALL be called so that the user lands on the dashboard.

**Acceptance Criteria**:
- `login/page.tsx` calls `router.push("/dashboard")` on successful `mockInvoke("login", ...)` response
- Test `"successful login — calls mockInvoke and redirects to /dashboard"` passes
