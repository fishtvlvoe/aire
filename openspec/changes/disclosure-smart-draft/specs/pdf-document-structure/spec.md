## MODIFIED Requirements

### Requirement: PDF page ordering for land type

The system SHALL render land-type PDF pages in the following order:
1. Cover page (封面)
2. Legal notice (說明/法規告知)
3. Property data sheet (物件資料表 — 土地版)
4. Land registration details (土地標示)
5. Property rights notes (產權相關注意事項)
6. Fee summary (費用一覽表)
7. Tax estimate (增值稅概算表)
8. Condition survey (現況調查表 — 35 questions, 4-5 pages)
9. Transaction history (透明房價一覽表)
10. Life amenities (周遭設施)
11. Location map (位置圖)
12. Exterior photo (外觀圖)
13. Signature block (簽章欄)

#### Scenario: Land type complete page set

- **WHEN** generating PDF for a land-type case with all data available
- **THEN** the PDF SHALL contain pages in the order specified above

#### Scenario: Land type with missing optional data

- **WHEN** streetViewImage or locationMapImage is null
- **THEN** those pages SHALL be omitted from the PDF (not render empty pages)

### Requirement: PDF page ordering for building type

The system SHALL render building-type PDF pages in the following order:
1. Cover page (封面)
2. Legal notice (說明/法規告知)
3. Property data sheet (物件資料表 — 成屋版)
4. Building registration details (建物標示 with area breakdown)
5. Land registration details (土地標示)
6. Property rights notes (產權相關注意事項)
7. Fee summary (費用一覽表)
8. Tax estimate (增值稅概算表)
9. Condition survey (現況調查表 — ~58 questions, 6-7 pages)
10. Transaction history (透明房價一覽表)
11. Life amenities (周遭設施)
12. Location map (位置圖)
13. Exterior photo (外觀圖)
14. Signature block (簽章欄)

#### Scenario: Building type complete page set

- **WHEN** generating PDF for a building-type case with all data available
- **THEN** the PDF SHALL contain pages in the order specified above

#### Scenario: Conditional page rendering

- **WHEN** any data source returns null/empty
- **THEN** the corresponding page SHALL be omitted (not show placeholder or error)
