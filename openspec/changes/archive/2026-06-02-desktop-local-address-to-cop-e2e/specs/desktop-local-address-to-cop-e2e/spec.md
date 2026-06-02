## ADDED Requirements

### Requirement: Confirmed registry fields SHALL persist into formal COP workflow

系統 SHALL 在使用者於地址查詢流程確認物件後，保存以下欄位到案件本機資料，供正式 COP pull 與後續 PDF 使用：

- 地段
- 地號
- 建號
- 土地面積
- 公告現值
- 公告地價

#### Scenario: Confirmed candidate carries extended land fields

- **GIVEN** 使用者在 `/cases/new` 查到地址候選並確認目標物件
- **WHEN** 系統保存 `confirmed_registry_match`
- **THEN** `section_name`, `land_no`, `building_no`, `land_area_sqm`, `announced_land_current_value`, `announced_land_value` SHALL 一起保存
- **AND** 後續 formal COP pull SHALL 以該 confirmed key 作為正式查詢輸入

#### Scenario: Manual confirmation still preserves extended fields

- **GIVEN** 地址候選不足，使用者手動補填地段 / 地號 / 建號 / 公告值欄位
- **WHEN** 使用者建立案件
- **THEN** 系統 SHALL 保存這些欄位於 `confirmed_registry_match`
- **AND** 案件 SHALL 標示其來源為 manual / reference，而非 trusted COP

### Requirement: Mac-first address-to-COP-to-PDF flow SHALL be accepted before Windows work resumes

系統 SHALL 先在本機 Web / Mac App 跑通「地址查詢 → formal COP → PDF」主流程，再繼續 Windows 驗收。

#### Scenario: Mac flow not yet proven

- **GIVEN** 還沒有 Mac smoke 證據顯示 `/cases/new` 到 PDF 匯出成功
- **WHEN** implementer 試圖把 Windows acceptance 當成主 blocker
- **THEN** 本 change SHALL 視為未完成
- **AND** Windows work SHALL 保持次順位

### Requirement: Free pre-survey SHALL remain usable when the user skips formal COP

系統 SHALL 允許使用者在未執行 formal COP 的情況下，繼續保存案件、使用免費前查資料，並產出 reference 版本 PDF；只有正式 trusted 欄位不得冒充為已查謄本。

#### Scenario: User confirms candidate but does not run paid formal query

- **GIVEN** 使用者已完成地址前查並確認地段 / 地號 / 建號
- **AND** 使用者選擇不執行付費正式查詢
- **WHEN** 使用者保存案件並進入 PDF 預覽
- **THEN** 系統 SHALL 允許顯示與匯出使用免費前查資料組裝的 reference PDF
- **AND** 案件 SHALL 保留 `manual / reference` 或 `registry_pending` 狀態，而非標記為 trusted COP
- **AND** 正式地政欄位若無 trusted data SHALL 維持空白或標示為待補
