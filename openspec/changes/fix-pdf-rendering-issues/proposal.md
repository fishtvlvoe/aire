## Problem

不動產說明書 PDF 產出後存在多項渲染與內容問題，影響業務實際使用：

1. **封面欄位不完整**：封面只顯示案件編號/地址/公司名，缺少承辦人、經紀人、證書字號、公司地址、電話等必要欄位
2. **法規告知太簡略**：只有 2 行摘要，缺少完整的法定告知事項內容
3. **「待補」文字不當**：空值欄位顯示「待補」二字，應直接留空白讓業務手填
4. **可自動填的欄位留空**：周遭成交行情、近期成交均價、近期成交案數等可從 transactionHistory 計算的資料未自動帶入
5. **簽章欄重複**：第 11 頁和最後一頁各有一個簽章欄，應只保留最後一頁
6. **地圖/Logo/圖片亂碼**：位置圖、外觀圖、生活機能圖頁面出現亂碼字元
7. **頁面排序不符客戶版**：現有排序與客戶提供的範例格式不一致
8. **成交行情表標題錯誤**：「透明房價一覽表」應改為「附近地段實價登錄成交行情」

## Root Cause

- 封面元件（cover-page.tsx）只渲染部分 cover 資料欄位
- 法規告知元件只列出 legalClauses 陣列內容，沒有預設的完整法規文字
- 各 land-detail 頁面使用硬編碼 `"待補"` 作為預設值
- document.tsx 中 LandPages/BuildingPages 的頁面順序不符客戶版順序
- 簽章欄被放在兩個位置（產權頁後 + 最後一頁）
- 地圖佔位頁面的中文字元在無實際圖片時渲染異常

## Proposed Solution

逐一修正各元件：
1. cover-page.tsx — 補齊所有 cover 欄位渲染
2. legal-page.tsx — 加入完整法規告知文字（依不動產經紀業管理條例）
3. land-detail-pages.tsx — 將所有 `"待補"` 改為 `""`（空字串）
4. land-detail-pages.tsx — 從 transactionHistory 計算均價/案數自動帶入
5. document.tsx — 移除重複的簽章欄，只在最後一頁保留
6. location-map.tsx / exterior-photo-page.tsx / life-amenities-page.tsx — 修正無圖片時的佔位渲染
7. document.tsx — 調整頁面順序符合客戶版
8. transaction-history.tsx — 改標題為「附近地段實價登錄成交行情」

## Non-Goals

- 不改動稅費計算邏輯
- 不改動現況調查表題目內容
- 不新增 API 呼叫

## Success Criteria

- 產出 PDF 封面包含所有 cover 欄位（承辦人/經紀人/證號/公司資訊）
- 法規告知頁有完整法定告知內容
- 空值欄位顯示空白而非「待補」
- 成交行情相關欄位自動從 transactionHistory 計算帶入
- 簽章欄只出現一次（最後一頁）
- 無亂碼頁面
- 頁面排序符合客戶版格式
- 成交行情表標題為「附近地段實價登錄成交行情」

## Impact

- Affected code:
  - Modified: `src/lib/pdf-blocks/cover-page.tsx`
  - Modified: `src/lib/pdf-blocks/legal-page.tsx`
  - Modified: `src/lib/pdf-blocks/land-detail-pages.tsx`
  - Modified: `src/lib/pdf-blocks/transaction-history.tsx`
  - Modified: `src/lib/pdf-blocks/location-map.tsx`
  - Modified: `src/lib/pdf-blocks/exterior-photo-page.tsx`
  - Modified: `src/lib/pdf-blocks/life-amenities-page.tsx`
  - Modified: `src/lib/pdf-blocks/signature-block.tsx`
  - Modified: `src/lib/pdf-engine/document.tsx`
