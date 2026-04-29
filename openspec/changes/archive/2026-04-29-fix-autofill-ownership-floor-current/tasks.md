## Tasks

### Wave 1: 新增純函式
- [x] [Tool: copilot-codex] 新增 `normalizeOwnershipScope` 到 normalize.ts + 測試
- [x] [Tool: copilot-codex] 更新 normalize.test.ts（8 個測試案例）

### Wave 2: 修正 Parser
- [x] [Tool: copilot-codex] land-parser.ts：產出 `ownership_scope`
- [x] [Tool: copilot-codex] building-parser.ts：產出 `ownership_scope` + `floor_current`（層次提取）
- [x] [Tool: copilot-codex] field-mapping.ts：移除 4 個錯誤映射

### Wave 3: 測試更新
- [x] [Tool: copilot-codex] land-parser.test.ts：加 ownership_scope 測試
- [x] [Tool: copilot-codex] building-parser.test.ts：加 floor_current + ownership_scope 測試
- [x] [Tool: copilot-codex] e2e-autofill.spec.ts：更新映射測試
- [x] 最終驗收：407 tests 全通過（已執行）
