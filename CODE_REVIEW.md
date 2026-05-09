# Code Review — AIRE

Date: 2026-05-08

Scope: broad repository review focused on auth/session behavior, listing data mutation, OCR/document generation, Electron packaging, and test/lint health.

## Executive Summary

The highest-risk issue is an auth/session split: the UI login uses NextAuth JWT, but many API routes still authorize with the legacy `session_id` cookie. This causes admin APIs to reject valid logged-in users and causes listing APIs to treat authenticated users as anonymous, which bypasses owner scoping.

Second, listing hard delete is still implemented and tested even though project rules require no hard-delete without an audit trail. Several mutation endpoints also lack schema validation and owner/admin checks.

Test and lint are currently not reliable gates because they scan generated/vendor output and have multiple real failing suites.

## Findings

### P0 — Auth/session split breaks authorization and owner isolation

Files:

- `src/app/login/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/listings/route.ts`
- `src/app/api/listings/[id]/route.ts`
- `src/app/api/admin/users/route.ts`

Evidence:

- Login page calls `signIn('credentials')`, which creates a NextAuth JWT session.
- Middleware checks `getToken(...)`.
- Most listing/admin API routes read `SESSION_COOKIE` and `getSessionUser(session_id)`.
- After NextAuth login, those APIs do not receive `session_id`, so `user` becomes `null`.

Impact:

- Admin APIs return 403 for valid NextAuth admin users.
- Listing APIs treat logged-in agents as anonymous and do not apply `owner_id` scoping.
- New listings may be created with `owner_id = null`, losing ownership and audit attribution.

Fix:

- Pick one auth model and use it everywhere.
- Recommended: create a shared server helper around `getToken({ req, secret })` that resolves the current DB user by `username`, `email`, or token subject.
- Replace `SESSION_COOKIE/getSessionUser` usage in all app-route auth checks.
- Add route tests proving agent A cannot read/update/delete/generate/extract agent B listings.

### P0 — Listing hard delete violates non-negotiable data rule

Files:

- `src/app/api/listings/[id]/route.ts`
- `src/lib/db/index.ts`
- `src/app/api/__tests__/listings-delete.test.ts`

Evidence:

- `DELETE /api/listings/[id]` calls `deleteListing`.
- `deleteListing` performs `DELETE FROM listings WHERE id = ?`.
- The test explicitly expects hard delete.

Impact:

- Violates project rule: never hard-delete a listing without an audit trail.
- Deleting the row destroys business/audit context and attached JSON metadata.

Fix:

- Remove hard-delete behavior from public listing API.
- Replace DELETE with archive/soft-delete semantics or reject with 405/409 and point clients to `/archive`.
- If permanent deletion is ever required, implement a dedicated admin-only audited purge workflow with explicit audit detail and constraints.
- Update tests to assert archive behavior, audit log entry, and preserved row.

### P0 — OCR/upload mutation routes do not enforce owner checks

Files:

- `src/app/api/listings/[id]/attachments/route.ts`
- `src/app/api/listings/[id]/extract/route.ts`
- `src/app/api/listings/[id]/field-visit/route.ts`
- `src/app/api/listings/[id]/supplementary/route.ts`
- `src/app/api/listings/[id]/generate/route.ts`
- `src/app/api/listings/[id]/regenerate/route.ts`
- `src/app/api/listings/[id]/documents/route.ts`
- `src/app/api/listings/[id]/pdf/route.ts`

Evidence:

- These endpoints generally call `getListing(id)` and proceed.
- They do not consistently verify the current authenticated user owns the listing or is admin.

Impact:

- Any authenticated user that can guess a listing id can upload attachments, trigger OCR/LLM extraction, mutate generated documents, or download documents for another user's case.

Fix:

- Introduce shared `requireListingAccess(req, listingId, permission)` helper.
- Use it in every listing-scoped route.
- Include tests for GET/mutation denial across agents.

### P1 — Request bodies are cast, not schema-validated

Files:

- `src/app/api/listings/route.ts`
- `src/app/api/listings/[id]/field-visit/route.ts`
- `src/app/api/listings/[id]/supplementary/route.ts`
- `src/app/api/listings/[id]/generate/route.ts`
- `src/app/api/listings/[id]/regenerate/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/transfer-cases/route.ts`

Evidence:

- Many handlers use `(await req.json()) as {...}` with ad hoc checks.

Impact:

- Violates project rule: validate request bodies with schemas before mutating data.
- Allows malformed payloads to reach DB/document/LLM flows.

Fix:

- Add shared validation schemas, preferably with the project's existing schema approach or a small local validator.
- Validate before every INSERT/UPDATE/DELETE.
- Return consistent `{ error, code, details }` payloads.

### P1 — Admin-created users cannot log in through NextAuth

Files:

- `src/app/api/admin/users/route.ts`
- `src/lib/auth/db.ts`
- `src/app/admin/users/page.tsx`

Evidence:

- Admin user creation inserts `email`, `password_hash`, `display_name`, `role`, but not `username`.
- NextAuth login calls `getUserByUsername`, which queries `WHERE username = ?`.

Impact:

- Newly created agent accounts may not be able to log in via the current login form.

Fix:

- Make `username` consistently populated for all users, likely equal to email.
- Add migration/backfill for existing users.
- Update create-agent route and tests.

### P1 — Generated Markdown is rendered to PDF without HTML sanitization

Files:

- `src/lib/pdf-generator/dossier.ts`
- `src/lib/pdf-generator/survey-sales.ts`

Evidence:

- LLM-generated markdown is passed to `marked(...)`.
- Resulting HTML is inserted into the PDF HTML template.

Impact:

- If generated content or user-supplied content includes raw HTML, Puppeteer renders it.
- This creates an HTML/script injection surface in PDF generation.

Fix:

- Disable raw HTML in Markdown or sanitize output before template insertion.
- Prefer a strict allowlist sanitizer.
- Add regression tests for `<script>`, event handlers, external image URLs, and dangerous links.

### P1 — LLM CLI adapters are shell-injection prone

Files:

- `src/lib/codex-client/adapters/codex.ts`
- `src/lib/codex-client/adapters/claude-code.ts`

Evidence:

- Commands are built with interpolated prompt strings:
  - `codex exec "${escaped}"`
  - `claude -p "${escaped}"`
- Only double quotes are escaped.

Impact:

- Prompt text can break shell quoting through shell metacharacters or command substitution.

Fix:

- Use `spawn`/`execFile` with argument arrays.
- Pass prompt via stdin or temp file consistently.
- Add tests containing quotes, backticks, `$()`, newlines, and semicolons.

### P1 — Electron stores OpenAI token in plaintext

Files:

- `electron/main.ts`
- `electron/preload.ts`
- `src/lib/codex-client/key-store.ts`

Evidence:

- Electron stores `~/.AIRE/openai-token.json` as raw JSON `{ token }`.
- There is already an encrypted key-store implementation elsewhere.

Impact:

- Local token is readable by filesystem access and may be included in backups or diagnostics.

Fix:

- Store token using the encrypted key-store or OS keychain.
- Restrict file permissions if file storage remains.
- Never send token back to renderer unless needed for display; prefer write-only verification flow.

### P2 — Test runner scans dependency/generated trees

Files:

- `vitest.config.ts`
- `eslint.config.mjs`

Evidence:

- `npm run test` runs tests under `license-server/node_modules`.
- `npm run lint` scans `dist-electron/.../.next/standalone` generated JS.

Impact:

- CI signal is unreliable.
- Real failures get buried under generated/vendor noise.

Fix:

- Exclude `license-server/node_modules/**`, `dist-electron/**`, `electron/build/**`, generated standalone output, and other build artifacts.
- Consider splitting root app tests and license-server tests into separate commands/configs.

### P2 — Current test suite has real failing app tests

Command:

- `npm run test`

Observed failures:

- `src/middleware.test.ts`: expected `/login`, got `/setup/admin`; test setup does not account for `hasUsers()` DB state.
- `src/app/api/auth/refresh/route.test.ts`: expects `Secure`, but route only sets secure cookie in production.
- `src/lib/external-links/__tests__/url-builder.test.ts`: expectations are stale vs implementation for 591 and Rakuya URL formats.
- `scripts/generate-license.test.ts`: mock returns `{ serialKey }`, implementation expects `{ items: [{ licenseKey }] }`.
- `src/lib/pdf-generator/__tests__/dossier.test.ts`: requires `/usr/bin/chromium`, unavailable locally.
- `src/components/__tests__/MarketLookupPanel.test.tsx`: missing `@testing-library/dom`.

Fix:

- Decide whether tests or implementation are source of truth per case.
- Mock Chromium for unit tests or configure browser path robustly.
- Add missing dependency.
- Fix fixture setup for middleware and env-sensitive cookie assertions.

### P2 — Lint config is not usable as a quality gate

Command:

- `npm run lint`

Observed:

- Over 20k lint reports, mostly from generated/vendor output.
- Real source issues include:
  - `src/app/api/listings/[id]/extract/route.ts`: `any`
  - `src/lib/ocr/index.ts`: `any`
  - `src/lib/ocr/pdf-text-layer.ts`: `@ts-ignore`
  - several React compiler hook/ref violations

Fix:

- First fix ESLint ignores so generated/vendor output is excluded.
- Then fix or intentionally configure remaining source rules.

## Verification Run

Commands run:

```bash
npm run build
npm run test
npm run lint
```

Results:

- `npm run build`: passed.
- `npm run test`: failed, 19 failed files / 15 failed tests, with vendor scan failures included.
- `npm run lint`: failed, primarily because generated/vendor output is scanned.

Build warnings:

- Next.js middleware convention is deprecated; migrate `middleware.ts` to `proxy` when practical.
- Turbopack warning around `pdfjs-dist` externalization remains.

## Prompt For Claude Code

Please fix the following in priority order. Keep changes scoped, add tests, and do not refactor unrelated UI.

1. Unify auth/session handling.
   - Current UI login uses NextAuth JWT, but API routes still read legacy `session_id`.
   - Create a shared helper that resolves the current DB user from NextAuth token.
   - Replace `SESSION_COOKIE/getSessionUser` checks in listing/admin app routes.
   - Ensure admin routes work after `signIn('credentials')`.
   - Ensure agents are scoped to their own listings.

2. Remove listing hard-delete behavior.
   - `DELETE /api/listings/[id]` currently calls `deleteListing` and performs `DELETE FROM listings`.
   - Replace with archive/soft-delete behavior or reject DELETE and use existing `/archive`.
   - Preserve audit logging.
   - Update `listings-delete.test.ts` accordingly.

3. Add listing access enforcement to every listing-scoped route.
   - Cover attachments, extract, field-visit, supplementary, generate, regenerate, documents, and PDF routes.
   - Admin can access all; agent can access only owned listings.
   - Add cross-agent denial tests.

4. Add schema validation before every mutating route.
   - Start with listing create/update, field visit, supplementary, generate/regenerate, admin users, transfer cases.
   - Return consistent `{ error, code, details }` payloads.

5. Fix admin-created users so they can log in.
   - Populate/backfill `username`, likely using email.
   - Ensure `getUserByUsername` works for newly created agents.
   - Add tests for admin creates agent → agent can authenticate.

6. Harden PDF and LLM execution security.
   - Sanitize or disallow raw HTML from Markdown before Puppeteer render.
   - Replace shell string `exec` calls in Codex/Claude adapters with `spawn`/`execFile` argument arrays or stdin.
   - Add injection regression tests.
   - Stop storing Electron OpenAI token in plaintext; use encrypted local storage or OS keychain.

7. Restore CI signal.
   - Update `vitest.config.ts` and `eslint.config.mjs` to exclude generated/vendor/build artifacts:
     `license-server/node_modules/**`, `dist-electron/**`, `electron/build/**`, `.next/**`, standalone output.
   - Fix remaining real test failures:
     middleware DB setup, refresh cookie env expectation, external URL tests/implementation mismatch, generate-license response shape, Chromium unit-test mocking, missing `@testing-library/dom`.
   - Run `npm run lint`, `npm run test`, and `npm run build`.

Acceptance criteria:

- `npm run build` passes.
- `npm run test` passes without scanning dependency or generated build trees.
- `npm run lint` passes or has only explicitly accepted warnings.
- Agent A cannot read or mutate Agent B's listings.
- No route can hard-delete a listing without an explicit audited admin-only purge flow.
