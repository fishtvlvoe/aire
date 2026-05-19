## 1. 本機資料與證據保存

- [ ] 1.1 Decision: Preserve original sketch before any conversion / Original field sketch evidence is preserved：建立 `floor_plan_sketches` 與 `floor_plan_conversions` migration，完成後以 SQLite migration smoke test 驗證 table、index、version unique constraint 正確。
- [ ] 1.2 Original field sketch evidence is preserved：實作 `upload_floor_plan_sketch`，讓原始手稿以不可覆蓋版本保存並記錄 sha256、uploaded_by、Asia/Taipei uploaded_at，完成後以 Rust unit tests 驗證同案件重傳會建立新版本。
- [ ] 1.3 Conversion audit trail is available for dispute review：實作 `list_floor_plan_conversion_history`，讓 manager 可依時間序看到原圖、草稿、修正、核准與 PDF 使用紀錄，完成後以 repository test 驗證排序與版本資料完整。

## 2. 表單入口與低複雜度 UX

- [ ] 2.1 Decision: Attach sketch conversion to the existing attachment floor plan field / Field sketch entry is attached to the existing floor plan field：在「附件 > 附建物平面圖」旁新增 FieldSketchFloorPlanPanel，完成後以 component test 驗證上傳、轉換、確認入口與既有欄位同屏出現。
- [ ] 2.2 Field sketch entry is attached to the existing floor plan field：讓助理可直接上傳業務帶回的鉛筆手稿照片，不要求 Magicplan/Homestyler 操作，完成後以手動 UI assertion 驗證一張 JPG 可進入待轉換狀態。
- [ ] 2.3 Decision: Attach sketch conversion to the existing attachment floor plan field：當有 approved converted plan 時 `attachment_floor_plan` 顯示為「是」，完成後以 form autosave test 驗證 payload 狀態與 UI 一致。

## 3. AI 讀圖與結構化草稿

- [ ] 3.1 Decision: Use AI as parser, not final artist / AI extraction creates a structured draft only：實作 `extract_floor_plan_sketch`，把手稿辨識成 FieldSketchExtraction JSON，完成後以 mocked OpenAI response test 驗證 rooms、openings、adjacency、uncertainty 被保存。
- [ ] 3.2 AI extraction creates a structured draft only：辨識信心不足或有 blocker uncertainty 時標記 `needs_correction` 並阻擋 approval，完成後以 validation tests 驗證缺房間數、矛盾相鄰關係、看不清標籤都會進入修正狀態。
- [ ] 3.3 Decision: Use AI as parser, not final artist：禁止 AI illustrative image 成為 final asset，完成後以 service test 驗證 final render path 只接受 confirmed structured data。

## 4. 系統重畫乾淨格局圖

- [ ] 4.1 Decision: Use AI as parser, not final artist / Clean floor plan is rendered deterministically：實作 deterministic renderer，從 reviewed structured data 產生黑白乾淨格局圖，完成後以 snapshot test 驗證相同 JSON 產出相同 image/SVG。
- [ ] 4.2 Clean floor plan is rendered deterministically：沒有 verified dimensions 時圖面標示 not-to-scale，不輸出尺寸宣稱，完成後以 renderer test 驗證 disclaimer flag 與圖面文字存在。
- [ ] 4.3 Clean floor plan is rendered deterministically：手稿或人工輸入尺寸只以 provided values 呈現並記錄來源，完成後以 renderer/data test 驗證 dimensions_source 為 field_sketch 或 manual_confirmation。

## 5. 人工確認與法律 gate

- [ ] 5.1 Decision: Approval checklist is the legal gate / Human confirmation gates legal output：實作 approval checklist，要求房間數、廚房、衛浴、陽台、入口、門窗、尺寸來源與不確定項目完成確認，完成後以 unit tests 驗證缺任一 blocker 不能 approve。
- [ ] 5.2 Human confirmation gates legal output：實作 `approve_floor_plan_conversion` 與 `revoke_floor_plan_conversion`，完成後以 Rust tests 驗證 approved/revoked 狀態、approved_by、Asia/Taipei approved_at 與 PDF exclusion 行為。
- [ ] 5.3 Decision: Approval checklist is the legal gate：在 review 畫面並排顯示原始手稿與乾淨圖，完成後以 component test 或 Playwright manual check 驗證使用者必須逐項確認才看得到核准動作。

## 6. PDF 輸出與聲明

- [ ] 6.1 Decision: PDF wording separates layout reference from legal records / Disclosure PDF includes source and limitation statement：把 approved converted plan 接入 dossier data，完成後以 assemble-dossier-data test 驗證只有 approved plan 會進入 PDF payload。
- [ ] 6.2 Disclosure PDF includes source and limitation statement：PDF 顯示來源 `現場手稿整理圖` 與限制聲明，完成後以 PDF render snapshot 或 manual PDF check 驗證聲明內容存在。
- [ ] 6.3 Decision: PDF wording separates layout reference from legal records：沒有 approved converted sketch 時 PDF 照常產生且不插入格局圖頁，完成後以 PDF generation test 驗證 no-approved fallback。

## 7. 稽核、設定與驗證

- [ ] 7.1 Conversion audit trail is available for dispute review：記錄 AI provider、model id、prompt template version、response fingerprint 並排除 API key，完成後以 security unit test 驗證 history payload 不含 secret。
- [ ] 7.2 Conversion audit trail is available for dispute review：PDF 產生時記錄使用哪個 conversion version，完成後以 integration test 驗證 PDF generation event 可回查 conversion_id。
- [ ] 7.3 Field sketch entry is attached to the existing floor plan field / Human confirmation gates legal output：用一張合成鉛筆手稿跑完整手動流程，完成後保存驗證紀錄：上傳、AI 草稿、人工確認、renderer output、PDF 頁面、history。
- [ ] 7.4 Conversion audit trail is available for dispute review：跑 `spectra validate field-sketch-floor-plan-conversion --strict`、cargo tests、frontend tests，完成後紀錄通過結果或剩餘失敗原因。
