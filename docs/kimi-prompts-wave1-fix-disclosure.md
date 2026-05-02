# Kimi 提詞 — Wave 1：fix-disclosure-extracted-data-pipeline

> 說明：依序給 Kimi 跑以下三個 prompt。Prompt 2 和 Prompt 3 可以同時跑（不同檔案）。
> 每個 prompt 跑完後，把輸出的完整檔案內容貼回給 Claude 做 CR。

---

## Prompt 1 — `src/lib/document-generator/types.ts`

```
你是一個 TypeScript 開發者。請修改下面這個檔案。

【任務】
在 DocumentGeneratorInput interface 補齊以下欄位（目前程式已在用，但 interface 沒有定義，造成 type 不完整）：

新增以下四個 optional 欄位，加在 market_research 之後：

1. extracted_data?: Record<string, unknown>
   用途：存放 OCR 從謄本 PDF 解析出的原始欄位，如 announced_land_value（公告現值）、rights_range（持分比）、land_section（地段）等。

2. system_computed?: Record<string, unknown>
   用途：存放後端 API 計算的衍生值，如 area_ping（坪數，building_area × 0.3025）、building_age（屋齡）、report_date（製表日）。

3. pre_commission_data?: Record<string, unknown>
   用途：委前資料，含業主姓名、電話、委託價、地址等。

4. external_data?: Record<string, unknown>
   用途：外部行情、周遭設施等附加資料。

【現有檔案內容】

import { PropertyType } from '../property-types';

export interface GeneratedDocuments {
  property_survey: string;      // 物調表 MD
  listing_591: string;          // 591 PO 文 MD
  sales_dm: string;             // 銷售 DM 文案 MD
  social_posts: string;         // FB 5 平台貼文 + 圖片提示詞 MD（單一字串，含全部平台）
  disclosure_document: string;  // 不動產說明書（PDF，Phase 2 任務 10 實作，目前 placeholder）
}

export interface DocumentGeneratorInput {
  property_type: PropertyType;
  field_visit_data: Record<string, unknown>;
  supplementary_data: Record<string, unknown>;
  /**
   * 周邊行情人工資料（external-market-lookup change）。
   * 系統 SHALL NOT 自動產生此欄位內容，僅引用業務在 supplementary 頁填寫的摘要與上傳的截圖路徑。
   */
  market_research?: {
    summary: string | null;
    attachments: string[];
  };
}

export interface DocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments>;
  generateSingle(input: DocumentGeneratorInput, type: keyof GeneratedDocuments): Promise<string>;
}

【輸出要求】
- 輸出完整修改後的檔案，不要只輸出 diff
- 新增欄位加上繁體中文 JSDoc 說明
- 維持原有格式風格
```

---

## Prompt 2 — `src/lib/ocr/field-mapping.ts`

```
你是一個 TypeScript 開發者。請修改下面這個 OCR 欄位映射檔案。

【任務】
1. 在 OCR_TO_FORM_KEY 新增以下三個映射：
   - announced_land_value → '__extracted_only__'（公告現值，前端表單無此欄位，只存在 extracted_data）
   - rights_range → '__extracted_only__'（持分比，前端表單無此欄位，只存在 extracted_data）
   - land_section → 'land_section'（地段，可直接存入表單）

2. 在映射表頂部加一段區塊說明，解釋兩種欄位的意義：
   - 「映射到真實 form key」：會寫入 field_visit_data，供前端表單使用
   - 「映射到 __extracted_only__」：只存在 extracted_data，不寫入表單，供文件生成器使用

【現有檔案內容】

/**
 * OCR parser key → 表單 field key 映射表
 *
 * parser 產出的 key（左）對應到表單 schema 的 key（右）。
 * 直接相同的 key 不需列在這裡（如 building_area → building_area）。
 */
export const OCR_TO_FORM_KEY: Record<string, string> = {
  // 土地
  land_number: 'land_number',
  land_area: 'land_area',
  usage_zone: 'zoning',
  usage_type: 'land_purpose',

  // 所有權（ownership_scope 由 parser 直接產出，不需映射）
  title_deed_number: 'land_register_transcript',
  registration_date: 'land_register_transcript',

  // 他項權利
  right_type: 'other_rights',
  right_holder_name: 'other_rights',
  mortgage_amount: 'other_rights',

  // 建物
  building_number: 'land_number',
  building_address: 'address',
  building_area: 'building_area',
  main_material: 'structure',
  stories: 'floor_total',
  completion_date: 'year_built',
  main_usage: 'current_purpose',

  // 建物所有權（ownership_scope 由 parser 直接產出，不需映射）
  building_title_deed_number: 'land_register_transcript',
  building_registration_date: 'land_register_transcript',

  // 建物他項權利
  building_right_type: 'other_rights',
  building_right_holder_name: 'other_rights',
  building_mortgage_amount: 'other_rights',
}

/**
 * 將 OCR parser 的 fields 轉換為表單 field key
 * 同一個 form key 被多個 OCR key 映射時，保留 confidence 最高的
 */
export function mapOcrFieldsToFormKeys<T extends { confidence: number }>(
  ocrFields: Record<string, T>,
): Record<string, T> {
  const result: Record<string, T> = {}

  for (const [ocrKey, field] of Object.entries(ocrFields)) {
    const formKey = OCR_TO_FORM_KEY[ocrKey] ?? ocrKey
    const existing = result[formKey]

    if (!existing || field.confidence > existing.confidence) {
      result[formKey] = field
    }
  }

  return result
}

【輸出要求】
- 輸出完整修改後的檔案，不要只輸出 diff
- 註解用繁體中文
- 維持原有格式風格
```

---

## Prompt 3 — `src/lib/document-generator/pdf/dossier-building.ts` 和 `dossier-land.ts`

```
你是一個 TypeScript 開發者。請修改兩個結構幾乎相同的檔案：
- src/lib/document-generator/pdf/dossier-building.ts
- src/lib/document-generator/pdf/dossier-land.ts

【兩個檔案都要做的事】

1. 在函式簽名的 input 型別交集中，新增 extracted_data 欄位：
   目前已有：
     system_computed?: Record<string, unknown>;
     pre_commission_data?: Record<string, unknown>;
     external_data?: Record<string, unknown>;
   新增：
     extracted_data?: Record<string, unknown>;

2. 在函式開頭的資料序列化區塊，新增一行：
   const extractedData = JSON.stringify(input.extracted_data ?? {}, null, 2);

3. 在 prompt 字串的資料區塊中，在「## 秘書後補資料（supplementary_data）」之後、
   「## 系統計算結果（system_computed）」之前，插入新的區塊：

## 謄本 OCR 解析資料（extracted_data，來自 PDF 自動辨識，請優先採用但標注來源）
```json
${extractedData}
```
- 此區塊的資料來自 OCR 自動辨識，可能有辨識誤差。
- 若此區塊有值而 supplementary_data 對應欄位為空，請採用此值，並在欄位後標注「（OCR讀取，請確認）」。
- 優先順序：supplementary_data > extracted_data > field_visit_data。

4. 章節 5（建物版）/ 章節 6（土地版）的「地段/地號」「持分比例」「公告現值」「公告地價」說明後面，
   把原本的「取自 supplementary_data，缺則待補」改成：
   「取自 supplementary_data；若 supplementary_data 無值，改取 extracted_data，並標注（OCR讀取，請確認）；兩者皆無則待補」

【兩個檔案分別輸出完整修改後內容】
- 先輸出 dossier-building.ts 完整內容
- 再輸出 dossier-land.ts 完整內容
- 不要只輸出 diff
- 繁體中文註解
```

---

## 驗收流程

跑完每個 prompt 後：
1. 把 Kimi 輸出的完整檔案內容貼回給 Claude
2. Claude 做 code review，確認後告訴你可以存檔
3. 把確認好的內容寫入對應路徑

Wave 1 完成後，Claude 會給 Wave 2（generate/route.ts + regenerate/route.ts）的 prompt。

---

## Wave 1 CR 補修 — `src/lib/document-generator/build-input.ts`

> **背景**：測試時發現 `announced_land_value`、`rights_range` 等關鍵欄位存在 `by_attachment.fields`，但不在 `merged_fields`，導致 `flattenExtractedData` 讀不到這些欄位，說明書仍顯示「待補」。同時修正 W2（`null` 不 fallback）。

```
你是一個 TypeScript 開發者。請修改 src/lib/document-generator/build-input.ts。

【問題說明】

extracted_data 在 DB 裡有兩層結構：
1. by_attachment[attachmentId].fields — 每個附件的原始 OCR 欄位（如 announced_land_value、rights_range），使用 {value, confidence} 格式
2. merged_fields — 經 mapOcrFieldsToFormKeys 轉換後的表單欄位，只含有在映射表內的欄位

目前 flattenExtractedData 只讀 merged_fields，但 announced_land_value 和 rights_range 只存在 by_attachment.fields，導致這些欄位無法傳入文件生成器。

【要做的修改】

1. 修改 flattenExtractedData 函式：
   - 先讀 by_attachment（所有 attachment 的 fields），把 value 放進 flat 物件（低優先度）
   - 多個 attachment 的同一個 key 以 confidence 最高者優先
   - 再讀 merged_fields，覆蓋 by_attachment 的值（高優先度，已做 confidence merge）
   - 結果：by_attachment 的原始欄位 + merged_fields 的已映射欄位都進入 flat 物件

2. 修改 getMergedValue 函式：
   目前：只排除 undefined 和 ''，不排除 null
   修改後：同時排除 null，讓 null 值也 fallback 到下一個來源

   目前第 50 行：
   if (sources.supplementary_data[fieldName] !== undefined && sources.supplementary_data[fieldName] !== '') {
   改為：
   const suppVal = sources.supplementary_data[fieldName];
   if (suppVal !== undefined && suppVal !== null && suppVal !== '') {

   目前第 53 行：
   if (sources.extracted_data[fieldName] !== undefined && sources.extracted_data[fieldName] !== '') {
   改為：
   const extVal = sources.extracted_data[fieldName];
   if (extVal !== undefined && extVal !== null && extVal !== '') {

【現有 flattenExtractedData 函式（供參考）】

function flattenExtractedData(raw: Record<string, unknown>): Record<string, unknown> {
  const maybePayload = raw as unknown as Partial<ExtractedDataPayload>;
  if (maybePayload.merged_fields && typeof maybePayload.merged_fields === 'object') {
    const flat: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(maybePayload.merged_fields)) {
      if (field && typeof field === 'object' && 'value' in field) {
        flat[key] = (field as { value: unknown }).value;
      }
    }
    return flat;
  }
  return raw;
}

【ExtractedDataPayload 型別結構（參考）】

type ExtractedDataPayload = {
  by_attachment: Record<string, {
    filename: string;
    fields: Record<string, { value: unknown; confidence: number }>;
  }>;
  merged_fields: Record<string, { value: unknown; confidence: number; provenance?: string }>;
}

【輸出要求】
- 輸出完整修改後的 build-input.ts 全文，不要只輸出 diff
- 繁體中文 JSDoc 說明
- flattenExtractedData 加 JSDoc 說明新邏輯：by_attachment 優先度低、merged_fields 覆蓋

【注意】
不要修改其他函式（safeParseObject、computeSystemComputed、buildDocumentInput 等）。
```
