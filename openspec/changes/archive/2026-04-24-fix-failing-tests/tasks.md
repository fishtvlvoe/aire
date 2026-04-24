# Tasks: fix-failing-tests

## Wave 1: 分析與修復（spec: test-determinism）

- [x] [P] **Fix 1: transcript-parser.test.ts（4 個失敗）（spec: test-determinism）** [Tool: copilot-codex]
  在 `src/lib/__tests__/parsers/transcript-parser.test.ts` 中，YAML 格式測試呼叫 `parseTranscript(filePath, 'yaml')` 時，`readFile` 嘗試讀取不存在的 fixture 檔案。修復方式：使用 `vi.mock('fs/promises')`（同時 mock `node:fs/promises`）mock `readFile`，讓它回傳測試用 YAML 字串（包含建物面積、停車位、竣工日期、擔保債權等欄位）。驗證 4 個測試全部通過。

- [x] [P] **Fix 2: list-recent.test.ts（1 個失敗）（spec: test-determinism）** [Tool: copilot-codex]
  在 `src/lib/db/__tests__/list-recent.test.ts` 中，`executeListRecentListings` 的 SQL 有 `created_at < datetime('now', '-24 hours')` 條件。測試資料在當下時間插入，導致空 draft 未被過濾。修復方式：在測試中插入空 draft 資料時，用 SQL 將 `created_at` 設為 `datetime('now', '-25 hours')`，確保時間條件生效。驗證回傳 3 筆（排除 2 筆空 draft）。

- [x] [P] **Fix 3: field-visit-form.test.ts（1 個失敗）（spec: test-determinism）** [Tool: copilot-codex]
  在 `src/lib/form-renderer/__tests__/field-visit-form.test.ts` 中，`normalizeInitialData` 測試期望 nested object/array 被跳過，但 `src/components/forms/FieldVisitForm.tsx` 第 124-131 行用 `JSON.stringify` 將其納入。**已驗證 dead code**：呼叫鏈中（fill page → form.layout/photos 已先 stringify 寫進 form state → 存 DB → parseFieldVisitData 讀回 → 字串），`normalizeInitialData` 接收的 initialData 不會包含 nested object。修法：將 L124-131 改為 `if (typeof value === "object") continue;`（移除 JSON.stringify 分支）。

## Wave 2: 驗證

- [x] **全量測試驗證** [Tool: copilot-codex]
  執行 `npm run test`，確認 220/220 測試通過、40/40 檔案通過、0 failures。已通過：220/220 ✅。

---

**完成註記**：Wave 1 + Wave 2 全部完成，src/ 修改已 commit（commit hash 見 git log，message：`fix(tests): repair 6 failing tests`）。執行歷程備註：派工過程中 Copilot CLI 跑了 `git clean -fd` 把當時的 untracked openspec/changes/ 全刪，事後從 conversation 紀錄重建本 change 文件。已記入 `~/.claude/lessons.md` L050。

**代理分工護欄**：
- Codex 與 Cursor 已禁用（品質不穩），不在本 change 派工選項內
