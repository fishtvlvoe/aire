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

#### Scenario: Building case requires land and zoning data

- **GIVEN** 案件類型為建物或成屋
- **WHEN** 系統執行正式地政查詢
- **THEN** 系統 SHALL 查詢建物資料所需 API
- **AND** 系統 SHALL 查詢對應土地、土地權利、使用分區、建蔽率與容積率可取得來源
- **AND** PDF 物調表 SHALL NOT 因案件是建物而讓土地區塊全部空白

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

### Requirement: Missing registry items SHALL become actionable supplement fields

系統 SHALL 將地政來源稽核中的缺漏列轉成可處理補件，而不是只顯示 read-only 狀態。

#### Scenario: Source audit row needs manual value

- **GIVEN** 地政匯入資料顯示某欄位為「需人工提供」、「待資料」或「查詢未成功」
- **WHEN** 使用者進入補件或現場工作台
- **THEN** 系統 SHALL 顯示對應可填欄位或重試動作
- **AND** 使用者填入的補件值 SHALL 保存到案件資料
- **AND** PDF SHALL 使用該補件值並標示來源為人工或屋主提供

#### Scenario: User edits owner name in workbench

- **GIVEN** 工作台顯示屋主姓名或姓名比對欄位
- **WHEN** 使用者按「修改」並輸入新的屋主姓名後按「完成」
- **THEN** 系統 SHALL 將姓名寫回案件 `owner_name` 或權威補件資料
- **AND** 資料來源 JSON SHALL 顯示更新後姓名與來源
- **AND** PDF assembly SHALL 使用更新後姓名
- **AND** 所有權人比對狀態 SHALL 重新計算或標示待重新比對

### Requirement: Property sheet SHALL map complete registry and manual fields

物調表 SHALL 從 trusted registry data 與 manual supplement data 映射完整欄位，不得只顯示少數 demo 欄位。

#### Scenario: Property sheet contains registry mapped fields

- **GIVEN** 正式地政查詢回傳土地、建物與所有權資料
- **WHEN** 使用者預覽或匯出不動產說明書
- **THEN** 物調表 SHALL 顯示可取得的地段、地號、使用分區、土地面積、權利範圍、持分面積、建蔽率、容積率
- **AND** 物調表 SHALL 顯示可取得的取得日期、建物面積、登記坪數、主建坪數、附屬建物、公共設施、車位坪數、法定用途、主要建材、建築完成日、屋齡與樓層
- **AND** 系統 SHALL 對無法由地政取得的建物現況、格局、座向、管理費提供人工補件欄位

### Requirement: Browser dev mock state SHALL be clearly disclosed

系統 SHALL 在 browser development mock mode 清楚告知目前資料只存在本瀏覽器，不是正式共用資料。

#### Scenario: User opens two browsers on localhost

- **GIVEN** 使用者在兩個不同瀏覽器或 profile 開啟 `localhost`
- **WHEN** 系統使用 browser mock backend
- **THEN** 每個瀏覽器 SHALL 清楚標示這是本機 mock 資料
- **AND** 系統 SHALL NOT 暗示兩個瀏覽器會自動同步案件或補件
- **AND** 正式驗收 SHALL 使用 native/Tauri 或共享 backend path
