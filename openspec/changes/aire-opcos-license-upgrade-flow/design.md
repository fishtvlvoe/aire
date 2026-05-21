## Context

AIRE 已完成 `aire.opcos.me` 子網站與 OPCOS 帳號中心入口，但目前未授權使用者進入 `/products/aire?intent=request-access` 時，只看到前端訊息，後端沒有保存申請，也沒有 admin 從申請核發授權的流程。OPCOS 既有 Prisma schema 已有 `License` 與 `DeviceActivation`，admin 也已有手動建立 license 的頁面；缺口是升級申請狀態、申請與核發的關聯、以及 AIRE desktop 與 OPCOS license API 的 production contract 對齊。

AIRE desktop 現有 `src-tauri/src/opcos.rs` 會送出 snake_case 欄位 `{ license_key, device_id, device_name, os_version }`，OPCOS production API 目前接受 camelCase `{ licenseKey, deviceFingerprint, deviceName, allowedIp }` 與 `{ licenseKey, deviceFingerprint, currentIp }`。這個欄位差異會讓實際啟用失敗，因此本 SR 將欄位契約與 base URL 一併收斂。

## Goals / Non-Goals

**Goals:**

- 建立可持久化的 AIRE 升級申請資料模型，保存 user、organization、product、plan、status、處理人與處理時間。
- 讓登入使用者能從 OPCOS AIRE 產品頁送出升級申請，並看到 `尚未申請`、`審核中`、`已開通`、`已拒絕` 狀態。
- 讓 OPCOS admin 能從後台看到待處理申請，核發 AIRE VIP license，並讓申請狀態與 license 建立保持一致。
- 讓 OPCOS license activate/verify API 與 AIRE desktop client 使用同一份 production contract，成功時能啟用裝置並更新最後驗證時間。
- 讓 AIRE 設定頁升級入口開啟 OPCOS AIRE 產品管理頁，而不是尚未接金流的 checkout。

**Non-Goals:**

- 不串接金流、訂閱扣款、webhook、退款或發票。
- 不建立雲端案件資料庫，不同步 AIRE 本機案件資料。
- 不改變 AIRE 離線 grace 的核心策略，只確保線上 verify contract 可用。
- 不加入新的第三方依賴。

## Decisions

### Decision: Use OPCOS database as upgrade request source of truth

新增 `AireUpgradeRequestStatus` enum 與 `AireUpgradeRequest` model，放在 OPCOS Prisma schema。資料表以 `(userId, organizationId, productId, planId, status)` 支援查詢，但唯一性由程式控制：同一 user/organization/product/plan 若已有 `PENDING` 申請，不重複建立。

DDL:

```sql
CREATE TYPE "AireUpgradeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');

CREATE TABLE "aire_upgrade_request" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL DEFAULT 'aire',
  "planId" TEXT NOT NULL DEFAULT 'vip',
  "status" "AireUpgradeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "licenseId" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "aire_upgrade_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "aire_upgrade_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "aire_upgrade_request_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "license"("id") ON DELETE SET NULL
);

CREATE INDEX "aire_upgrade_request_user_org_product_plan_status_idx"
  ON "aire_upgrade_request" ("userId", "organizationId", "productId", "planId", "status");

CREATE INDEX "aire_upgrade_request_status_requestedAt_idx"
  ON "aire_upgrade_request" ("status", "requestedAt");
```

Alternatives Considered:

- Reuse `License` only and infer intent from absence of license: rejected because admin cannot distinguish no interest from pending upgrade request.
- Store pending requests in query string or notification metadata: rejected because it is not auditable and cannot drive admin fulfillment tests.

### Decision: Fulfillment creates a real License, not a temporary flag

Admin approval creates a normal `License` row with `productId='aire'`, `planId='vip'`, `maxDevices` from admin input, and links `AireUpgradeRequest.licenseId` to the created license. User-facing AIRE product page reads the same active license query that gates download access.

Alternatives Considered:

- Add an `isVipTester` boolean on user: rejected because AIRE entitlement is organization/license scoped and must support device limits.
- Return a one-off serial without creating a `License` row: rejected because activate/verify already depend on `License` and `DeviceActivation`.

### Decision: License API accepts production desktop payload and returns desktop-compatible status

OPCOS license APIs SHALL accept camelCase fields as canonical and also accept current AIRE snake_case aliases during migration. Activate accepts `licenseKey` or `license_key`, `deviceFingerprint` or `device_id`, and derives `allowedIp` from request headers when explicit IP is absent. Verify accepts the same key/device aliases and derives `currentIp` from request headers when explicit IP is absent. Success responses include both OPCOS shape and AIRE desktop shape: activate returns `{ success: true, activationId, status: 'active', token, valid_until }`; verify returns `{ valid: true, status: 'active', valid_until, last_verified_at, license }`.

Alternatives Considered:

- Change only AIRE desktop to match existing OPCOS API: rejected because existing API requires client-provided IP and does not return the token/status fields AIRE persists today.
- Keep only snake_case contract: rejected because OPCOS web/TypeScript code already uses camelCase and external API contracts should remain JavaScript-native while tolerating desktop aliases.

### Decision: Production license base URL is `https://opcos.me`

AIRE release builds SHALL use `https://opcos.me` for `/api/license/activate` and `/api/license/verify`. `https://aire.opcos.me` remains the AIRE product subsite, not the canonical license API host. Existing `OPCOS_API_BASE_URL` remains a development/test override.

Alternatives Considered:

- Use `https://aire.opcos.me` for license API: rejected because the subsite is a marketing/download surface and current production license API is under OPCOS.
- Use `https://opcos.example.com` as fallback: rejected for release because it makes production builds unusable without manual override.

### Decision: AIRE settings upgrade CTA opens OPCOS product management

`subscribe_premium()` or the equivalent settings CTA SHALL return/open `https://opcos.me/products/aire?intent=request-access` for non-admin users who are not subscribed. This keeps the desktop UI honest while payment is not connected.

Alternatives Considered:

- Keep pointing to a checkout URL: rejected because payment is explicitly out of scope for this SR.
- Hide the CTA entirely: rejected because users need a discoverable upgrade path that creates a backend request.

## Implementation Contract

### User upgrade request behavior

- Logged-in OPCOS users on `/products/aire` without active AIRE license see an enabled CTA labeled `申請升級或 VIP 測試`.
- Activating the CTA creates or reuses one pending `AireUpgradeRequest` for the current user, current organization, `productId='aire'`, and `planId='vip'`.
- After submission, `/products/aire` displays `審核中` state and does not expose the restricted installer direct link or full license key.
- If the user already has an active AIRE license, request submission is skipped and the page displays `已開通` with masked serial, download CTA, and device summary.
- Empty or missing organization resolves to the user's first membership; if no membership exists, the page displays a blocking message and the request API returns HTTP 400 or ORPC BAD_REQUEST.

### Admin fulfillment behavior

- OPCOS admin license area includes a pending AIRE requests view with requester email, organization, requestedAt formatted in zh-TW, desired plan, and actions.
- Approving a pending request creates a `License`, links it to the request, sets request status to `FULFILLED`, stores `decidedAt` in UTC timestamp generated by the server, and records `decidedByUserId`.
- Rejecting a pending request sets status to `REJECTED`, stores `decidedAt`, and does not create a `License`.
- Approving an already fulfilled/rejected request returns a conflict error and does not create a second license.
- Existing manual `Grant AIRE VIP` license creation remains available.

### License API contract

- `POST /api/license/activate` accepts `{ licenseKey, deviceFingerprint, deviceName }` and `{ license_key, device_id, device_name, os_version }`.
- Activate derives IP from `x-forwarded-for`, `x-real-ip`, or request metadata when the body omits `allowedIp`; explicit `allowedIp` remains accepted for tests.
- Activate returns HTTP 200 with `success: true`, `activationId`, `status: 'active'`, `token`, and `valid_until` for a valid active license with device capacity.
- Activate returns HTTP 422 with `error: 'invalid_key'` for unknown license keys, HTTP 403 with `error: 'revoked'` or `error: 'expired'` for inactive licenses, and HTTP 409 with `error: 'quota_exhausted'` for max-device exhaustion.
- `POST /api/license/verify` accepts `{ licenseKey, deviceFingerprint }` and `{ license_key, device_id }`.
- Verify derives IP using the same strategy as activate when `currentIp` is absent.
- Verify returns HTTP 200 with `valid: true`, `status: 'active'`, `valid_until`, `last_verified_at`, and `license.productId='aire'` when license, device, and IP match.
- Verify returns HTTP 422 `invalid_key`, HTTP 401 `revoked`, HTTP 403 `expired`, HTTP 403 `device_mismatch`, HTTP 403 `ip_blocked`, and HTTP 429 `rate_limited` using lowercase `error` codes for AIRE desktop mapping.

### AIRE desktop behavior

- Release build uses `https://opcos.me` as the default OPCOS API base URL.
- Development and tests can override the base with `OPCOS_API_BASE_URL`.
- `src-tauri/src/opcos.rs` sends the production-compatible payload and parses the success/error shapes above.
- The activation IPC continues writing `license_key` and `license_token` to keychain and non-sensitive status to SQLite settings.
- No customer case data, property address, land number, PDF content, or owner information is sent during activate or verify.

### Verification targets

- AIRE SR artifacts pass `spectra analyze aire-opcos-license-upgrade-flow --json` with no Critical or Warning findings and `spectra validate aire-opcos-license-upgrade-flow`.
- OPCOS package tests cover request creation, duplicate pending request reuse, admin fulfillment, license API alias payloads, and product page state.
- AIRE Rust tests cover default base URL, request payload serialization, and error-code mapping.
- Production smoke after deploy verifies `https://opcos.me/products/aire` still requires login, license API rejects invalid keys with the documented lowercase code, and an admin-granted test key can activate then verify.

## Risks / Trade-offs

- [Risk] Two repos must ship in coordination → Mitigation: keep SR in AIRE, but list OPCOS paths explicitly and commit each repo separately with linked commit messages.
- [Risk] Prisma migration can break production if generated client is stale → Mitigation: run database codegen/type-check/tests before deploy and verify migration output before push.
- [Risk] IP derivation behind Vercel proxies can be wrong → Mitigation: prefer `x-forwarded-for` first public value, accept explicit IP only in tests, and cover helper behavior with unit tests.
- [Risk] Supporting both camelCase and snake_case aliases expands API surface → Mitigation: document camelCase as canonical and keep alias support only for AIRE desktop compatibility.
- [Risk] Admin accidentally approves twice → Mitigation: fulfillment runs in a transaction and refuses non-PENDING requests.

## Migration Plan

1. Add OPCOS Prisma enum/model and migration for `aire_upgrade_request`.
2. Add OPCOS API/procedures and UI for request creation, request list, approve, and reject.
3. Update OPCOS license activate/verify API contract and tests.
4. Update AIRE desktop client base URL and payload parsing.
5. Run OPCOS tests/type-check and AIRE Rust/tests relevant to license client.
6. Deploy OPCOS first so production API accepts both old and new payloads.
7. Build/test AIRE against `https://opcos.me`.

Rollback strategy:

- If OPCOS deployment fails before migration, revert code deploy only.
- If migration succeeds but UI/API fails, keep the table in place and revert app code; unused `aire_upgrade_request` rows do not affect existing `License` activate/verify.
- If activate/verify changes fail, restore previous API handlers while retaining alias tests as failing regression evidence, then patch forward.

## Open Questions

- Payment provider and paid checkout path are intentionally unresolved and excluded from this SR.
- Final AIRE installer download asset URL remains controlled by existing `AIRE_MAC_DOWNLOAD_URL`; this SR only gates visibility and entitlement.
