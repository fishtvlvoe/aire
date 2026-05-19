## 1. 路由與頁面骨架
<!-- Req: System renders the keyin page as a left-right split layout, Supplement dialog -->

- [x] 1.1 建立 keyin 獨立路由，實現「System renders the keyin page as a left-right split layout」：在 `src/app/(dashboard)/cases/[id]/keyin/page.tsx` 建立新路由並導出 `KeyinPage` 元件，驗收：瀏覽器導向 `/cases/<有效id>/keyin` 回應 200，頁面標題顯示「補件 / Key-in」
- [x] 1.2 修改 `src/components/CaseListActions.tsx` 實現「Supplement dialog」新行為：將 補件 按鈕 `onClick` 改為 `router.push('/cases/${caseId}/keyin')`，驗收：點擊補件按鈕後 URL 跳至 `/cases/<id>/keyin`，無 modal 疊層出現

## 2. 左右分割版面元件
<!-- Req: System renders the keyin page as a left-right split layout -->

- [x] 2.1 建立 `src/components/KeyinSplitPage.tsx` 完成「System renders the keyin page as a left-right split layout」：實作左右各 50% 視窗寬度 flex 版面（左側 overflow-y-auto，右側 sticky），驗收：在 1280px 視窗寬度下，左右面板各自顯示完整內容且無遮蔽
- [x] 2.2 左側面板根據案件類型動態渲染：住宅用 `DisclosureFormResidential`、土地用 `DisclosureFormLand`，均透過 `onChange={(data) => setFormState(data)}` 串接，驗收：切換住宅/土地案件進入 keyin 頁，左側欄位集合符合對應類型

## 3. 右側 HTML 即時預覽
<!-- Req: HTML preview is embedded in the keyin split-page right panel, System renders disclosure document as HTML preview with template background -->

- [x] 3.1 建立 `src/components/DisclosureHtmlPreview.tsx` 實現「HTML preview is embedded in the keyin split-page right panel」：接受 `formState` prop，以 React 元件（非 iframe）渲染說明書 HTML 版面，驗收：`formState.agentName = "林美玲"` 時右側預覽立即顯示「林美玲」，不需頁面重載
- [x] 3.2 在 `KeyinSplitPage.tsx` 中串接 `formState` 至 `DisclosureHtmlPreview`，驗收：用 console.log 確認 `DisclosureHtmlPreview` 在每次左側欄位變更後重新渲染，且 re-render 延遲 ≤ 100ms

## 4. 自動儲存擴充
<!-- Req: System auto-saves draft on keyin page with debounce and interval -->

- [x] 4.1 在 `src/lib/use-draft-autosave.ts` 加入 15 秒 interval，完成「System auto-saves draft on keyin page with debounce and interval」的 interval heartbeat：以 `setInterval(save, 15000)` 呼叫 `save_draft` IPC，unmount 時 `clearInterval`，驗收：keyin 頁面掛載 15 秒後，SQLite `disclosure_drafts` 表中該案件的 `updated_at` 時間戳更新
- [x] 4.2 加入離開前 flush：在 `useEffect` cleanup 中立即呼叫 `save_draft`，驗收：填入任意值後立即離頁，重新進入 keyin 頁確認欄位值已保留

## 5. SQLite WAL 模式
<!-- Req: SQLite WAL mode is active for draft persistence -->

- [x] 5.1 在 Rust SQLite 連線初始化處確保「SQLite WAL mode is active for draft persistence」：`Connection::open` 後執行 `PRAGMA journal_mode=WAL`，驗收：啟動 app 後 Rust log 出現「journal_mode = wal」，或以 `sqlite3 CLI` 執行 `PRAGMA journal_mode;` 確認回傳 `wal`

## 6. 草稿還原 Toast

- [x] 6.1 在 `KeyinSplitPage.tsx` mount `useEffect` 中呼叫 `get_draft`，有草稿則 `setFormState` 預填並顯示 `sonner` toast「已還原上次未儲存的草稿」，驗收：強制關閉 app 後重開進入同案件 keyin 頁，toast 出現且欄位顯示上次填值

## 7. 廢棄元件清理
<!-- Req: Supplement dialog, System renders disclosure document as HTML preview with template background -->

- [x] 7.1 刪除 `src/components/CaseSupplementDialog.tsx`，完成「Supplement dialog」元件廢棄：移除所有 import，驗收：`grep -r "CaseSupplementDialog" src/` 回傳空結果，`npm run build` 0 錯誤
- [x] 7.2 刪除 `src/components/PdfPreviewer.tsx`，完成「System renders disclosure document as HTML preview with template background」舊實作廢棄：移除所有 import，驗收：`grep -r "PdfPreviewer" src/` 回傳空結果，`npm run build` 0 錯誤
