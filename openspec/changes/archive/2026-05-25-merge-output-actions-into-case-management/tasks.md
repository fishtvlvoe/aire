## Implementation

- [x] Implement Requirement: 側邊欄移除產出文件資料夾 and cover design decision: 產出是案件動作，不是一級模組 by updating navigation model and demo sidebar folders.
- [x] Implement Requirement: 案件列表提供 PDF 預覽與匯出動作 and cover design decision: 操作區用明確文字替代只靠圖示猜測 by adding a direct preview action and explicit action labels.
- [x] Fix query route active state so settings query pages do not also highlight 個人設定, covering query route active state 必須精準比對.
- [x] Cover Case actions contract by keeping row-click workbench navigation separate from PDF preview and export buttons.
- [x] Implement Requirement: 新增案件只保留單一地政判斷入口 and cover design decision: 新增案件只有一個主流程入口 / new case flow by making the primary form button perform detection before case creation and removing the duplicate inline detect button.
- [x] Implement Requirement: 工作台補件操作不可是無功能按鈕 and cover design decision: 工作台按鈕必須有可見結果 / workbench supplement actions by switching 現場必問 to its content and removing 手動上傳覆蓋 as a dead duplicate of upload fields.
- [x] Cover design decision: 工作台只保留一組章節切換 by removing the duplicate sidebar `說明書章節` button group and keeping top work tabs as the only chapter controls.
- [x] Implement Requirement: PDF 成交行情測試資料需符合案件地址 and cover design decision: 成交行情 fallback 不可假裝成不同地址的真資料 by returning Yongkang mock rows for Yongkang/Shengli cases and mapping `date` into PDF transaction dates.
- [x] Refine workbench naming and summary UX by renaming `說明書工作台` to `物件審核`, removing developer connection status chips, and reducing duplicate registry explanation in the left summary.
- [x] Implement Requirement: 工作台補件操作不可是無功能按鈕 and cover design decision: workbench review flow / 工作台只保留一組章節切換 by merging supplement and field-visit work into one `補件/現場` tab with editable field-visit questions, LINE/photo uploads, and visible supplement-list result.
- [x] Cover design decision: 資料來源與費用要在審核前段可確認 by exposing registry source review with imported/missing/failed rows plus JSON preview/download, and showing current registry cost in the first review step.
- [x] Implement Requirement: 個人設定與方案升級分工清楚 and cover design decision: 個人設定不是方案授權頁 by moving account/license management from profile settings into plan upgrade, and making profile settings editable for name, Email, password, brand color, and logo.
- [x] Change feature-toggle state labels to `未啟用` / `已啟用` and keep admin-only toggle behavior.
- [x] Implement Requirement: PDF 圖資缺稿時保留空白格局框 and cover design decision: 格局圖沒有素材時留空白框 / settings and pdf assets by rendering a blank PDF floor-plan/planning-map frame when no uploaded or approved floor-plan asset exists, while keeping draft AI conversions out of the dossier.
- [x] Update unit and E2E assertions for the simplified IA and case-row PDF actions.

## Verification

- [x] Run navigation/sidebar/cases unit tests.
- [x] Run type-check and focused Playwright E2E.
- [x] Run `spectra analyze merge-output-actions-into-case-management --json` and `spectra validate merge-output-actions-into-case-management`.
