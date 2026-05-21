# settings-premium-unlock Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Premium unlock section display

The Settings page SHALL display a PremiumUnlockSection card as the third section.

- **WHEN** the user navigates to the Settings page
- **THEN** the system SHALL display the premium subscription status by calling `get_premium_status()`

#### Scenario: Not subscribed

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A heading "實價登錄 MCP Hub"
  - A description of the premium feature capabilities
  - A price or upgrade indication that does not imply payment is already connected
  - A "前往升級" CTA button

##### Example: Unsubscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: false, plan: null, expires_at: null }`
- **WHEN** PremiumUnlockSection renders
- **THEN** heading text is "實價登錄 MCP Hub"
- **THEN** "前往升級" button is visible and enabled

#### Scenario: Upgrade redirect

- **GIVEN** the premium status `subscribed` is `false`
- **WHEN** the user clicks "前往升級"
- **THEN** the system SHALL call `subscribe_premium()`
- **THEN** the system SHALL open the returned `redirect_url` in the system browser
- **THEN** the URL SHALL point to `https://opcos.me/products/aire?intent=request-access`

##### Example: Upgrade click

- **GIVEN** `subscribe_premium` returns `{ redirect_url: "https://opcos.me/products/aire?intent=request-access" }`
- **WHEN** user clicks "前往升級"
- **THEN** system browser opens `"https://opcos.me/products/aire?intent=request-access"`

#### Scenario: Already subscribed

- **GIVEN** the premium status `subscribed` is `true` with plan `"mcp-hub-monthly"` and expires_at `"2026-07-01T00:00:00+08:00"`
- **WHEN** the user views the PremiumUnlockSection
- **THEN** the system SHALL display:
  - A green Badge "訂閱中"
  - Plan name "MCP Hub 月費方案"
  - Expiration date in ROC format
  - A "管理訂閱" link

##### Example: Subscribed state

- **GIVEN** `get_premium_status` returns `{ subscribed: true, plan: "mcp-hub-monthly", expires_at: "2026-07-01T00:00:00+08:00" }`
- **WHEN** PremiumUnlockSection renders
- **THEN** Badge shows "訂閱中" in green
- **THEN** plan text shows "MCP Hub 月費方案"
- **THEN** "管理訂閱" link is visible

#### Scenario: Admin sees unlocked state

- **WHEN** an admin user with `role === "admin"` navigates to 設定 > 進階功能
- **THEN** the 實價登錄 MCP Hub card SHALL render with label "已啟用（管理員）"
- **THEN** the "前往升級" button SHALL NOT be present in the DOM

##### Example: Admin state

- **GIVEN** sessionUser is `{ email: "admin@test.aire", role: "admin" }`
- **WHEN** PremiumUnlockSection renders
- **THEN** the card shows "已啟用（管理員）"
- **THEN** no button with text "前往升級" exists

#### Scenario: Non-admin still sees upgrade gate

- **WHEN** a non-admin user with `role !== "admin"` navigates to 設定 > 進階功能
- **WHEN** the user does not have an active subscription
- **THEN** the MCP Hub card SHALL show the "前往升級" button

##### Example: Staff state

- **GIVEN** sessionUser is `{ email: "staff@test.aire", role: "staff" }` and subscription is null
- **WHEN** PremiumUnlockSection renders
- **THEN** the card shows "前往升級" button


<!-- @trace
source: aire-opcos-license-upgrade-flow
updated: 2026-05-21
code:
  - 0520/不動產說明書/0417-old/建物物調表-母版.dot
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/types.ts
  - e2e/results/license-verification.json
  - 0520/supastarter-nextjs-main/tooling/typescript/nextjs.json
  - 0520/supastarter-nextjs-main/packages/payments/lib/customer.ts
  - playwright-results/opcos-live/post-onboarding-_settings.png
  - playwright-results/opcos-live/verified-_products.png
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/legal/[...path]/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.txt/route.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/active-organization-context.ts
  - docs/opcos-saas/supastarter-reference.md
  - 0520/supastarter-nextjs-main/packages/mail/provider/index.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.mdx/[[...slug]]/route.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/messages.ts
  - 0520/supastarter-nextjs-main/packages/ai/client.ts
  - 0520/supastarter-nextjs-main/packages/i18n/package.json
  - 0520/supastarter-nextjs-main/packages/ui/components/chart.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/components/logo.tsx
  - 0520/不動產說明書-bug/陳世曉-謄本.pdf
  - 0520/不動產說明書/8.JPG
  - 0520/supastarter-nextjs-main/apps/docs/app/global.css
  - 0520/不動產說明書/建物物調表-母版.pdf
  - 0520/不動產說明書/0417-old/不動產說明書4.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Footer.tsx
  - playwright-results/opcos-live/mobile-public-_.png
  - 0520/supastarter-nextjs-main/packages/ui/components/button.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationList.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/signup/page.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/tooltip.tsx
  - 0520/supastarter-nextjs-main/packages/ui/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/components/form.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/find-organization.ts
  - 0520/不動產說明書/7.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentProvider.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/proxy.ts
  - 0520/不動產說明書-bug/S__23011334.jpg
  - 0520/不動產說明書/99-土地-現況調查表-1.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/umami/index.tsx
  - 0520/supastarter-nextjs-main/packages/storage/provider/index.ts
  - 0520/不動產說明書/0417-old/商業地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/pirsch/index.tsx
  - 0520/不動產說明書/0417-old/不動產說明書2.pdf
  - 0520/不動產說明書/5.JPG
  - 0520/supastarter-nextjs-main/packages/mail/config.ts
  - 0520/supastarter-nextjs-main/tooling/scripts/src/create-user.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/page.tsx
  - playwright-results/opcos-live/mailtm-signup-filled.png
  - playwright-results/opcos-live/post-onboarding-flow-report.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginModeSwitch.tsx
  - 0520/supastarter-nextjs-main/packages/ai/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/server.ts
  - playwright-results/aire-dom-ux-sdd-workbench-1728.png
  - 0520/不動產說明書/9-8+9.JPG
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/sqlite.ts
  - e2e/results/results.json
  - docs/opcos-saas/00-overview.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/use-session.ts
  - 0520/supastarter-nextjs-main/packages/auth/client.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlanBadge.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/session-context.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma.config.ts
  - 0520/supastarter-nextjs-main/tooling/scripts/tsconfig.json
  - 0520/supastarter-nextjs-main/pnpm-workspace.yaml
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTile.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/drizzle.config.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/mailgun.ts
  - 0520/supastarter-nextjs-main/turbo.json
  - 0520/supastarter-nextjs-main/.oxlintrc.json
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersBlock.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/update-preference.ts
  - docs/opcos-saas/opcos-vision.md
  - 0520/supastarter-nextjs-main/packages/i18n/types.ts
  - 0520/supastarter-nextjs-main/packages/ai/lib/prompts.ts
  - 0520/supastarter-nextjs-main/apps/marketing/playwright.config.ts
  - 0520/supastarter-nextjs-main/packages/api/vitest.config.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/postgres.ts
  - 0520/不動產說明書/10-房屋-現況調查表-1.JPG
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64.dmg
  - 0520/不動產說明書/0417-old/大樓華廈_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingAccountStep.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/custom/index.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/mail.json
  - AGENTS.md
  - 0520/supastarter-nextjs-main/apps/docs/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/list-purchases.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/client.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentBanner.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NavBar.tsx
  - 0520/supastarter-nextjs-main/packages/notifications/src/resolve-link.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/package.json
  - 0520/不動產說明書/0417-old/不動產說明說16.pdf
  - 0520/不動產說明書/0417-old/公寓_秘書後補清單.docx
  - 0520/不動產說明書/6.JPG
  - 0520/supastarter-nextjs-main/apps/saas/next.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AppWrapper.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - 0520/不動產說明書/0417-old/農地_秘書後補清單.docx
  - playwright-results/aire-dom-ux-sdd-preview-1728.png
  - playwright-results/opcos-live/route-_products.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.ts
  - 0520/supastarter-nextjs-main/tooling/tailwind/theme.css
  - 0520/不動產說明書/99-土地-現況調查表-3.JPG
  - 0520/supastarter-nextjs-main/packages/payments/lib/helper.ts
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/image-proxy/[...path]/route.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.mdx
  - 0520/supastarter-nextjs-main/agents.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/NotificationPreferencesForm.tsx
  - 0520/supastarter-nextjs-main/packages/utils/index.ts
  - 0520/supastarter-nextjs-main/apps/mail-preview/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/legal/lib/pages.ts
  - 0520/不動產說明書/0417-old/周遭.pdf
  - 0520/不動產說明書/0417-old/廠房_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeNameForm.tsx
  - 0520/不動產說明書/0417-old/建地_住宅地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/mdx-components.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/posts.ts
  - 0520/supastarter-nextjs-main/apps/docs/mdx-components.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlan.tsx
  - playwright-results/opcos-live/auth-pages-discovery.json
  - playwright-results/opcos-live/negative-signup-weak-password.png
  - 0520/supastarter-nextjs-main/packages/ui/components/select.tsx
  - 0520/supastarter-nextjs-main/packages/api/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/index.ts
  - playwright-results/opcos-live/route-_login.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/types.ts
  - 0520/supastarter-nextjs-main/packages/mail/lib/translations.ts
  - playwright-results/opcos-live/post-onboarding-_products.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/purchases.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - 0520/supastarter-nextjs-main/packages/notifications/src/index.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/plausible/index.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/next.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-client.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/router.ts
  - docs/opcos-saas/03-wp-plugin-reverse-engineering.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/ai/components/AiChat.tsx
  - 0520/supastarter-nextjs-main/packages/auth/config.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/get-preferences.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/purchases.ts
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.de.md
  - 0520/supastarter-nextjs-main/apps/docs/app/[[...slug]]/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/next.config.ts
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/meta.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/users/page.tsx
  - 0520/supastarter-nextjs-main/.editorconfig
  - 0520/supastarter-nextjs-main/packages/mail/emails/index.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/types.ts
  - 0520/supastarter-nextjs-main/packages/payments/index.ts
  - 0520/supastarter-nextjs-main/packages/payments/package.json
  - 0520/supastarter-nextjs-main/packages/payments/provider/dodopayments/index.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/dropdown-menu.tsx
  - 0520/supastarter-nextjs-main/packages/utils/package.json
  - 0520/supastarter-nextjs-main/packages/mail/emails/EmailVerification.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/not-found.tsx
  - 0520/supastarter-nextjs-main/tooling/scripts/package.json
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - playwright-results/opcos-live/auth-flow-report.json
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/unread-count.ts
  - 0520/supastarter-nextjs-main/packages/storage/tsconfig.json
  - playwright-results/opcos-live/forgot-password-after-submit.png
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64-setup.exe
  - playwright-results/opcos-live/mobile-smoke-report.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/DeleteOrganizationForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationForm.tsx
  - 0520/不動產說明書/2-1-土地-不一定要.JPG
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/choose-plan/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/changelog/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NotificationCenter.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/router.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/organizations.ts
  - playwright-results/opcos-live/mobile-auth-_products_aire.png
  - 0520/不動產說明書/0417-old/不動產書說明說7.pdf
  - 0520/supastarter-nextjs-main/packages/storage/provider/s3/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationSelect.tsx
  - 0520/不動產說明書/0417-old/不動產說明書3.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/page.tsx
  - 0520/不動產說明書-bug/截圖 2026-05-19 下午3.11.11.png
  - src-tauri/src/commands/license.rs
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/request.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/mail.json
  - 0520/supastarter-nextjs-main/packages/mail/provider/console.ts
  - docs/opcos-saas/client-explanation.md
  - playwright-results/opcos-live/after-email-verification.png
  - playwright-results/opcos-live/mobile-public-_signup.png
  - 0520/supastarter-nextjs-main/packages/storage/config.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-all-read.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.md
  - 0520/supastarter-nextjs-main/packages/auth/plugins/invitation-only/index.ts
  - 0520/supastarter-nextjs-main/packages/mail/global.d.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/create-notification.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/textarea.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/google/index.tsx
  - docs/opcos-saas/02-modular-frontend-system.md
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/login/page.tsx
  - 0520/supastarter-nextjs-main/packages/database/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/packages/auth/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/components/input-otp.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/icon.png
  - 0520/supastarter-nextjs-main/packages/ui/components/table.tsx
  - 0520/不動產說明書/0417-old/其他土地_現場必問清單.docx
  - 0520/不動產說明書/0417-old/鄉村區建地_秘書後補清單.docx
  - playwright-results/opcos-live/login.png
  - playwright-results/opcos-live/verified-_settings.png
  - 0520/supastarter-nextjs-main/.vscode/extensions.json
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/procedures/stream-message.ts
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/(home)/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/constants/oauth-providers.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/CreateOrganizationForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/server.ts
  - 0520/不動產說明書/11-房屋-生活機能.JPG
  - 0520/supastarter-nextjs-main/packages/storage/types.ts
  - 0520/不動產說明書/0417-old/工業地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/types.ts
  - 0520/不動產說明書/3-2+3.JPG
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - 0520/supastarter-nextjs-main/packages/api/config.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/catalog.ts
  - docs/opcos-saas/07-spectra-security-audit-report.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ResetPasswordForm.tsx
  - 0520/supastarter-nextjs-main/packages/storage/index.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/second-post.mdx
  - 0520/supastarter-nextjs-main/packages/mail/components/PrimaryButton.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/alert-dialog.tsx
  - playwright-results/opcos-live/manual-_products_aire_devices.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserAvatar.tsx
  - 0520/supastarter-nextjs-main/.github/dependabot.yml
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/mail.json
  - 0520/supastarter-nextjs-main/packages/mail/emails/Notification.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/posthog/index.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/switch.tsx
  - 0520/不動產說明書-bug/22222222-2222-4222-8222-222222222222.pdf
  - 0520/supastarter-nextjs-main/packages/payments/lib/provider-price-ids.ts
  - 0520/不動產說明書/0417-old/透天別墅_現場必問清單.docx
  - playwright-results/opcos-live/route-_.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/marketing.json
  - 0520/supastarter-nextjs-main/README.md
  - 0520/supastarter-nextjs-main/packages/database/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationAlert.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/stripe/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/billing/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/plan-data.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsList.tsx
  - 0520/不動產說明書/0417-old/大樓華廈_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/index.ts
  - 0520/不動產說明書/0417-old/不動產說明書6.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/components/card.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - 0520/supastarter-nextjs-main/packages/ui/package.json
  - 0520/不動產說明書/建物物調表-母版.txt
  - 0520/不動產說明書/0417-old/店面_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-customer-portal-link.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod-generator.config.json
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CustomerPortalButton.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangePassword.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/lib/get-messages.ts
  - 0520/supastarter-nextjs-main/apps/marketing/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogoForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CropImageDialog.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationsList.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/LocaleSwitch.tsx
  - 0520/supastarter-nextjs-main/packages/mail/components/Wrapper.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ActiveOrganizationProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/organization-invitation/[invitationId]/page.tsx
  - 0520/不動產說明書/0417-old/不動產書說明書10.pdf
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - 0520/supastarter-nextjs-main/apps/docs/lib/source.ts
  - 0520/supastarter-nextjs-main/apps/saas/vitest.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/playwright.config.ts
  - 0520/supastarter-nextjs-main/packages/ai/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/users/router.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/organizations.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/dialog.tsx
  - e2e/results/playwright-report/trace/sw.bundle.js
  - playwright-results/aire-house-mvp-workbench-1728.png
  - 0520/不動產說明書/0417-old/不動產說明書8.pdf
  - 0520/不動產說明書/0417-old/不動產說明書5.pdf
  - 0520/supastarter-nextjs-main/packages/logs/tsconfig.json
  - playwright-results/opcos-live/authenticated-link-crawl.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/notifications/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/chatbot/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/handler.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/badge.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/locale-currency.tsx
  - 0520/supastarter-nextjs-main/apps/docs/components/ai/page-actions.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/ContactForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/cookie-consent.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogo.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostListItem.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/types.ts
  - 0520/不動產說明書/0417-old/農舍_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ForgotPasswordForm.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/OrganizationInvitation.tsx
  - playwright-results/opcos-live/route-_licenses.png
  - playwright-results/opcos-live/verified-login-after-submit.png
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/create-logo-upload-url.ts
  - 0520/不動產說明書/0417-old/不動產說明書1.pdf
  - 0520/不動產說明書/0417-old/工業地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/PasskeysBlock.tsx
  - playwright-results/opcos-live/verified-_licenses.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/router.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/NewsletterSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SettingsMenu.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/marketing.json
  - 0520/不動產說明書/0417-old/廠房_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/meta.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/cache.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/mixpanel/index.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/router.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/TwoFactorBlock.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/index.ts
  - 0520/supastarter-nextjs-main/packages/ui/components.json
  - 0520/supastarter-nextjs-main/packages/utils/lib/password-validation.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/use-media-query.ts
  - 0520/不動產說明書/10-房屋-現況調查表-5-1+5.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/api.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentBanner.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/[...path]/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PasswordInput.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ClientProviders.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/locale-currency.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SetPassword.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/config.ts
  - 0520/不動產說明書/10-房屋-現況調查表-4.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/server.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ChangeOrganizationNameForm.tsx
  - 0520/不動產說明書/99-土地-現況調查表-5-1+5.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/postcss.config.cjs
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/Footer.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/new-organization/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/routing.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/members/page.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/polar/index.ts
  - 0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf
  - 0520/supastarter-nextjs-main/apps/docs/app/layout.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.md
  - playwright-results/aire-house-mvp-workbench-labels-1440.png
  - 0520/supastarter-nextjs-main/packages/payments/provider/index.ts
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report_tw.yml
  - 0520/supastarter-nextjs-main/apps/docs/app/llms-full.txt/route.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarForm.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/lemonsqueezy/index.ts
  - 0520/不動產說明書/不動產說明書底版.png
  - 0520/supastarter-nextjs-main/packages/logs/index.ts
  - 0520/supastarter-nextjs-main/packages/notifications/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/auth/lib/helper.ts
  - 0520/supastarter-nextjs-main/packages/mail/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ui/components/avatar.tsx
  - playwright-results/opcos-live/onboarding-before-continue.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FaqSection.tsx
  - 0520/不動產說明書/0417-old/不動產說明書9.pdf
  - docs/opcos-saas/05-monorepo-migration-plan.md
  - docs/opcos-saas/04-existing-saas-audit.md
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/users.ts
  - playwright-results/opcos-live/route-_devices.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/PricingTable.tsx
  - 0520/supastarter-nextjs-main/tooling/typescript/base.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTileChart.tsx
  - 0520/supastarter-nextjs-main/packages/mail/lib/send.ts
  - 0520/supastarter-nextjs-main/apps/marketing/global.d.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content-collections.ts
  - 0520/supastarter-nextjs-main/packages/logs/lib/logger.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/icon.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/cookie-consent.ts
  - playwright-results/opcos-live/manual-_products_aire_intent_request_access.png
  - playwright-results/opcos-live/verified-_dashboard.png
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/shared.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/mail.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/marketing.json
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/router.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SubscriptionStatusBadge.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - 0520/不動產說明書-bug/截圖 2026-05-20 凌晨12.09.28.png
  - 0520/不動產說明書/10-房屋-現況調查表-3.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationRoleSelect.tsx
  - 0520/不動產說明書/土地不動產說明書格式範例(1050429函頒).pdf
  - docs/opcos-saas/01-saas-starter-kit-research.md
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostContent.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AuthWrapper.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/contact/page.tsx
  - 0520/supastarter-nextjs-main/docker-compose.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ClientProviders.tsx
  - 0520/supastarter-nextjs-main/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/ai/lib/index.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/nodemailer.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/skeleton.tsx
  - docs/clean-deploy-source.md
  - e2e/results/playwright-report/trace/index.html
  - 0520/不動產說明書-bug/html-pdf-demo.pdf
  - playwright-results/aire-dom-ux-sdd-preview-1440.png
  - 0520/spectra-app-main/README.md
  - 0520/supastarter-nextjs-main/packages/auth/index.ts
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_aarch64.dmg
  - 0520/supastarter-nextjs-main/packages/payments/provider/creem/index.ts
  - 0520/不動產說明書/格局圖.jpg
  - 0520/supastarter-nextjs-main/apps/marketing/intl.d.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/index.tsx
  - 0520/supastarter-nextjs-main/.vscode/settings.json
  - 0520/supastarter-nextjs-main/packages/database/package.json
  - playwright-results/opcos-live/verified-_devices.png
  - 0520/supastarter-nextjs-main/packages/payments/config.ts
  - 0520/supastarter-nextjs-main/packages/mail/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeEmailForm.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/notifications.ts
  - 0520/不動產說明書/0417-old/套房_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/app/robots.ts
  - 0520/不動產說明書/4.JPG
  - playwright-results/opcos-live/home-discovery.json
  - playwright-results/opcos-live/login-after-submit.png
  - playwright-results/opcos-live/signup-filled.png
  - playwright-results/opcos-live/verified-login-filled.png
  - playwright-results/opcos-live/route-_settings.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/request.ts
  - 0520/不動產說明書/99-土地-現況調查表-2.JPG
  - 0520/supastarter-nextjs-main/packages/ui/components/label.tsx
  - playwright-results/opcos-live/verified-_account.png
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/app/globals.css
  - 0520/supastarter-nextjs-main/packages/ai/index.ts
  - src-tauri/src/opcos.rs
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/marketing.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/lib/links.ts
  - 0520/不動產說明書/2.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SignupForm.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/index.ts
  - playwright-results/opcos-live/verified-account-flow-report.json
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/config.yml
  - 0520/supastarter-nextjs-main/apps/saas/package.json
  - docs/opcos-saas/06-shadcn-saas-kit-comparison.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/OtpForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/forgot-password/page.tsx
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - 0520/supastarter-nextjs-main/packages/api/orpc/middleware/locale-middleware.ts
  - e2e/results/playwright-report/index.html
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/overview.mdx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/not-found.tsx
  - 0520/不動產說明書/0417-old/不動產說明書14.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConfirmationAlertProvider.tsx
  - 0520/supastarter-nextjs-main/apps/docs/tsconfig.json
  - playwright-results/opcos-live/route-_forgot_password.png
  - 0520/supastarter-nextjs-main/packages/auth/auth.ts
  - playwright-results/opcos-live/post-onboarding-_account.png
  - 0520/不動產說明書/1-封面.png
  - 0520/supastarter-nextjs-main/packages/ui/components/popover.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/api/search/route.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/purchases-context.ts
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request_tw.yml
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/notifications.ts
  - 0520/supastarter-nextjs-main/apps/docs/config.ts
  - 0520/不動產說明書-bug/ee705444-173f-4250-9360-42b90c093e31.pdf
  - 0520/supastarter-nextjs-main/CODE_REVIEW.md
  - e2e/results/test-artifacts/.last-run.json
  - 0520/supastarter-nextjs-main/packages/database/drizzle/zod.ts
  - playwright-results/opcos-live/mailtm-signup-after-submit.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/NavBar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/api/[[...rest]]/route.ts
  - 0520/supastarter-nextjs-main/apps/mail-preview/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image-dark.png
  - e2e/results/playwright-report/trace/uiMode.html
  - 0520/supastarter-nextjs-main/apps/docs/global.d.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/messages.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/toast.tsx
  - 0520/supastarter-nextjs-main/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/query-client.ts
  - docs/opcos-saas/supastarter-inventory.md
  - 0520/不動產說明書/0417-old/公寓_現場必問清單.docx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/mysql.ts
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - e2e/results/playwright-report/trace/snapshot.html
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SocialSigninButton.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/shared.json
  - playwright-results/opcos-live/signup.png
  - 0520/supastarter-nextjs-main/apps/saas/intl.d.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/checkout-return/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/types.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/index.ts
  - 0520/supastarter-nextjs-main/apps/marketing/config.ts
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/index.mdx
  - 0520/不動產說明書/0417-old/農地_現場必問清單.docx
  - 0520/不動產說明書/0417-old/透天別墅_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/logs/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ColorModeToggle.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/onboarding/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-notifications-read.ts
  - 0520/不動產說明書/0417-old/土地物調表-母版.docx
  - docs/opcos-saas/08-kie-ai-api-reference.md
  - 0520/supastarter-nextjs-main/packages/api/types.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/welcome.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/layout.tsx
  - 0520/supastarter-nextjs-main/packages/payments/lib/plans.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/react-library.json
  - playwright-results/aire-house-mvp-workbench-1440.png
  - 0520/supastarter-nextjs-main/packages/storage/package.json
  - 0520/supastarter-nextjs-main/apps/saas/app/icon.png
  - playwright-results/opcos-live/post-onboarding-_licenses.png
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/HeroSection.tsx
  - 0520/supastarter-nextjs-main/.github/workflows/validate-prs.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/api.ts
  - playwright-results/opcos-live/login-filled.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/shared.json
  - 0520/supastarter-nextjs-main/apps/saas/global.d.ts
  - 0520/spectra-app-main/CHANGELOG.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationStart.tsx
  - 0520/supastarter-nextjs-main/apps/saas/types.ts
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image.png
  - 0520/supastarter-nextjs-main/apps/marketing/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/emails/ForgotPassword.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/MagicLink.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/security/page.tsx
  - 0520/supastarter-nextjs-main/packages/auth/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-checkout-link.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/input.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/progress.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/reset-password/page.tsx
  - 0520/不動產說明書/2-1-房屋-不一定要.JPG.JPG
  - playwright-results/opcos-live/post-onboarding-_devices.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/saas.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/EmailVerified.tsx
  - docs/opcos-saas/brand-guidelines.md
  - playwright-results/opcos-live/home.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/users/UserList.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/saas.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-query-utils.ts
  - 0520/不動產說明書/0417-old/不動產說明說15.pdf
  - 0520/supastarter-nextjs-main/apps/docs/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/use-active-organization.ts
  - 0520/supastarter-nextjs-main/packages/ui/lib/index.ts
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - playwright-results/opcos-live/signup-after-submit.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/verify/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ColorModeToggle.tsx
  - 0520/supastarter-nextjs-main/packages/utils/lib/base-url.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ChangePlan.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/router.ts
  - 0520/supastarter-nextjs-main/packages/notifications/package.json
  - 0520/supastarter-nextjs-main/apps/docs/postcss.config.mjs
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PageHeader.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationModal.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/sheet.tsx
  - 0520/supastarter-nextjs-main/claude.md
  - 0520/supastarter-nextjs-main/packages/ui/components/spinner.tsx
  - 0520/不動產說明書/0417-old/其他土地_秘書後補清單.docx
  - src/lib/mock-backend.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod/index.ts
  - 0520/不動產說明書/0417-old/建地_住宅地_秘書後補清單.docx
  - 0520/不動產說明書/0417-old/鄉村區建地_現場必問清單.docx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-organizations.ts
  - 0520/不動產說明書/0417-old/商業地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/mail/package.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/[id]/page.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/purchases.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/shared.json
  - 0520/supastarter-nextjs-main/packages/database/prisma/schema.prisma
  - 0520/supastarter-nextjs-main/packages/api/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/router.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/globals.css
  - 0520/supastarter-nextjs-main/packages/mail/provider/resend.ts
  - 0520/不動產說明書-bug/不動產說明書 — AIRE-TEST-002.pdf
  - 0520/supastarter-nextjs-main/packages/mail/provider/plunk.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/vercel/index.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/og/[...slug]/route.tsx
  - 0520/supastarter-nextjs-main/apps/saas/postcss.config.cjs
  - 0520/不動產說明書/0417-old/透明房價一覽表成交行情.pdf
  - 0520/supastarter-nextjs-main/packages/api/index.ts
  - 0520/supastarter-nextjs-main/apps/docs/source.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsItem.tsx
  - 0520/不動產說明書/0417-old/套房_秘書後補清單.docx
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - 0520/supastarter-nextjs-main/packages/ui/components/accordion.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/saas.json
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.de.mdx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/DeleteAccountForm.tsx
  - 0520/supastarter-nextjs-main/packages/auth/types.ts
  - playwright-results/opcos-live/mobile-auth-_account.png
  - playwright-results/opcos-live/negative-login-invalid-credentials.png
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Pagination.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserMenu.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-users.ts
  - 0520/supastarter-nextjs-main/packages/payments/tsconfig.json
  - 0520/supastarter-nextjs-main/tooling/tailwind/package.json
  - 0520/不動產說明書/0417-old/不動產說明書12.pdf
  - 0520/supastarter-nextjs-main/packages/ui/components/alert.tsx
  - 0520/不動產說明書/0417-old/店面_現場必問清單.docx
  - playwright-results/opcos-live/mobile-public-_login.png
  - playwright-results/opcos-live/product-manual-pages.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/PricingSection.tsx
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request.yml
  - 0520/supastarter-nextjs-main/packages/auth/lib/organization.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserLanguageForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/config.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FeaturesSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/client.ts
  - playwright-results/aire-dom-ux-sdd-workbench-1440.png
  - 0520/supastarter-nextjs-main/.oxfmtrc.json
  - playwright-results/opcos-live/post-onboarding-_dashboard.png
  - 0520/不動產說明書/0417-old/不動產說明書11.pdf
  - playwright-results/opcos-live/mobile-auth-_settings_general.png
  - 0520/supastarter-nextjs-main/packages/utils/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/marketing/app/layout.tsx
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - 0520/supastarter-nextjs-main/packages/mail/lib/i18n.ts
  - playwright-results/opcos-live/route-_dashboard.png
  - 0520/不動產說明書-bug/AIRE-TEST-002-說明書.pdf
  - 0520/supastarter-nextjs-main/tooling/tailwind/tailwind-animate.css
  - playwright-results/opcos-live/onboarding-after-continue.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/router.ts
  - 0520/supastarter-nextjs-main/packages/mail/lib/templates.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/member-roles.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/users.ts
  - playwright-results/opcos-live/route-crawl.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/general/page.tsx
  - docs/opcos-saas/business-analysis.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - 0520/不動產說明書/99-土地-現況調查表-4.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.de.md
  - 0520/supastarter-nextjs-main/packages/ui/components/tabs.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/users/procedures/create-avatar-upload-url.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - 0520/不動產說明書/10-房屋-現況調查表-2.JPG
  - 0520/不動產說明書/0417-old/不動產說明書13.pdf
  - 0520/supastarter-nextjs-main/CHANGELOG.md
  - src-tauri/build.rs
  - 0520/不動產說明書-bug/291-logo-1711991296.916.svg
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ConnectedAccountsBlock.tsx
  - 0520/supastarter-nextjs-main/packages/payments/types.ts
  - 0520/不動產說明書/0417-old/農舍_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationsGrid.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/sitemap.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ActiveSessionsBlock.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ApiClientProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SessionProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/saas.json
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64.dmg
  - playwright-results/opcos-live/mobile-auth-_products.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/LocaleSwitch.tsx
  - playwright-results/opcos-live/route-_account.png
  - 0520/spectra-app-main/assets/logo.png
  - 0520/supastarter-nextjs-main/packages/mail/provider/postmark.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.ts
  - playwright-results/opcos-live/route-_signup.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/TabGroup.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/list-notifications.ts
  - 0520/supastarter-nextjs-main/apps/marketing/vitest.config.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/errors-messages.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/robots.ts
  - 0520/不動產說明書/999- 土地-生活機能.JPG
  - playwright-results/opcos-live/negative-auth-report.json
  - 0520/supastarter-nextjs-main/packages/database/drizzle/index.ts
tests:
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.test.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/tests/home.spec.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.test.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.test.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - 0520/supastarter-nextjs-main/apps/saas/tests/login.spec.ts
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.test.ts
-->

---
### Requirement: admin-auto-unlock-mcp-hub

WHEN the currently authenticated user has role `admin`
THEN the 實價登錄 MCP Hub card on the settings page SHALL display status "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be shown
AND no subscription check or payment API call SHALL be made

#### Scenario: Admin sees unlocked state

WHEN an admin user (role === "admin") navigates to 設定 > 進階功能
THEN the 實價登錄 MCP Hub card SHALL render with label "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be present in the DOM

##### Example:
- Input: sessionUser = { email: "admin@test.aire", role: "admin" }
- Output: card shows "已啟用（管理員）"; no button with text "前往訂閱"

#### Scenario: Non-admin still sees subscription gate

WHEN a non-admin user (role !== "admin") navigates to 設定 > 進階功能
AND the user does not have an active subscription
THEN the MCP Hub card SHALL show the "前往訂閱" button

##### Example:
- Input: sessionUser = { email: "staff@test.aire", role: "staff" }, subscription = null
- Output: card shows "前往訂閱" button


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: tauri-invoke-browser-safe

The case preview page SHALL NOT import Tauri APIs directly. All Tauri IPC calls (export_pdf, get_theme, load_logo) on the preview page SHALL be routed through `safeInvoke` from `src/lib/safe-invoke.ts`, which provides browser-compatible mock responses when the Tauri runtime is unavailable.

#### Scenario: Preview page loads in browser dev mode

WHEN a user navigates to `/cases/CASE-001/preview` in a Chrome browser (no Tauri runtime)
THEN the page SHALL render the preview UI without throwing `Cannot read properties of undefined (reading 'invoke')`

##### Example:
- Environment: browser (window.__TAURI__ is undefined)
- URL: http://localhost:3000/cases/CASE-001/preview
- Output: page renders; no uncaught TypeError in console

#### Scenario: Export PDF in browser dev mode returns mock response

WHEN a user clicks 匯出 PDF on the preview page in browser dev mode
THEN `safeInvoke("export_pdf", { caseId: "CASE-001" })` SHALL return `{ filePath: "/mock/export/CASE-001.pdf" }`
AND the page SHALL display a notice such as "瀏覽器預覽模式，PDF 未實際產出"

##### Example:
- Input: click 匯出 PDF in browser
- Output: mock filePath returned; notice shown; no crash

<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->