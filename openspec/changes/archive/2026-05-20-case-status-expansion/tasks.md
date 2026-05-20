## 1. TDD — 紅燈測試

- [x] 1.1 [P] 寫 Rust 紅燈測試：`mark_keyin` 狀態機（draft→keyin、idempotent、拒絕 completed/exported；mark_completed 接受 keyin）
  驗收：`cargo test -- mark_keyin` 全部紅燈（compile error 或 test fail）
- [x] 1.2 [P] 寫 TypeScript 前端紅燈測試：`StatusBadge` 四值 + `statusLabel("keyin")` + `KeyinSplitPage` mount 呼叫 mark_keyin
  驗收：`pnpm test -- StatusBadge` 全部紅燈

## 2. Migration & Rust 實作

- [x] 2.1 新增 `src-tauri/migrations/004_case_status_keyin.sql`（recreate cases 表，CHECK 加入 keyin）
  驗收：`cargo build` 通過；migration 文件存在
- [x] 2.2 實作 `mark_keyin` IPC 命令（`src-tauri/src/commands/cases.rs`），更新 `mark_completed` 接受 keyin
  驗收：Rust tests 1.1 全部綠燈
- [x] 2.3 在 `src-tauri/src/lib.rs` 的 invoke_handler! 登錄 `mark_keyin`
  驗收：`cargo build` 通過

## 3. TypeScript 前端實作

- [x] 3.1 [P] 更新 `src/lib/cases-api.ts`：status union 加 "keyin"、STATUS_LABEL 加 "填入中"、新增 `markKeyin` 方法
  驗收：TypeScript compile 通過
- [x] 3.2 [P] 更新 `src/app/(dashboard)/cases/page.tsx` 的 `StatusBadge`：四值 Badge + data-testid
  驗收：TypeScript tests 1.2 StatusBadge 部分全部綠燈
- [x] 3.3 更新 `src/components/KeyinSplitPage.tsx`：mount 時呼叫 `casesApi.markKeyin(caseId)`（靜默失敗）
  驗收：TypeScript tests 1.2 KeyinSplitPage 部分全部綠燈；`pnpm test` 0 regressions
