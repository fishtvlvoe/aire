# Tasks: fix-pdf-rendering-issues

## Wave 1 — 封面 + 法規 + 待補清除

- [ ] 1. [Tool: Copilot] 封面補齊所有欄位：修改 `src/lib/pdf-blocks/cover-page.tsx`，讀取 `data.cover` 所有欄位（承辦人 handlingAgent、經紀人 licensedAgentName、經紀人證書字號 licensedAgentCertNo、經紀業公司名 brokerageCompanyName、經紀業證照號碼 brokerageLicenseNo、公司地址 companyAddress、公司電話 companyPhone），以表格形式渲染在封面。驗證：產出 PDF 封面包含所有 cover 欄位。

- [ ] 2. [Tool: Copilot] 法規告知補齊完整內容：修改 `src/lib/pdf-blocks/legal-page.tsx`，加入完整的法定告知事項（依不動產經紀業管理條例第 23 條至第 26 條相關規定），不只列出 legalClauses 陣列內容，還要包含標準法規告知文字。驗證：法規告知頁有完整法條內容。

- [ ] 3. [Tool: Copilot] 全域「待補」改空白：搜尋所有 pdf-blocks 下使用 `"待補"` 的地方，全部改為 `""`（空字串），讓業務可以手寫填入。驗證：PDF 中不再出現「待補」文字。

## Wave 2 — 排序 + 重複簽章 + 標題修正

- [ ] 4. [Tool: Copilot] 調整頁面排序：修改 `src/lib/pdf-engine/document.tsx` 中 LandPages 和 BuildingPages 的頁面順序，依客戶版格式排列：封面 → 法規告知 → 物件資料表 → 標示/權利/管理/使用管制/交易條件/其他 → 費用一覽表 → 增值稅概算表 → 現況調查表 → 成交行情 → 生活機能 → 位置圖 → 外觀圖 → 簽章欄。驗證：PDF 頁面順序符合客戶版。

- [ ] 5. [Tool: Copilot] 移除重複簽章欄：修改 `src/lib/pdf-engine/document.tsx`，只在最後一頁保留簽章欄，移除第 11 頁的重複簽章。驗證：PDF 中簽章欄只出現一次。

- [ ] 6. [Tool: Copilot] 成交行情表標題修正：修改 `src/lib/pdf-blocks/transaction-history.tsx`，將「透明房價一覽表」改為「附近地段實價登錄成交行情」。驗證：PDF 中標題正確。

## Wave 3 — 自動填入 + 圖片亂碼修正

- [ ] 7. [Tool: Copilot] 自動帶入成交統計：修改 `src/lib/pdf-blocks/land-detail-pages.tsx`（第七項其他重要事項），從 `data.transactionHistory` 計算：周遭成交行情（最近一筆地址+價格）、近期成交均價（所有筆均價）、近期成交案數（筆數）。驗證：PDF 第七項相關欄位有自動計算值。

- [ ] 8. [Tool: Copilot] 修正地圖/圖片佔位渲染：修改 `src/lib/pdf-blocks/location-map.tsx`、`src/lib/pdf-blocks/exterior-photo-page.tsx`、`src/lib/pdf-blocks/life-amenities-page.tsx`，無圖片時渲染清晰的中文佔位文字（如「位置圖（待取得地圖資料後自動填入）」），不使用可能產生亂碼的元素。驗證：PDF 無亂碼頁面。

## Wave 4 — 驗證

- [ ] 9. [Tool: 主對話] 重新產出土地版 + 建物版 PDF，逐頁截圖驗證所有修正。
