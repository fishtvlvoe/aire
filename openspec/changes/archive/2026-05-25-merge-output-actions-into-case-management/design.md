## Goals

- 一級選單只保留真正不同的工作區：案件管理、地政資料、系統設定。
- PDF 預覽與匯出改成案件列表中的案件操作，不再要求使用者先進入另一個「產出文件」資料夾。
- 每個 URL 只標亮一個子選單，避免使用者看到兩個 active 狀態。
- 新增案件只保留一個主要地政判斷入口；工作台不能出現看似能按但沒有結果的假按鈕，且每個步驟要符合使用者實際審核順序。

## Non-Goals

- 不改 PDF 預覽頁主框架和下載 API。
- 不設計新的批次列印流程。
- 不移除案件工作台內既有的 PDF 預覽入口。
- 不在本 SR 完成正式地政重查、補件自動產生與現場必問後端串接。

## Design Decisions

### 1. 產出是案件動作，不是一級模組

PDF 預覽與匯出都依賴一個案件，因此入口放在案件列表每列操作區最符合使用者行為。左側一級選單移除「產出文件」，避免多一層分類但內容和案件列表重複。

### 2. 操作區用明確文字替代只靠圖示猜測

案件列保留 compact action，但 action 必須有清楚 accessible name：

- 補件
- 預覽 PDF
- 修改
- 刪除
- 匯出 PDF

### 3. Query route active state 必須精準比對

`/settings` 才標亮「個人設定」；`/settings?section=plans` 只標亮「方案與升級」。active 判斷使用完整 href 比對，不用只看 pathname。

### 4. 新增案件只有一個主流程入口

使用者先填地址，再按表單底部的主要按鈕。未完成地政判斷時，主要按鈕文字為「判斷地政資料」，點擊後執行判斷；判斷完成後同一顆按鈕才變成「建立案件」。不保留地址欄旁邊的第二顆重複判斷按鈕。

### 5. 工作台按鈕必須有可見結果

補件與現場必問是同一個使用情境：客戶來電、LINE 傳照片、現場看屋或事後補件都要進同一張表單。補件區保留圖資上傳欄位、現場必問填寫欄位與「加入補件清單」；不再保留獨立的 `現場必問` 或 `手動上傳覆蓋` 假按鈕。

### 6. 工作台只保留一組章節切換

上方 `欄位 / 資料來源 / 補件/現場 / PDF 檢查` 是唯一的工作分頁。左側案件區只保留物件摘要，不再放第二組「說明書章節」按鈕，避免同一功能出現在兩個位置。

### 7. 成交行情 fallback 不可假裝成不同地址的真資料

實價登錄正式資料源尚未完成時，mock/fallback 仍必須跟案件行政區與路段一致。永康/勝利街案件不能顯示東區裕農路資料。PDF 組資料同時支援 `date` 與 `transaction_date`，避免畫面日期掉成 `—`。

### 8. 資料來源與費用要在審核前段可確認

欄位審核要先顯示本次調閱費用，讓使用者知道這次地政查詢成本。資料來源分頁要顯示地政匯入、待補件與查詢失敗的來源狀態，並提供 JSON 預覽/下載，避免使用者只能到 PDF 檢查才知道資料是否存在。

### 9. 個人設定不是方案授權頁

`/settings` 只管理個人名稱、Email、密碼、品牌色與 Logo；帳號授權狀態、目前方案與升級功能放在 `/settings?section=plans`。操作紀錄不混在個人設定假裝可改，未來若要看 log 應走專用操作紀錄頁。

### 10. 格局圖沒有素材時留空白框

業務第一次去現場通常還沒有正式格局圖。PDF 應保留格局圖/土地規劃圖空白框，供手繪或後續補圖。AI 格局圖只有核准後才插入；草稿轉換不自動放進正式 PDF。

## Implementation Contract

### Sidebar

- `getDemoSidebarFolders()` SHALL NOT include a folder labelled `產出文件`.
- The `案件管理` folder SHALL include `案件總覽`, `新增案件`, `物件審核`, `補件清單`.
- The sidebar SHALL NOT render links labelled `PDF 預覽` or `列印與匯出`.
- When current route is `/settings?section=plans`, `方案與升級` SHALL be active and `個人設定` SHALL NOT be active.

### Case actions

- Case overview rows SHALL expose an action named `預覽 PDF`.
- Clicking `預覽 PDF` SHALL navigate to `/cases/:id/preview`.
- Case overview rows SHALL expose an action named `匯出 PDF`.
- Clicking `匯出 PDF` SHALL keep using the existing `export_pdf` command path.
- Clicking the row itself SHALL continue to open the case workbench.
- Case overview rows SHALL NOT expose a separate `開啟工作台` action because row click already owns that behavior.

### New case flow

- The address input area SHALL NOT render a second inline `判斷地政資料` button.
- If no registry classification exists, submitting the form SHALL execute registry detection and SHALL NOT create the case in the same click.
- After classification is visible, the primary button SHALL become `建立案件`.

### Workbench review flow

- The workbench tabs SHALL be `欄位`, `資料來源`, `補件/現場`, and `PDF 檢查`.
- The `欄位` tab SHALL show the current land-registry query cost before the user reaches PDF check.
- The `資料來源` tab SHALL show imported fields, source services, statuses, JSON preview, and JSON download.
- The `補件/現場` tab SHALL render upload controls for `地籍圖`, `空拍圖`, `格局圖`, `地標圖`, and `LINE 照片`.
- The `補件/現場` tab SHALL render editable field-visit questions in the same panel as supplement uploads.
- The supplement area SHALL NOT render dead `現場必問` or `手動上傳覆蓋` buttons; manual replacement is represented by the upload controls and field-visit form.
- The workbench sidebar SHALL NOT render a second `說明書章節` button group that duplicates the top work tabs.
- Mock real-price records for a Yongkang Shengli case SHALL use Yongkang addresses and SHALL NOT use fixed Yudong/Yunong Road rows.
- PDF dossier assembly SHALL map either `transaction_date` or `date` into the displayed transaction date.
- The workbench SHALL use `物件審核` as the customer-facing title and sidebar entry, and SHALL NOT render developer-facing connection status text such as `後端串接中`.
- The workbench summary sidebar SHALL not repeat the full address-classification explanation; it SHALL show a compact object summary and the distinction between registry-imported and user-filled items.

### Settings and PDF assets

- The profile settings page SHALL include editable controls for name, Email, password, brand color, and logo.
- The profile settings page SHALL NOT show account/license management or a generic operation-log card.
- The plan upgrade page SHALL show account/license management and feature toggles.
- Feature toggles SHALL use `未啟用` / `已啟用` state labels and SHALL describe the reserved feature area as `目前正在開發中。`.
- The PDF floor-plan page SHALL render a blank frame when no uploaded or approved floor-plan asset exists.
- Draft AI floor-plan conversions SHALL NOT be inserted into the PDF dossier.

## Risks

- Existing tests assert the removed `產出文件` folder and old `view=pdf/export` flows; those tests must be updated to the new IA.
- Icon-only buttons may be hard to understand; accessible names must be explicit even if the button remains compact.
- If the primary button changes state after detection, tests must assert the two-step behavior so later refactors do not reintroduce duplicate detection controls.
- Mock real-price rows are not production data; the UI should not imply a formal real-price integration is complete until the future data-source SR connects it.
