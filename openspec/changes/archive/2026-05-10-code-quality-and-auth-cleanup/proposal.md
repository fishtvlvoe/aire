## Why

Code review 發現認證機制並存（遺留 getSessionUser）與 Lint 警告（Adobe 腳本干擾、React Hook 依賴缺失）會導致技術債累積，影響開發效率並增加維護成本。

## What Changes

- 修改 src/app/api/me/route.ts 全面使用 resolveCurrentUser 取代 getSessionUser，達成認證邏輯統一。
- 移除 src/lib/auth.ts 中過時的 getSessionUser 函式及其相關引用。
- 修改 eslint.config.mjs，將 docs/影片製作標準化/** 加入 globalIgnores 以排除外部腳本雜訊。
- 修正 src/app/listings/[id]/fill/page.tsx 與 src/app/admin/(dashboard)/audit-logs/page.tsx 中的 React Hook 依賴缺失問題。
- 移除 src/lib/ocr/index.ts、src/app/api/listings/[id]/regenerate/route.ts 等檔案中未使用的變數與匯入。

## Non-Goals

- 不調整其他 API 路由的授權邏輯（權限控制已在其他 change 處理）。
- 不更動 PDF 生成的核心 HTML/CSS 範本。
- 不進行大規模的架構重構，僅針對 Code Review 點出的問題進行外科手術式修復。

## Capabilities

### New Capabilities

(無)

### Modified Capabilities

- user-auth: 統一使用 NextAuth JWT 作為唯一認證來源，廢棄 session_id cookie 機制。

## Impact

- Affected specs: user-auth
- Affected code:
  - Modified: src/app/api/me/route.ts
  - Modified: src/lib/auth.ts
  - Modified: eslint.config.mjs
  - Modified: src/app/listings/[id]/fill/page.tsx
  - Modified: src/app/admin/(dashboard)/audit-logs/page.tsx
  - Modified: src/lib/ocr/index.ts
  - Modified: src/app/api/listings/[id]/regenerate/route.ts
  - Modified: scripts/verify-disclosure-pdf.ts
  - Modified: src/lib/generators/five-documents.ts
  - Modified: src/lib/trackers/algorithm-tracker.ts
