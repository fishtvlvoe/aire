## 0. 分工概覽（apply 前先讀）

**本 change 共 18 個 task，分工如下**：

| 工具 | 負責 task 數 | 主要職責 |
|------|-------------|---------|
| `copilot-codex`（主力，不用 Sonnet） | 8 | 業務邏輯、API、navigation helper、DB 查詢 |
| `cursor-agent` | 4 | UI 元件改動（fill page buttons、FieldVisitForm forwardRef、Sidebar、documents page 按鈕文字） |
| `codex`（或 copilot fallback） | 4 | 撰寫測試、跑 build/lint/test、執行清理腳本、git |
| `kimi` | 2 | Wave 結尾 CR（correctness + i18n 掃描） |
| 主對話（Opus） | 0 | 僅整合：tasks.md 勾選、git commit message |

**Wave 順序**（依相依性）：
1. Wave 1：環境偵察（既有 FieldVisitForm 結構、documents page 按鈕位置、Sidebar 資料來源）
2. Wave 2：DB 層 + 清理腳本（listRecentListings + cleanup-empty-drafts）
3. Wave 3：FieldVisitForm 暴露 navigation helpers（forwardRef + callback）
4. Wave 4：fill page 按鈕重構 + documents page 英文移除 + Sidebar 套用過濾
5. Wave 5：測試（navigation helpers + DB filter + mixed-language scan）
6. Wave 6：驗收（build + lint + test + CR + 清理腳本試跑 + commit + push）

**Fallback 規則**：
- copilot 滿 → kimi CLI → sonnet 子代理
- cursor 失敗 → copilot gpt-5.2 → sonnet 子代理
- codex 滿 → copilot → bash 直接
- kimi MCP 超時 → kimi CLI → gemini CLI

切換時主動告知 Fish：「⚠️ [Agent X] 用量不足，切換至 [Y]」

---

## 1. 環境偵察（Wave 1）

- [x] 1.1 [Tool: copilot-codex] 讀 `src/app/listings/[id]/fill/page.tsx` 完整內容，回報：當前「儲存並前往補件」按鈕位置、onClick 行為、isComplete 如何使用、handleSubmit 邏輯。結論寫入本檔「偵察結果」區。
- [x] 1.2 [Tool: copilot-codex] 讀 `src/components/forms/FieldVisitForm.tsx`，回報：currentChapter state 如何管理、chapters 陣列如何 filter、setCurrentChapterId 的觸發點、isComplete 如何計算。結論寫入「偵察結果」。
- [x] 1.3 [Tool: copilot-codex] 找出側邊欄「最近物件」渲染位置（可能在 `src/components/Sidebar.tsx` 或其他 layout 元件），回報：資料來源（是否走 API？直接 query db？props 傳入？）、現有 listings 欄位使用情況。結論寫入「偵察結果」。
- [x] 1.4 [Tool: copilot-codex] 全站 grep 混雜文字：`rg -n '[A-Za-z]{3,}\s*[\u4e00-\u9fff]|[\u4e00-\u9fff]\s*[A-Za-z]{3,}' src/ --glob '*.tsx' --glob '*.ts'`，排除 comment 行。回報需修正的 string literal 清單。

## 2. DB 層 + 清理腳本（Wave 2）

- [x] 2.1 [Tool: copilot-codex] 修改 `src/lib/db/index.ts`（對應 Requirement: Recent listings sidebar filters out empty drafts；實作 Decision: 側邊欄過濾用 SQL WHERE，不在記憶體過濾）：新增 `listRecentListings(limit: number): Listing[]` 函數，SQL 同 design.md 的 WHERE 條件，預設 `limit=10`
- [x] 2.2 [Tool: copilot-codex] 新建 `scripts/cleanup-empty-drafts.ts`（對應 Requirement: One-time cleanup script removes pre-existing empty drafts；實作 Decision: 清理腳本用 tsx 執行而非 SQL migration）：
  - 開頭印「⚠️ 將執行 cleanup，請確認已備份 listings.db（cp listings.db listings.db.bak.$(date +%Y%m%d)）」
  - SELECT COUNT → 印「found N empty drafts, deleting...」
  - 執行 DELETE
  - 再印 remaining count
  - package.json 加 `"cleanup:drafts": "tsx scripts/cleanup-empty-drafts.ts"` alias

## 3. FieldVisitForm 暴露 navigation helpers（Wave 3）

- [x] 3.1 [Tool: cursor-agent] 修改 `src/components/forms/FieldVisitForm.tsx`（對應 Requirement: Field visit form exposes chapter navigation helpers for external control；實作 Decision: 用 callback prop + forwardRef 組合對外暴露章節導航 helper、Decision: hasNextChapter 跳過空章節）：
  - export type `NavigationState = { currentChapterId: string; hasNextChapter: boolean; isCurrentChapterComplete: boolean; isComplete: boolean }`
  - export type `FieldVisitFormHandle = { goToNextChapter: () => void }`
  - component 改 forwardRef<FieldVisitFormHandle, Props>
  - Props 新增 `onNavigationStateChange?: (state: NavigationState) => void`
  - 用 useEffect 監聽 [currentChapterId, form, chapters]，計算 state 並呼叫 onNavigationStateChange
  - useImperativeHandle 暴露 goToNextChapter — 實作：過濾 chapters.fields.length > 0，找 currentChapterId 的 index，切到 index+1；若已是最後則 no-op
  - 保留既有 chapter tabs 可點擊功能不動

## 4. fill page + Sidebar + documents page（Wave 4）

- [x] 4.1 [Tool: cursor-agent] 修改 `src/app/listings/[id]/fill/page.tsx`（對應 Requirement: Fill page navigation uses explicit primary action tied to completeness；實作 Decision: 用 callback prop + forwardRef 組合對外暴露章節導航 helper、Decision: 「暫存草稿」按鈕永遠在場，不隱藏、Decision: `hasNextChapter` 跳過空章節（chapter.fields.length === 0））：
  - useRef<FieldVisitFormHandle>()，useState<NavigationState>
  - 把既有「儲存並前往補件」按鈕整個刪除
  - 新增 primary button 根據 state 顯示：
    - `hasNextChapter && isCurrentChapterComplete` → enabled 「下一章節」（點擊 → ref.current?.goToNextChapter()）
    - `hasNextChapter && !isCurrentChapterComplete` → disabled 「下一章節」+ 提示「本章節還有必填未完成」
    - `!hasNextChapter && isComplete` → 並排兩顆主按鈕：「去秘書後補」(onClick → POST `/api/listings/${id}/field-visit` with isComplete=true then router.push(`/listings/${id}/supplementary`)) + 「直接產出文件」(onClick → POST `/api/listings/${id}/field-visit` with isComplete=true then router.push(`/listings/${id}/generating`))；並排按鈕下方一行 helper text「選『去秘書後補』讓秘書補齊法律/行情資料後產出完整文件；選『直接產出』立即產出，秘書欄位將留空」
    - `!hasNextChapter && !isComplete` → disabled「去秘書後補」+ disabled「直接產出」+ 提示「還有必填欄位未完成，無法產出」
  - 新增 secondary button 「暫存草稿」永遠顯示：onClick → POST `/api/listings/${id}/field-visit` with isComplete=false（保持 draft 狀態），router.push('/listings')
- [x] 4.2 [Tool: cursor-agent] 修改（實際修 `src/components/forms/SupplementaryForm.tsx`）（對應 Requirement: All user-facing labels use pure Traditional Chinese；實作 Decision: 中英混雜掃描採手動 regex + 人工覆核）：將「Generate Documents 產出文件」改為「產出文件」；其他若有中英混雜按鈕一併修。
- [x] 4.3 [Tool: cursor-agent] 修改（改用 `/api/listings` GET → `listRecentListings(10)`，Sidebar 不動）（偵察結果中 1.3 找到的實際檔案路徑）（對應 Requirement: Recent listings sidebar filters out empty drafts）：將「最近物件」資料來源改用 `listRecentListings(10)` 或同等過濾後的陣列。
- [x] 4.4 [主對話] grep 二次掃描確認無其他殘留，0 matches 通過（對應 Requirement: All user-facing labels use pure Traditional Chinese）：白名單 PDF/AI/URL/API/Claude/Next.js 不動；其他按鈕/header/tooltip 改純繁中。

## 5. 測試（Wave 5）

- [x] 5.1 [Tool: copilot] 撰寫 `src/components/forms/__tests__/field-visit-navigation.test.ts`（對應 Requirement: Field visit form exposes chapter navigation helpers for external control）：純函數測試 — 抽出「計算 hasNextChapter / 找下一個非空 chapter index」的邏輯到 helper function 並測 (a) 5 chapters 全非空 (b) 中間有空 chapter 時跳過 (c) 已是最後 chapter 時 hasNextChapter=false
- [x] 5.2 [Tool: copilot] 撰寫 `src/lib/db/__tests__/list-recent.test.ts`（對應 Requirement: Recent listings sidebar filters out empty drafts）：用 better-sqlite3 `:memory:` db，插入 5 筆資料涵蓋 (a) 空 draft (b) 部分填 draft (c) documents-ready 無 field_visit_data (d) 部分填 documents-ready (e) 空 draft 但 updated_at 較新，驗證 listRecentListings(10) 排除只有 (a) 且保留其他。
- [x] 5.3 [Tool: copilot] 撰寫 `scripts/__tests__/cleanup-empty-drafts.test.ts`（對應 Requirement: One-time cleanup script removes pre-existing empty drafts）：mock better-sqlite3、驗證 SELECT COUNT → DELETE → 印 count 的順序；測試冪等（第二次執行無異動）。

## 6. 驗收（Wave 6）

- [ ] 6.1 [Tool: codex] `npx tsc --noEmit` 確認本 change 新增檔案 0 TS 錯誤（既有 NextResponse.data 測試錯誤屬 noise，可忽略）
- [ ] 6.2 [Tool: codex] `npm run lint` 0 errors
- [ ] 6.3 [Tool: codex] `npm run build` 成功
- [ ] 6.4 [Tool: codex] `npm test` 全綠（含 3 個新測試檔）
- [x] 6.5 [gemini fallback] `kimi_analyze`（fallback gemini）correctness 濾鏡審 diff：聚焦 FieldVisitForm forwardRef + onNavigationStateChange 是否會造成 infinite re-render、useEffect 依賴陣列是否正確、fill page 按鈕條件分支是否窮舉
- [x] 6.6 [gemini fallback] `kimi_analyze`（fallback gemini）i18n 掃描濾鏡：針對 1.4 + 4.4 的修正結果，二次 grep 確認無遺漏中英混雜 string literals；排除白名單
- [ ] 6.7 [Tool: codex] 手動試跑清理腳本：`cp listings.db listings.db.bak.preview && npx tsx scripts/cleanup-empty-drafts.ts` → 確認刪除 count 合理（不會大於 sidebar 目測空 draft 數量 +/- 2）；若 count 異常大則停止並回報
- [ ] 6.8 [Tool: codex] `npm run dev` 手動驗收：(a) 新 listing 走到中段看到「下一章節」 (b) 必填未完成時「下一章節」disabled 有提示 (c) 最後一章未完成看到「儲存並產出」disabled 有提示 (d) 全填完點「儲存並產出」跳 /generating (e) 任何時候點「暫存草稿」跳回 /listings (f) 側邊欄不再有空草稿 (g) documents 頁按鈕是「產出文件」純中文
- [x] 6.9 git commit ✓
- [x] 6.10 git push ✓

## 6.5 UX 迭代 1：按鈕改圓形 icon-only 浮動（回溯紀錄，已完成並 push）

- [x] 6.11 [Tool: cursor-agent] 修改 `src/app/listings/[id]/fill/page.tsx`（對應 Requirement: Fill page navigation buttons use icon-only circular floating group；實作 Decision: 按鈕採 icon-only 圓形設計，不使用文字標籤（UX 迭代 1））：將「下一章節 / 暫存草稿 / 去秘書後補 / 直接產出文件」按鈕群改為 56×56 rounded-full，移除文字 label，改用 Heroicons Outline v2 inline SVG（24×24），hover tooltip 用 title attribute；配色：暫存灰 / 下一章節與秘書後補深藍 / 直接產出綠；disabled 用 opacity-40。commit d086eac 之後的 UX 追加 commit（已 push）。

## 7. UX 迭代 2：按鈕收進白框 + 雙框等寬（Wave 7，待實作）

**背景**：迭代 1 把按鈕改為 `fixed bottom-6 right-6` 浮動，使用者回饋按鈕視覺孤立（跑到白框外面看起來像別的 app 的元件）。迭代 2 修正按鈕歸屬感與雙框寬度一致性。

- [x] 7.1 [Tool: cursor-agent] 修改 `src/app/listings/[id]/fill/page.tsx`（對應 Requirement: Fill page layout aligns header and form cards and anchors action buttons inside the form card；實作 Decision: 按鈕用 sticky top-4 定位於白框內部右上角，而非 fixed 視窗右下（UX 迭代 2））：
  - 將「資料填寫」卡與「現勘表單」卡包進同一個 `max-w-[960px] mx-auto w-full` container（或現有 main 的合適寬度），確保 render 寬度一致
  - 確認父層無 `overflow: hidden`（會破壞 sticky）
  - 把既有 `fixed bottom-6 right-6 z-50` 按鈕容器從視窗邊移除，改置於「現勘表單」白框 JSX 內部（建議放在章節導覽上方或 form 容器內第一個 child）
  - 按鈕容器 class 改為 `sticky top-4 z-10 ml-auto flex gap-3 w-fit`（或 `absolute top-4 right-4` 配合父層 `relative`，以實際效果為準）
  - 保留迭代 1 的 56×56 圓形 icon-only 設計、配色、hover tooltip（不動視覺樣式）
  - 驗證：滾動表單時按鈕黏在白框內右上角 top-4 可見，不跑出白框、不被內容蓋住

- [x] 7.2 [Tool: cursor-agent] 實機驗收（由 cursor-agent 用 `playwright-cli` 或直接截圖回報）：
  - 在 `npm run dev` 啟動的 http://localhost:3000/listings/{某個 listing id}/fill 測試
  - 情境 1：非最後章節 → 右上角看到兩顆圓按鈕（暫存草稿灰 + 下一章節藍）
  - 情境 2：最後章節 → 右上角看到三顆圓按鈕（暫存 + 去秘書後補藍 + 直接產出綠）
  - 情境 3：捲動表單至頁面中段 → 按鈕仍固定在白框內右上角
  - 截圖儲存到 `/tmp/redesign-wave7-*.png` 以便回報

- [x] 7.3 [主對話/copilot] `npm run build` 通過，`npm test` 172+ 測試全綠（本 Wave 純 UI 調整，不改測試）
- [x] 7.4 [主對話] Kimi MCP（fallback gemini）correctness CR：檢查 sticky 父層是否有 overflow 陷阱、z-index stacking context 是否正確
- [x] 7.5 [主對話] git add + commit `style(fill): 按鈕收進表單白框內 sticky 定位 + 雙框等寬`、push

---

## 偵察結果（Wave 1 完成後填入此區）

- **fill page 現有按鈕結構**：
  - 有單一按鈕「儲存並前往補件」（submitting 時顯示「儲存中...」），disabled by `submitting`
  - 送出邏輯：POST `/api/listings/${listing.id}/field-visit` body `{ data: formData, isComplete }`；成功後 `router.push('/listings/${id}/supplementary')`
  - 若 `!isComplete` → 設 banner「尚有必填欄位未完成...」+ setHighlightMissing(true) 後直接 return（不送出）
  - 頁面已 'use client'；import useCallback/useEffect/useMemo/useState
- **FieldVisitForm 內部 state**：
  - 519 行；props 含 `onSave(formData, isComplete)` `propertyType` `initialData` `highlightMissing` `onJumpTo` `listingId`
  - 沒有 forwardRef / useImperativeHandle；可透過 onJumpTo 觸發外部切換 chapter
  - isComplete 為 component 內部變數（透過 onSave callback 回傳）
- **Sidebar 資料來源**：
  - `src/components/Sidebar.tsx` 是 client component，在 useEffect 內 fetch GET `/api/listings`
  - API route 用 `getAllListings()` → `SELECT * FROM listings ORDER BY created_at DESC`
  - 渲染用欄位：id / status / field_visit_data（JSON.parse 取 address）/ created_at
- **中英混雜 string literals 清單**：
  - 主要疑似在 UI 按鈕文字（待 Wave 4 針對 button / header / tooltip 精準掃）
  - 已確認：documents 頁「Generate Documents 產出文件」（要改為「產出文件」）
  - displayName（公寓/農地...）和 tests 的中文描述屬合理，不動
