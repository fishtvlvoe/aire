## Context

目前物件列表是平坦清單，無分類、無封存、無搜尋。SQLite 資料庫已有 `listings` 表，前端為 Next.js App Router。物件數量預估 50-200 筆/用戶，SQLite FTS5 足以應付搜尋需求。

## Goals / Non-Goals

**Goals:**

- 讓用戶能以資料夾分類物件（樹狀式，一層，一物件一夾）
- 提供封存機制隱藏已結案物件，保留資料可還原
- 提供搜尋功能快速定位物件

**Non-Goals:**

- 不做巢狀資料夾（只有一層，降低 UI 和 DB 複雜度）
- 不做自動封存規則（用戶手動操作，避免意外封存）
- 不做全文索引引擎替換（SQLite FTS5 內建即可）
- 不做拖曳排序資料夾（MVP 不需要）

## Decisions

### D1：資料夾 DB Schema

```sql
CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- listings 表新增欄位
ALTER TABLE listings ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE listings ADD COLUMN archived_at TEXT DEFAULT NULL;
```

- `folder_id` 為 NULL 表示「未分類」
- `archived_at` 不為 NULL 表示已封存，記錄封存時間
- 刪除資料夾時物件不刪除，只是 `folder_id` 變 NULL（SET NULL）

### D2：搜尋用 SQLite FTS5

```sql
CREATE VIRTUAL TABLE listings_fts USING fts5(
  address, case_name, owner_name, property_type,
  content='listings', content_rowid='id'
);
```

- 使用 FTS5 虛擬表做全文搜尋
- 觸發器同步 listings → listings_fts
- 搜尋 API 支援 `?q=關鍵字&folder_id=X&include_archived=true`

### D3：列表 API 篩選參數

```
GET /api/listings?folder_id=1&archived=false&q=信義
```

- `folder_id`：篩選資料夾（空值 = 全部）
- `archived`：false（預設）= 不含封存；true = 只看封存；all = 全部
- `q`：FTS5 搜尋關鍵字

### D4：UI 佈局

```
┌──────────────────────────────────────────────┐
│  🔍 [搜尋...]                    [+ 新物件]  │
├──────────┬───────────────────────────────────┤
│ 📁 全部   │  物件列表                         │
│ 📁 夾A    │  ┌─────┬──────┬──────┬────────┐  │
│ 📁 夾B    │  │ 案名 │ 狀態 │ 房型 │ 動作   │  │
│ 📁 未分類 │  │ ...  │ ...  │ ...  │ ...    │  │
│ 📦 封存區 │  └─────┴──────┴──────┴────────┘  │
│           │                                   │
│ [+ 新資料夾]                                   │
└──────────┴───────────────────────────────────┘
```

左側欄顯示資料夾清單 + 封存區入口，右側為篩選後的物件列表。

## Implementation Distribution Strategy

| 任務類型 | 代理 | 理由 |
|---------|------|------|
| DB migration + API | Copilot CLI | 業務邏輯 + CRUD |
| FTS5 設定 + 觸發器 | Copilot CLI | SQL 類 |
| 前端列表頁改版 | Copilot CLI | UI 元件 |
| E2E 測試 | Sonnet 子代理 | 跨模組整合測試 |

預估 Token：約 12K（3 個 Copilot 任務 + 1 個 Sonnet 任務）
