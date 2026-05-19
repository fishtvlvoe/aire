## 1. TDD 紅燈測試

- [x] [P] 1.1 寫 Rust 紅燈測試：`create_case_with_multiple_lots`（驗證 land_lots JSON 寫入 + land_lot_no 同步為 land_lots[0]）、`create_case_all_empty_lots_error`（全空地號應回傳 missing_field）— 測試在 `src-tauri/src/commands/cases.rs` `#[cfg(test)]` 區塊，跑 `cargo test` 驗證全紅燈
- [x] [P] 1.2 寫 TypeScript 紅燈測試：`CaseLotInput` 元件新增 row / 刪除 row / 最後一筆禁用刪除 — 測試在 `src/components/__tests__/CaseLotInput.test.tsx`，跑 `pnpm test` 驗證紅燈

## 2. DB + IPC 層

- [x] 2.1 建立 `src-tauri/migrations/008_land_lots.sql`：`ALTER TABLE cases ADD COLUMN land_lots TEXT DEFAULT '[]'`；在 `src-tauri/src/db/mod.rs` 的 MIGRATIONS 常數末尾加入 `include_str!("../../migrations/008_land_lots.sql")`
- [x] 2.2 更新 `src-tauri/src/db/cases.rs`：`Case` struct 新增 `pub land_lots: Vec<String>`；`list_cases` / `get_case` / `insert_case` / `update_case` 的 SQL + row mapping 加入 `land_lots`（JSON 序列化/反序列化）；DB 損壞 fallback 為 `vec![land_lot_no.clone()]`
- [x] 2.3 更新 `src-tauri/src/commands/cases.rs`：`CreateCaseInput` 和 `UpdateCaseInput` 加 `pub land_lots: Option<Vec<String>>`；`create_case` 和 `update_case` 命令填入 `land_lots` 邏輯（同步 land_lot_no = land_lots[0]、全空則回 missing_field）；在 `src-tauri/src/lib.rs` 不需額外改動（命令名稱不變）

## 3. 前端層

- [x] [P] 3.1 建立 `src/components/CaseLotInput.tsx`：多值地號輸入元件（`data-testid="case-lot-inputs"`），props: `value: string[]`, `onChange: (lots: string[]) => void`；至少 1 個 row，超過 1 個時顯示刪除按鈕；更新 `src/lib/cases-api.ts` 的 `CaseRow` 加 `land_lots: string[]`、`CreateCaseInput` / `UpdateCaseInput` 加 `land_lots?: string[]`
- [x] [P] 3.2 更新 `src/app/(dashboard)/cases/new/page.tsx`（或對應的新增案件表單元件）：地號欄位改用 `CaseLotInput` 元件，儲存時傳 `land_lots` 陣列給 `casesApi.createCase`
- [x] 3.3 更新說明書 HTML 預覽：在 `src/components/disclosure-form-residential.tsx` 和 `src/components/disclosure-form-land.tsx` 的「土地標示」區塊，渲染 `land_lots` 陣列為 `<ul data-testid="land-lots-list">` + `<li>` 列表；`pnpm test` 跑 UI 測試確認 testid 存在
