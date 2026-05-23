## Purpose

確保 AIRE 在使用者已有屋主授權、地址與屋主姓名時，會走正式地政 API 與可交付 PDF 路徑，而不是只輸出地址候選資料與空白 PDF。

## ADDED Requirements

### Requirement: Authorized cases SHALL use formal registry pull before client PDF output

系統 SHALL 在案件具備屋主授權與所有權人姓名時，執行正式地政 API pull，並將正式回傳資料保存為 trusted registry data。

#### Scenario: Authorized building case is pulled

- **GIVEN** 案件有地址、所有權人姓名與授權紀錄
- **WHEN** 使用者執行正式地政查詢或產出客戶 PDF
- **THEN** 系統 SHALL 呼叫正式 `land_registry_pull_data`
- **AND** 回傳成功的資料 SHALL 以 trusted `moi_api` provenance 保存
- **AND** PDF SHALL 使用 trusted 資料填入謄本欄位

### Requirement: Candidate registry data SHALL NOT block formal pull

系統 SHALL 將地址候選資料視為線索，而不是正式調閱完成狀態。

#### Scenario: Existing case has only public candidate data

- **GIVEN** 案件 `land_registry_data` 只有 `public_candidate` 或 failed entries
- **WHEN** 使用者已有授權並產出 PDF
- **THEN** 系統 SHALL NOT 把 candidate 當成正式資料
- **AND** 系統 SHALL 嘗試正式 API pull 或要求補齊正式查詢所需地號/建號
- **AND** PDF SHALL NOT 因 candidate payload 存在而跳過正式 pull

### Requirement: Client PDF SHALL contain images when image bytes are available

系統 SHALL 在位置圖、空拍圖、街景/外觀圖或使用者上傳圖資存在時，將圖片嵌入 PDF。

#### Scenario: PDF has fetched image bytes

- **GIVEN** 圖資服務或案件上傳圖資回傳有效 bytes
- **WHEN** PDF 匯出
- **THEN** PDF SHALL 包含對應圖片物件
- **AND** `pdfimages -list` SHALL 顯示圖片

### Requirement: Client PDF SHALL expose missing data honestly

系統 SHALL 對 API 查無、權限不足或尚未補件欄位顯示具體原因，並保留可補件位置。

#### Scenario: Formal pull partially fails

- **GIVEN** 部分正式 API 成功，部分 API 失敗
- **WHEN** PDF 匯出
- **THEN** 成功欄位 SHALL 顯示正式資料
- **AND** 失敗欄位 SHALL 顯示失敗原因或待補件
- **AND** 成功資料 SHALL NOT 因部分失敗被整份清空
