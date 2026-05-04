## Context

系統目前是匿名單一身份操作（無 login、無 user_id）。所有 API 無認證、listings 表無 owner 欄位。需要在不改變核心業務邏輯的前提下，加入最簡單的帳號分層。使用場景：公用電腦輪流登入，5-15 個業務員 + 1 個老闆。

## Goals / Non-Goals

**Goals:**

- 兩種角色：admin（老闆）和 agent（業務員）
- 公用電腦輪流登入（session-based auth，登出即切換）
- 物件綁定建立者，業務只能看自己的
- 老闆能看全部、編輯全部、管理帳號
- 業務離職 → 停用帳號 + 案件批次轉移
- 所有操作寫 audit log

**Non-Goals:**

- 不做密碼加密以外的安全措施（本機應用，IP 已限制）
- 不做 OAuth / SSO（簡單帳密即可）
- 不做多公司 / 多租戶
- 不做線上註冊（老闆建帳號）

## Decisions

### D1：使用者資料表

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','agent')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

初始化時建立一個 admin 帳號（安裝時設定）。

### D2：物件擁有者綁定

listings 表新增 `owner_id INTEGER REFERENCES users(id)`。

查詢邏輯：
- admin → `SELECT * FROM listings`（看全部）
- agent → `SELECT * FROM listings WHERE owner_id = ?`（只看自己的）

建立物件時自動填入 `owner_id = 當前登入者 id`。

### D3：案件轉移

```
POST /api/admin/transfer-cases
Body: { from_user_id, to_user_id }
```

批次更新：`UPDATE listings SET owner_id = ? WHERE owner_id = ?`
同時寫 audit log：「管理員將 [A] 的 N 筆物件轉移給 [B]」

### D4：Audit Log

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

記錄動作：create_listing、update_listing、delete_listing、generate_document、transfer_cases、disable_user、login、logout。

### D5：認證機制

- 登入：POST /api/auth/login（email + password）→ 回傳 session cookie
- Session 存 SQLite（`sessions` 表，含 user_id + expires_at）
- Next.js middleware 檢查 session cookie → 無效 redirect 到 /login
- 登出：DELETE /api/auth/logout → 清除 session

公用電腦場景：A 登出 → B 登入 → 切換身份。

### D6：AI 輔助提示

所有 generator 函式（disclosure-generator、property-sheet）的輸出末尾加入：

```
---
⚠️ 本文件由 AI 輔助產出，請務必確認內容正確後再使用。
```

PDF 版本在頁尾加入相同文字（灰色小字）。

## Implementation Distribution Strategy

| 任務類型 | 代理 | 理由 |
|---------|------|------|
| DB schema + migration | Copilot CLI | 標準 SQL |
| Auth API（login/logout/session） | Copilot CLI | 標準 CRUD |
| 帳號管理 UI（/admin/users） | Copilot CLI | React 表單 |
| Middleware + 權限過濾 | Copilot CLI | 業務邏輯 |
| 案件轉移 API + UI | Copilot CLI | 簡單批次操作 |
| Audit log 寫入層 | Copilot CLI | 標準模式 |
| AI 提示標記 | Copilot CLI | 一行修改 |
| E2E 測試（登入→建物件→轉移→查 log） | Sonnet 子代理 | 複雜整合 |

預估 Token：約 15K
