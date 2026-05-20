# Page Contract Open Decisions

日期：2026-05-20

目的：把房屋版 Page Contract 的剩餘開放問題先收斂成可實作預設。若 Fish 或客戶驗收後不同意，再改這份文件，不要回頭翻聊天。

## house.property_rights / 建物標示

決策：

- MVP 使用業務看得懂的一頁左右摘要，不做完整 105 格官方長表。
- 建物標示包含：建號、面積、權利範圍、樓層、主要用途、主要建材、建築完成日、屋齡。
- API 有資料就自動帶入；缺資料留空白。
- 屋齡由建築完成日推算。

仍需人工驗收：

- 實際列印後空格是否足夠手寫。

## house.land_display

決策：

- 面積顯示以平方公尺為主；坪數可作輔助欄位或備註，不能取代法定面積。
- 法律/default note 預設顯示固定模板文字，但一般使用者不直接改法律模板。
- 他項權利若內容短，留在本頁摘要；若內容過長，改放附件或備註延伸頁，不擠壓主表。

## house.market_reference

決策：

- MVP 欄位：地址、面積（坪）、總價（萬）、單價（萬/坪）、交易日期。
- 查不到行情時輸出空白，不混入舊假資料。
- AI 市調解讀不進 MVP；透明房價 / 成交行情頁先做 output-ready optional appendix。

## house.ownership_notes

決策：

- MVP 固定輸出 11 條產權注意事項。
- 一般使用者不能改法律文字。
- case-specific risk highlight 先不做；未來若要做，需明確標示來源與判斷依據。

## house.fee_responsibility

決策：

- 買賣雙方負擔文字使用固定模板。
- 金額欄支援空白、手填、自動試算。
- 自動試算一定標示「概算」，不得假裝是稅捐機關正式金額。
- 稅務/代書審查是 paid launch 前外部確認，不阻擋 MVP 技術切片。

## house.land_value_tax_estimate

決策：

- 寬表格優先拆成可列印的多段表，不硬塞到單頁造成字太小。
- 手填/空白/自動試算三種模式都要保留。
- 自動試算需保存公式版本與資料來源日期。
- 稅務公式需在付費上線前找專業人士審查。

## house.tax_notes

決策：

- 稅務附註與增值稅概算表分開。
- 即使估算值空白，固定稅務附註仍預設輸出。
- 一般使用者不能改固定稅務模板。

## house.condition_survey_highrise

決策：

- MVP 使用照片中的 38 題表單，不使用舊程式碼的 58 題 schema 作為主要輸出。
- PDF 與預覽輸出空白勾選框 + 可書寫欄位，不輸出 `未填`。
- 附件採「全頁/全域現場調查照片」先做，不做每題獨立附件。
- 未來若客戶要求每題照片，再擴充 question-level attachments。

## house.living_function

決策：

- 位置圖與生活機能合併成一頁。
- 第一版生活機能摘要上限：
  - 學校 1
  - 醫療 1
  - 公園 1
  - 捷運/交通 1
  - 市場/超市 1 到 2
- 自動地圖失敗時允許手動上傳，不阻擋 PDF 匯出。
- 生活機能屬 Draft Disclosure / Images & Maps 共同表面：使用者可以在草稿工作台看到，也可以在圖片/地圖區補上傳。

## 舊 PDF / 掃描文件處理

決策：

- `docs/0417-old/*.pdf` 視為掃描視覺參考。
- 不以 `pdftotext` 結果作為欄位真相，除非特別做 OCR 工作。
- 欄位真相以 Page Contract artifact、客戶照片、人工確認、COP/MOI API map 為準。

## 2026 法規更新欄位

已補到 concrete Page Contract 資料模型：

- 太陽光電設備狀態 / 位置。
- 建築能效狀況 / 備註。

實作位置：

- `src/lib/page-contracts/house-mvp.ts` 的 `HOUSE_2026_LEGAL_UPDATE_FIELDS`。
- 預設值皆為空白，不輸出 `待補`。
- 來源先標示為 `manual_or_registry`，代表 API 有資料就帶入，沒有就留白供現場手寫或回來補件。

仍需後續補：PDF/UI 實際版面要把這四個欄位放到合適頁面；付費上線前仍要重查最新法規文字。
