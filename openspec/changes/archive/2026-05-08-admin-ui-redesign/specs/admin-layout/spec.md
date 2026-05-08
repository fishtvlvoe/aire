## ADDED Requirements

### Requirement: admin-shared-layout

- All /admin/* routes SHALL share a common layout (src/app/admin/layout.tsx) that includes the Sidebar component and a white content card container.
- The admin layout SHALL use the same visual structure as the listings page: min-h-screen bg-[#F5F6FA] outer wrapper, flex container with Sidebar (w-64), and a main area (flex-1 p-8) containing a white rounded card (rounded-lg bg-white p-6 with shadow).
- Each admin page SHALL display an AdminBreadcrumb component at the top of the content area, showing a back link to /listings with a ChevronLeft icon and the text "返回物件列表".
- The AdminBreadcrumb link SHALL navigate to /listings using Next.js Link component, not browser history back.
- Admin pages SHALL NOT define their own outer container styling (no max-w-4xl mx-auto or standalone p-6/p-8 wrappers), relying on the shared layout instead.

#### Scenario: Admin navigates to user management page

Given the admin is logged in with role='admin'
When the admin navigates to /admin/users
Then the page renders with the shared admin layout: bg-[#F5F6FA] background, Sidebar on the left, white card container on the right
And an AdminBreadcrumb with "← 返回物件列表" appears at the top of the content area
And clicking the breadcrumb navigates to /listings

##### Example: Admin navigates to /admin/users

Given role='admin', session_id cookie set
When GET /admin/users
Then HTML body contains: div.min-h-screen.bg-\[#F5F6FA\] > div.flex > aside.w-64 + main.flex-1 > section.rounded-lg.bg-white
And section first child is Link href="/listings" with text "返回物件列表"

#### Scenario: Non-admin page structure independence

Given the admin layout wraps all /admin/* routes
When the admin visits /admin/features or /admin/templates
Then each page content renders inside the shared white card container without its own max-w or padding wrapper

##### Example: Admin page visual structure

```
┌─────────────────────────────────────────────────┐
│ bg-[#F5F6FA]                                    │
│ ┌──────────┬──────────────────────────────────┐ │
│ │ Sidebar  │  ┌──────────────────────────────┐│ │
│ │ w-64     │  │ white card, rounded, shadow  ││ │
│ │ #1B3A6B  │  │ ← 返回物件列表              ││ │
│ │          │  │ [Page Title]                 ││ │
│ │ 物件列表 │  │ [Page Content]               ││ │
│ │ 新增物件 │  │                              ││ │
│ │          │  │                              ││ │
│ │ ──管理── │  │                              ││ │
│ │ 用戶管理 │  │                              ││ │
│ │ 功能設定 │  └──────────────────────────────┘│ │
│ │ 模板管理 │                                  │ │
│ └──────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```
