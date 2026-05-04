## 1. 移除建立流程中的補件 UI（d3：移除範圍）

- [x] 1.1 移除 listings/[id]/page.tsx 中的「補件資料」tab 和「前去補件」按鈕，只保留基本資料 + 謄本資料。實現 d3：移除範圍。對應 Requirements "Listing creation form excludes supplementary tab"、"Supplementary form removed from listing creation flow" [Tool: copilot-codex]

## 2. 補件狀態計算（d1：三態 icon 定義）

- [x] 2.1 建立 `src/lib/listings/supplementary-status.ts`：三態計算函式（not-started / missing / complete），根據物件狀態 + 必填欄位填寫情況判斷。實現 d1：三態 icon 定義。對應 Requirement "Three-state completeness calculation for list icon" [Tool: copilot-codex]

## 3. 列表 icon 欄位

- [x] 3.1 建立 `src/components/listings/SupplementStatusIcon.tsx`：根據三態顯示 ⚠️ / ✅ / ── icon，點擊導航到 /listings/[id]/supplement。對應 Requirements "Supplementary status icon on listing row"、"Listing list includes supplement status column" [Tool: copilot-codex]
- [x] 3.2 修改 listings/page.tsx 列表表格，在「狀態」和「動作」之間新增「補件」欄位顯示 icon。對應 Requirement "Listing list includes supplement status column" [Tool: copilot-codex]

## 4. 獨立補件路由（d2：獨立路由）

- [x] 4.1 建立 `src/app/listings/[id]/supplement/page.tsx`：獨立補件頁面，載入現有補件表單元件，加上「返回列表」連結，提交後導回列表頁。實現 d2：獨立路由。對應 Requirements "Independent supplementary page route"、"Supplementary form accessible via independent route" [Tool: copilot-codex]

## 5. 測試

- [x] 5.1 E2E 測試：確認建立表單無補件 tab → 列表 icon 顯示正確（三態）→ 點 icon 進入補件頁 → 填寫後 icon 更新為 ✅ → 返回列表頁。覆蓋所有 specs scenarios [Tool: sonnet]
