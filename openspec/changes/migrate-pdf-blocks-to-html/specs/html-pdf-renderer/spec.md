## MODIFIED Requirements

### Requirement: HTML 渲染引擎產出完整 A4 分頁 HTML

系統 SHALL 提供 `renderDisclosureHtml(data, options)` 函式，回傳完整不動產說明書 HTML。土地版包含 12+ 頁（封面、法規、物件資料表、土地標示、費用一覽、增值稅概算、現況調查表多頁、成交行情、生活機能、位置圖、外觀圖、簽章欄）。建物版包含 15+ 頁（含建物瑕疵/設備/管理/停車等額外調查題目）。

#### Scenario: 土地版完整渲染

- **WHEN** 傳入土地版 CaseDossierData（含完整資料）
- **THEN** 回傳 HTML 包含 12 個以上 `class="page"` div
- **THEN** 文字內容包含「物件資料」「費用一覽」「增值稅」「現況調查」「成交行情」「生活機能」關鍵字

#### Scenario: 建物版完整渲染

- **WHEN** 傳入建物版 CaseDossierData
- **THEN** 回傳 HTML 包含 15 個以上 `class="page"` div
