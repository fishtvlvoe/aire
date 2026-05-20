## Context

目前 `cases` 表 status CHECK 約束為 `('draft','completed','exported')`，Rust `Case` struct 記錄為 `String`，前端 `CaseRow.status` 為三值 union。新增 `keyin` 狀態需同時更新：(1) SQLite schema（不可直接 ALTER CHECK constraint，需新 migration）、(2) Rust IPC 層、(3) TypeScript 型別與 UI。

## Goals / Non-Goals

**Goals**
- 新增 `keyin` 狀態，建立完整 draft → keyin → completed → exported 流程
- `KeyinSplitPage` mount 時自動呼叫 `mark_keyin`（無痛、idempotent）
- 案件列表顯示四個獨立 Badge

**Non-Goals**
- 不新增狀態篩選 UI
- 不允許任何反向轉換

## Design

### 1. SQLite Migration

新建 `src-tauri/migrations/004_case_status_keyin.sql`：
```sql
-- SQLite 不支援 ALTER TABLE 修改 CHECK constraint，需 recreate
-- 建立新表 → 複製資料 → 刪舊表 → 重新命名
CREATE TABLE cases_new (
  id TEXT PRIMARY KEY,
  case_no TEXT,
  property_type TEXT NOT NULL,
  land_lot_no TEXT NOT NULL,
  address TEXT NOT NULL,
  owner_name TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','keyin','completed','exported')) DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  case_name TEXT,
  building_lot_no TEXT,
  asking_price INTEGER
);
INSERT INTO cases_new SELECT * FROM cases;
DROP TABLE cases;
ALTER TABLE cases_new RENAME TO cases;
```

### 2. Rust IPC: mark_keyin 命令

新增於 `src-tauri/src/commands/cases.rs`：
```rust
#[tauri::command]
pub async fn mark_keyin(case_id: String, db: State<'_, DbState>) -> Result<cases::Case, IpcError> {
    let conn = lock(&db)?;
    let mut c = cases::get_case(&conn, &case_id)...;
    match c.status.as_str() {
        "keyin" => return Ok(c),  // idempotent
        "completed" | "exported" => return Err(IpcError::new("invalid_status_transition", "...")),
        _ => {}
    }
    c.status = "keyin".into();
    c.updated_at = now_secs();
    cases::update_case(&conn, &c)?;
    Ok(c)
}
```

同時更新 `mark_completed`：接受 `"keyin"` → `"completed"` 轉換（目前只接受 `"draft"` → `"completed"`）。

### 3. Rust lib.rs 登錄

在 `src-tauri/src/lib.rs` 的 `invoke_handler!` macro 新增 `mark_keyin`。

### 4. TypeScript: cases-api.ts

```typescript
export interface CaseRow {
  status: "draft" | "keyin" | "completed" | "exported";
  ...
}
const STATUS_LABEL = {
  draft: "草稿",
  keyin: "填入中",
  completed: "完成",
  exported: "已匯出",
};
// 新增 markKeyin API
markKeyin: (caseId: string) => invokeIpc<CaseRow>("mark_keyin", { caseId }),
```

### 5. 前端 StatusBadge（cases/page.tsx）

```tsx
function StatusBadge({ status }: { status: CaseRow["status"] }) {
  if (status === "keyin") return <Badge className="bg-blue-100 text-blue-800" data-testid="status-badge-keyin">填入中</Badge>;
  if (status === "completed") return <Badge className="bg-green-100 text-green-800" data-testid="status-badge-completed">完成</Badge>;
  if (status === "exported") return <Badge className="bg-green-100 text-green-800" data-testid="status-badge-exported">已匯出</Badge>;
  return <Badge variant="secondary" data-testid="status-badge-draft">草稿</Badge>;
}
```

### 6. KeyinSplitPage auto-transition

```tsx
useEffect(() => {
  void casesApi.markKeyin(caseId).catch(() => {}); // 靜默失敗，不中斷 UX
}, [caseId]);
```

## Implementation Contract

**C1 mark_keyin 狀態機**
- `draft → keyin`：成功
- `keyin → keyin`：idempotent（回傳現有 case，不更新 updated_at）
- `completed` / `exported` → `keyin`：error `invalid_status_transition`

**C2 mark_completed 接受 keyin**
- `keyin → completed`：成功（與現有 `draft → completed` 邏輯並存）

**C3 StatusBadge 四值映射**
- 每個 status 各有唯一 `data-testid="status-badge-{status}"`
- `exported` 顯示「已匯出」而非「完成」

**C4 KeyinSplitPage 不中斷 UX**
- `mark_keyin` 呼叫失敗時靜默吞掉錯誤（catch(() => {})），不影響表單使用

## Risks

- **Migration 執行時機**：Tauri 在 app 啟動時執行所有 pending migrations（`rusqlite_migration`），現有開發資料庫會自動執行，無需手動干預
