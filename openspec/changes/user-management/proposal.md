## Why

房仲店東購買系統的第一需求是「業務離職我關帳號就好，案件留在店裡」。目前系統是匿名單一身份操作所有物件，無法區分「誰建的」「誰在用」。沒有帳號系統，IP 綁定和功能開關都失去意義（不知道是誰在操作）。

## What Changes

新增多用戶帳號管理系統：老闆帳號（admin）+ 業務員帳號（agent），支援公用電腦輪流登入、物件擁有者綁定、案件轉移、操作記錄。同時在所有 AI 產出文件上加入「AI 輔助產出，請確認後使用」提示標記。

## Non-Goals

- 不做雲端同步（資料留在本機 SQLite）
- 不做細粒度權限（只分 admin / agent 兩種角色）
- 不做密碼找回（忘記密碼由老闆重設）
- 不做多公司 / 多租戶

## Capabilities

### New Capabilities

- `user-account-management`: 老闆建立/停用/重設業務員帳號
- `listing-ownership`: 物件綁定建立者，業務只能看自己的物件，老闆看全部
- `case-transfer`: 業務離職時一鍵將其物件轉移給其他業務
- `audit-log`: 記錄誰在什麼時間對哪個物件做了什麼操作
- `ai-output-disclaimer`: 所有 AI 產出的文件加上輔助提示標記

### Modified Capabilities

- `listing-workflow`: 建立物件時自動綁定當前登入者為擁有者
- `listing-ui-flow`: 列表頁根據角色過濾顯示

## Impact

- Affected specs: user-account-management, listing-ownership, case-transfer, audit-log, ai-output-disclaimer, listing-workflow, listing-ui-flow
- Affected code:
  - New: src/lib/db/users.ts, src/lib/db/audit-log.ts, src/app/admin/users/page.tsx, src/app/login/page.tsx, src/middleware.ts, src/components/ai-disclaimer.tsx
  - Modified: src/lib/db/schema.ts, src/lib/db/index.ts, src/app/listings/page.tsx, src/app/api/listings/route.ts, src/lib/generators/property-sheet.ts, src/lib/generators/disclosure-generator.ts
  - Removed: (none)
