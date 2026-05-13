# AIRE UX 互動驗收 Checklist

> 依 `docs/ux-patterns.md` 規則對 AIRE Phase 1 每個畫面做手動互動驗收。
> 每項勾選 pass / fail / N/A，並附證據（截圖 / 錯誤訊息 / 行為描述）。

| # | 場景 | 預期行為 | 結果 |
| --- | --- | --- | --- |
| 1 | 開啟空 `/cases` | 顯示 EmptyState 卡片，文字「尚無案件，按右上角『新增案件』開始」+「新增案件」按鈕 | ☐ pass ☐ fail ☐ N/A |
| 2 | 進入 `/cases` 但 IPC 還沒回 | 顯示 LoadingState 置中 spinner + 「載入案件中」 | ☐ pass ☐ fail ☐ N/A |
| 3 | `list_cases` IPC 回錯 | 顯示 ErrorState 紅色卡片 + 錯誤原因 + 「重試」按鈕 | ☐ pass ☐ fail ☐ N/A |
| 4 | 點 `/cases` 列表「新增案件」 | 導航到 `/cases/new` | ☐ pass ☐ fail ☐ N/A |
| 5 | 點案件「刪除」 | 跳 Modal，title「刪除此案件？」、預設焦點在「取消」、確認按鈕為 destructive 樣式 | ☐ pass ☐ fail ☐ N/A |
| 6 | 刪除 Modal 按 Esc | Modal 關閉、無刪除動作、焦點回 `刪除` 按鈕 | ☐ pass ☐ fail ☐ N/A |
| 7 | 表單欄位修改 1 秒 | 右上角 indicator 從「儲存中」變「已儲存 HH:mm:ss」（Asia/Taipei） | ☐ pass ☐ fail ☐ N/A |
| 8 | `save_draft` IPC 失敗（如磁碟滿） | indicator 變紅「儲存失敗，已保留輸入」、欄位 state 不清空、繼續輸入仍 OK | ☐ pass ☐ fail ☐ N/A |
| 9 | 表單填一半 → 關視窗 → 重開案件 | 欄位值恢復（透過 onCloseRequested 強制 flush + 重開讀 disclosure_drafts） | ☐ pass ☐ fail ☐ N/A |
| 10 | 拔網路後啟動（已啟用 < 7 天） | 不打 OPCOS API、直接進主畫面 | ☐ pass ☐ fail ☐ N/A |
| 11 | 拔網路後啟動（已啟用 30 天以上） | 啟用畫面顯示「授權需要重新驗證，請連線網路」 | ☐ pass ☐ fail ☐ N/A |
| 12 | OPCOS API 回 401 revoked | 啟用畫面顯示「授權已被遠端撤銷，請重新啟用」、本機 SQLite 不刪 | ☐ pass ☐ fail ☐ N/A |
| 13 | 匯出 PDF 成功 | 綠色 toast「匯出成功」+ 「開啟所在資料夾」按鈕、3 秒後自動消失 | ☐ pass ☐ fail ☐ N/A |
| 14 | 匯出 PDF 失敗（檔案被佔用） | 錯誤訊息「檔案被其他程式占用，請關閉後重試」、`cases.status` 不變 | ☐ pass ☐ fail ☐ N/A |
| 15 | 按 `Cmd/Ctrl + N` 在 `/cases` | 導航到 `/cases/new` | ☐ pass ☐ fail ☐ N/A |
| 16 | 按 `Cmd/Ctrl + S` 在案件編輯頁 | 強制 flush 草稿（不等 debounce） | ☐ pass ☐ fail ☐ N/A |

## 驗收紀錄欄

| 驗收日期 | 驗收者 | AIRE 版本 | 通過率 | 備註 |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | Fish | 0.1.0 | __/16 | （首次驗收） |
