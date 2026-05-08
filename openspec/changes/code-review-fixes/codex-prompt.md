# Code Review 安全修復 — Codex 執行指令

## 背景
兩份獨立 Code Review 發現 11 個安全與品質問題。你要按 Wave 順序修復全部。

## 限制（嚴格遵守）
- 禁止修改：openspec/、.claude/、docs/、AGENTS.md、CLAUDE.md
- 禁止執行：git restore、git clean、git reset、git checkout、rm -rf
- 允許執行：git diff、git status、npm run build、npx tsc、npm test、ls、cat
- 每個 Wave 完成後跑 `npx tsc --noEmit` 確認 TypeScript 編譯通過

---

## Wave 1：Auth 統一 + 權限基礎建設（P0）

### 1.1 建立統一 auth helper
檔案：`src/lib/auth/resolve-user.ts`（新建）

```typescript
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { getUserByUsername, getUserByEmail } from '@/lib/auth/db';

export async function resolveCurrentUser(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  // token.sub 或 token.email 查 DB
  const user = getUserByUsername(token.sub as string) 
    ?? getUserByEmail(token.email as string);
  return user ?? null;
}
```

注意：先讀 `src/lib/auth/db.ts` 確認 getUserByUsername 和 getUserByEmail 的實際函式名稱和 import 路徑，用實際的。

### 1.2 建立 listing 存取控制 helper
檔案：`src/lib/auth/require-listing-access.ts`（新建）

```typescript
import { getListing } from '@/lib/db';

export function requireListingAccess(user: any, listingId: string) {
  if (!user) return { allowed: false, status: 401, message: 'Unauthorized' };
  if (user.role === 'admin') return { allowed: true };
  const listing = getListing(listingId);
  if (!listing) return { allowed: false, status: 404, message: 'Listing not found' };
  if (listing.owner_id !== user.id) return { allowed: false, status: 403, message: 'Forbidden' };
  return { allowed: true };
}
```

注意：先讀 `src/lib/db/index.ts` 確認 getListing 的實際函式名稱和回傳型別。

### 1.3 替換 listings route 的 auth
檔案：`src/app/api/listings/route.ts`
- 移除所有 `SESSION_COOKIE`、`getSessionUser` 的 import 和使用
- 改用 `import { resolveCurrentUser } from '@/lib/auth/resolve-user'`
- GET handler：`const user = await resolveCurrentUser(req)`，如果 user.role !== 'admin' 則加 `WHERE owner_id = ?` 過濾
- POST handler：自動帶 `owner_id: user.id`

### 1.4 修改 listing DELETE 為 soft-delete
檔案：`src/app/api/listings/[id]/route.ts`
- GET/PATCH：加 `const user = await resolveCurrentUser(req)` + `requireListingAccess(user, id)`
- DELETE handler：不再呼叫 `deleteListing(id)`，改為：
  ```typescript
  db.prepare('UPDATE listings SET archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  ```
  並呼叫 `writeAuditLog({ action: 'archive', entity: 'listing', entityId: id, userId: user.id })`
- 先讀 `src/lib/db/index.ts` 確認 writeAuditLog 的實際 API

### 1.5 修改 admin users route
檔案：`src/app/api/admin/users/route.ts`
- 替換 auth 為 resolveCurrentUser
- POST 建立用戶時：如果 request body 沒有 username，自動設 `username = email`

---

## Wave 2：Listing 子路由權限（P0）

以下 8 個檔案都要做相同的修改：

檔案清單：
1. `src/app/api/listings/[id]/attachments/route.ts`
2. `src/app/api/listings/[id]/extract/route.ts`
3. `src/app/api/listings/[id]/field-visit/route.ts`
4. `src/app/api/listings/[id]/supplementary/route.ts`
5. `src/app/api/listings/[id]/generate/route.ts`
6. `src/app/api/listings/[id]/regenerate/route.ts`
7. `src/app/api/listings/[id]/documents/route.ts`
8. `src/app/api/listings/[id]/pdf/route.ts`

每個檔案的修改：
- 加 `import { resolveCurrentUser } from '@/lib/auth/resolve-user'`
- 加 `import { requireListingAccess } from '@/lib/auth/require-listing-access'`
- 每個 handler（GET/POST/PATCH/DELETE）開頭加：
  ```typescript
  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, id);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }
  ```
- 移除舊的 SESSION_COOKIE / getSessionUser 用法

### 特別注意 attachments route
檔案：`src/app/api/listings/[id]/attachments/route.ts`
- 找到 `void fetch(...)` 觸發 OCR 的地方（約 L167）
- 這個 internal fetch 目前沒帶 auth header，導致生產環境 401
- 修復方式：把當前 request 的 cookie header 轉發：
  ```typescript
  void fetch(`${baseUrl}/api/listings/${id}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': req.headers.get('cookie') || '',
    },
    body: JSON.stringify({ attachmentId }),
  });
  ```

---

## Wave 3：Schema 驗證 + Audit Log（P1）

### 3.1 安裝 zod + 建立 schemas
先執行：`npm ls zod 2>/dev/null || npm install zod`

檔案：`src/lib/validation/schemas.ts`（新建）
- 先讀每個 route 的 request body 結構，再寫對應的 Zod schema
- 至少需要以下 schema：
  - `listingCreateSchema` — 給 POST /api/listings
  - `listingUpdateSchema` — 給 PATCH /api/listings/[id]
  - `fieldVisitSchema` — 給 field-visit route
  - `supplementarySchema` — 給 supplementary route  
  - `generateSchema` — 給 generate/regenerate route
  - `adminUserCreateSchema` — 給 POST /api/admin/users
  - `transferCaseSchema` — 給 transfer-cases route

### 3.2-3.4 在各 route 加 Zod 驗證
每個 mutating handler 的 `await req.json()` 後面加：
```typescript
import { listingCreateSchema } from '@/lib/validation/schemas';

const body = await req.json();
const parsed = listingCreateSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.issues },
    { status: 400 }
  );
}
// 用 parsed.data 取代原本的 body
```

### 3.5 DB helper 加 audit log
檔案：`src/lib/db/index.ts`
- 找到 `createListing`、`updateListing`、`deleteListing`、`updateSupplementaryData` 函式
- 在每個函式成功執行後，加上 `writeAuditLog(...)` 呼叫
- 如果 `writeAuditLog` 不存在，先建立它：
  ```typescript
  export function writeAuditLog(entry: { action: string; entity: string; entityId: string; userId?: string; details?: string }) {
    db.prepare('INSERT INTO audit_log (action, entity, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      entry.action, entry.entity, entry.entityId, entry.userId ?? null, entry.details ?? null, new Date().toISOString()
    );
  }
  ```
- 確認 audit_log table 存在，不存在就在 schema 初始化加 CREATE TABLE IF NOT EXISTS
- `deleteListing` 改名為 `archiveListing`，邏輯改為 UPDATE SET archived_at

---

## Wave 4：注入防護（P1）

### 4.1 修復 codex.ts shell injection
檔案：`src/lib/codex-client/adapters/codex.ts`
- 找到 `exec(...)` 呼叫，整個替換為 spawn + stdin
- 參考 `src/lib/codex-client/adapters/gemini.ts` 的模式
- 改法：
  ```typescript
  import { spawn } from 'child_process';
  
  // 替換原本的 exec(command) 
  const child = spawn('codex', ['exec', '-q', '--model', model], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });
  child.stdin.write(prompt);
  child.stdin.end();
  ```
- 收集 stdout/stderr 的邏輯參考 gemini.ts

### 4.2 修復 claude-code.ts shell injection
檔案：`src/lib/codex-client/adapters/claude-code.ts`
- 同上模式：
  ```typescript
  const child = spawn('claude', ['-p', '-'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdin.write(prompt);
  child.stdin.end();
  ```

### 4.3 建立 PDF HTML sanitizer
先執行：`npm install sanitize-html && npm install -D @types/sanitize-html`

檔案：`src/lib/pdf-generator/sanitize.ts`（新建）
```typescript
import sanitize from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'strong', 'em', 'br', 'a', 'img', 'blockquote', 'pre', 'code',
  'span', 'div', 'hr',
];

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    disallowedTagsMode: 'discard',
  });
}
```

### 4.4 套用 sanitizer 到 PDF 生成
檔案：`src/lib/pdf-generator/dossier.ts` 和 `src/lib/pdf-generator/survey-sales.ts`
- 找到 `marked(...)` 呼叫的地方
- 在 marked 輸出後、插入 HTML 模板前，加上 `sanitizeHtml(...)` 包裹：
  ```typescript
  import { sanitizeHtml } from './sanitize';
  // 原本：const html = marked(markdown);
  // 改為：const html = sanitizeHtml(marked(markdown) as string);
  ```

---

## Wave 5：用戶管理 + Token 加密 + CI 修復（P1-P2）

### 5.1 用戶 username backfill
檔案：`src/app/api/admin/users/route.ts`
- 確認 POST handler 在建立用戶時設 username = email（Wave 1.5 已處理）

檔案：`scripts/backfill-username.ts`（新建）
```typescript
import Database from 'better-sqlite3';
const db = new Database('./data/three-ai.db');
db.prepare('UPDATE users SET username = email WHERE username IS NULL').run();
console.log('Backfill complete');
```

### 5.2 Electron token 加密
檔案：`electron/main.ts`
- 讀 `src/lib/codex-client/key-store.ts` 了解加密 API
- 替換 `fs.readFileSync` / `fs.writeFileSync` 明文讀寫 token 的地方
- 改用 key-store 的加密/解密函式
- 如果 key-store 是前端模組不能在 Electron 主進程用，就用 Node.js crypto：
  ```typescript
  import crypto from 'crypto';
  const KEY = crypto.scryptSync(app.getPath('userData'), 'three-ai-salt', 32);
  function encrypt(text: string) { /* aes-256-gcm */ }
  function decrypt(data: Buffer) { /* aes-256-gcm */ }
  ```

### 5.3 修改 vitest.config.ts
- 在 exclude 陣列加入：
  ```
  'license-server/node_modules/**',
  'dist-electron/**',
  'electron/build/**',
  '.next/**',
  ```

### 5.4 修改 eslint.config.mjs
- 在 ignores 陣列加入：
  ```
  'dist-electron/**',
  '.next/**',
  'electron/build/**',
  ```

### 5.5 修復測試失敗
逐一檢查並修復：
1. `src/middleware.test.ts`：測試 setup 需考慮 `hasUsers()` DB 狀態，mock 或初始化 DB
2. `src/app/api/auth/refresh/route.test.ts`：cookie Secure flag 只在 production 設定，測試應 mock NODE_ENV 或調整斷言
3. `src/lib/external-links/__tests__/url-builder.test.ts`：對比實作更新測試期望值
4. `scripts/generate-license.test.ts`：mock 回傳改為 `{ items: [{ licenseKey: '...' }] }` 符合實作
5. `src/lib/pdf-generator/__tests__/dossier.test.ts`：mock Puppeteer browser，不依賴 /usr/bin/chromium
6. `src/components/__tests__/MarketLookupPanel.test.tsx`：先執行 `npm install -D @testing-library/dom`

---

## 完成後驗證

```bash
echo "=== TypeScript 編譯 ==="
npx tsc --noEmit 2>&1 | tail -10

echo ""
echo "=== Build ==="
npm run build 2>&1 | tail -10

echo ""
echo "=== Test ==="
npm run test 2>&1 | tail -20

echo ""
echo "=== Lint ==="
npm run lint 2>&1 | tail -10

echo ""
echo "=== 改動摘要 ==="
git diff --stat

echo ""
echo "=== 新增檔案 ==="
git status --short | grep "^?"
```

全部通過才算完成。
