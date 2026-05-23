## Alignment

Fish 要的不是「可以產一份半空白 PDF」，而是：

```
屋主同意 + 地址 + 屋主姓名
  -> AIRE 真的打地政 API
  -> 把有回來的謄本/圖資/法規/公司資訊放進 PDF
  -> 沒回來的欄位才標補件或待確認
```

目前錯在資料層級被混在一起：

| 資料類型 | 意義 | 可以做什麼 | 不可以做什麼 |
| --- | --- | --- | --- |
| 地址候選 `public_candidate` | 只證明地址可能對到某地號/建號 | 建立案件、提示待確認 | 當正式謄本輸出 |
| 正式 API `moi_api` | 已授權、正式調閱回傳 | 進 PDF、進正式欄位 | 被候選資料覆蓋 |
| 手動/屋主提供 `manual` | 使用者或屋主提供 | 進 PDF 並標來源 | 偽裝成 API 回傳 |
| mock | 開發假資料 | 測試 UI | 客戶 PDF 或交付驗收 |

## Required Data Flow

### 1. 新增案件

新增案件可以做地址候選判斷，但只能存成候選層：

- `registry_candidates`: 地址 lookup 與公開/候選資訊。
- `registry_trusted`: 正式 API 或人工確認資訊。
- `registry_failures`: 每個 API 的失敗原因與是否可重試。

若目前仍使用單一 `land_registry_data` 欄位，內部 schema 必須能清楚分層，且 PDF assembly 不得把 candidate 當 trusted。

### 2. 屋主授權

授權狀態不可只是一個 UI dialog。授權成功後應有可驗證狀態：

- `recordConsent(caseId)` 成功。
- UI 顯示此案件已具備正式查詢前提。
- 正式 pull button 或自動正式 pull 可執行。
- 若缺 API key、權限或餘額，顯示可行修復訊息。

### 3. 正式地政 Pull

有授權後至少要嘗試：

- 建物標示資料。
- 建物所有權資料。
- 他項權利/抵押權資料。
- 土地標示、土地所有權、地價/分區等與物件相關資料。

輸入不可只用 `lot_number = 0001`。地址 lookup 回傳若沒有足夠正式 parcel id/building id，系統要讓使用者補建號/地號，或使用已知可查 API 做下一步查詢。

### 4. PDF Assembly

PDF assembly 規則：

```
trusted moi_api/manual -> 直接填 PDF
candidate only -> 顯示待確認，不阻止正式 pull
failed -> 顯示原因與重試/補件
mock -> 不得進客戶 PDF
```

若 persisted payload 只有候選或 failed，`assembleDossierData()` 不得提早結束正式 API pull。

### 5. 圖資

位置圖、空拍圖、街景/外觀圖要分成三種狀態：

- 已取得圖片 bytes：PDF 必須嵌入圖片。
- 使用者已上傳：PDF 使用上傳圖。
- 未取得：PDF 顯示空白框與補件說明。

驗收不能只看 PDF 下載成功，必須用 `pdfimages -list` 或視覺檢查確認圖片真的存在。

### 6. 設定與品牌欄位

設定頁需要完整保存並回填 PDF：

- 承辦人。
- 經紀人。
- 經紀人證號。
- 不動產業者。
- 經紀業者編號。
- 公司地址。
- 公司電話。

封面、頁首/頁尾、簽章欄不得只留空 label。

### 7. 法規內容

法規內容要有 source of truth，不可只靠目前幾條 hardcoded 文案：

- 優先使用本地 legal clauses cache。
- 可手動同步 OPCOS 法規來源。
- PDF 法規告知頁與必要章節要完整列出目前產品定義的法規集合。
- 若同步失敗，顯示版本/缺漏，不默默少列。

## Verification Plan

1. 用真實 native/Tauri 或 backend integration path 驗正式 pull，不接受 mock-only。
2. 用 `0005` 類似地址與屋主姓名重建案件，執行授權、正式 pull、PDF 預覽、PDF 匯出。
3. 用 `pdftotext` 檢查謄本欄位、法規、公司/經紀資訊。
4. 用 `pdfimages -list` 檢查圖資是否真的嵌入。
5. 用 Playwright headed E2E 驗 UI，但只作為使用流程驗收，不作為 API 真實性證據。
