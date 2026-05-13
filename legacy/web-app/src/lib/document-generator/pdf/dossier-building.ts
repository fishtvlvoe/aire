import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';

// Building dossier — 16 chapters for all building types:
// apartment / high-rise / townhouse / studio / storefront / factory / farmhouse
// AI only produces summaries, interpretations, and risk notes.
// Tax figures and computed values come from system_computed — AI must not calculate them.
// Missing values must be marked as 待補.

export async function generateBuildingDossier(
  input: DocumentGeneratorInput & {
    extracted_data?: Record<string, unknown>;
    system_computed?: Record<string, unknown>;
    pre_commission_data?: Record<string, unknown>;
    external_data?: Record<string, unknown>;
  }
): Promise<string> {
  const fieldVisit = JSON.stringify(input.field_visit_data, null, 2);
  const supplementary = JSON.stringify(input.supplementary_data, null, 2);
  const extractedData = JSON.stringify(input.extracted_data ?? {}, null, 2);
  const systemComputed = JSON.stringify(input.system_computed ?? {}, null, 2);
  const preCommission = JSON.stringify(input.pre_commission_data ?? {}, null, 2);
  const externalData = JSON.stringify(input.external_data ?? {}, null, 2);
  const marketResearch = JSON.stringify(input.market_research ?? null, null, 2);
  const propertyType = input.property_type;

  const prompt = `你是一位不動產說明書撰寫助理。請根據以下輸入資料，產出完整的「建物版不動產說明書」，共 16 章 Markdown。

## 嚴格規則
1. 你只負責「摘要/白話解讀/風險提醒/重點說明」。
2. 所有稅費金額、試算數字皆由系統提供（system_computed），你不得自行計算或猜測數字。
3. 任何欄位資料缺漏，一律標示「待補」，不得臆測填補。
4. 只能引用輸入資料中已有的內容，不得杜撰。
5. 繁體中文輸出。
6. 章節格式固定為：\`#### 章節 X：標題\`，每章標題必須完全一致（供系統解析）。
7. 請勿使用任何稱呼或問候語，直接從章節 1 開始輸出內容。

## 物件類型
${propertyType}

## 委前資料（pre_commission_data）
\`\`\`json
${preCommission}
\`\`\`

## 現場訪查資料（field_visit_data）
\`\`\`json
${fieldVisit}
\`\`\`

## 秘書後補資料（supplementary_data）
\`\`\`json
${supplementary}
\`\`\`

## 謄本 OCR 解析資料（extracted_data，來自 PDF 自動辨識）
\`\`\`json
${extractedData}
\`\`\`
- 此區塊的資料來自 OCR 自動辨識，可能有辨識誤差。
- 若此區塊有值而 supplementary_data 對應欄位為空，請直接使用此值，不加任何來源標注。
- 優先順序：supplementary_data > extracted_data > field_visit_data。

## 系統計算結果（system_computed，稅費/日期/頁數由系統提供）
\`\`\`json
${systemComputed}
\`\`\`

## 外部資料（external_data，行情/周遭設施）
\`\`\`json
${externalData}
\`\`\`

## 周邊行情人工資料（market_research，由業務查 591/信義/樂屋後親自填寫並上傳截圖）
\`\`\`json
${marketResearch}
\`\`\`
- 若 market_research 為 null 或 summary 為空字串：周邊環境章節保持「待補」，不要臆測。
- 若有 summary：應引用該文字（可用「依現勘人員觀察」或「業務查證」開頭）；不得改寫成自己的分析。
- 若有 attachments：在周邊環境章節末尾以條列方式列出附件路徑，標註「相關截圖」。

---

請依序輸出以下 16 章，每章格式為：

\`\`\`
#### 章節 X：標題
[本章內容]
\`\`\`

---

#### 章節 1：封面
本章由系統與模板自動產生，無需 AI 內容。請輸出以下固定格式：
- 物件編號：{{物件編號，取自 pre_commission_data，缺則待補}}
- 物件名稱：{{物件名稱，取自 pre_commission_data，缺則待補}}
- 地址：{{地址，取自 pre_commission_data，缺則待補}}
- 承辦人/電話：{{承辦人/電話，取自 pre_commission_data，缺則待補}}
- 製表日期：{{製表日期，取自 system_computed，缺則待補}}

---

#### 章節 2：重要告知（以謄本為準/契約一部分）
本章為固定條款，請輸出以下文字（不得增刪）：
本說明書所載內容以登記謄本、地籍圖及相關法規為準。本說明書為買賣契約之一部分，買賣雙方均應詳閱並簽章確認。說明書中任何資料如與謄本不符，以謄本為準。

---

#### 章節 3：物件摘要（重點說明）
請根據輸入資料，撰寫 100~200 字的物件摘要，內容包含：物件賣點、適合族群、注意事項。不得包含稅費計算。資料不足欄位標「待補」。

---

#### 章節 4：成交條件/費用分擔
請根據 pre_commission_data，以 2~5 點白話條列方式說明買賣方式、代書費/履保等費用分擔，以及其他約定事項。資料不足標「待補」。
輸出純中文內容，禁止使用「（英文key：值）」等括號格式顯示欄位名稱。例：「交易方式：買賣。」，不可寫成「交易方式：買賣（transaction_type：買賣）。」

---

#### 章節 5：產權調查表（建物標示）

本章為固定欄位，請依照以下優先順序填入資料：
1. 優先使用 supplementary_data 中對應欄位的值
2. supplementary_data 無值時，使用 extracted_data 中指定的 key，直接填入值
3. 兩者皆無則填 {{待補}}

欄位對應表：
- 建號：supplementary_data.building_number → 否則取 extracted_data.building_number → 否則{{待補}}
- 法定用途：supplementary_data.legal_use → 否則解析 extracted_data.current_purpose 中包含的用途字串（如「住家用」）→ 否則{{待補}}
- 主要建材：supplementary_data.structure → 否則解析 extracted_data.structure 中包含的建材字串（如「鋼筋混凝土造」）→ 否則{{待補}}
- 總樓層：supplementary_data.floor_count → 否則取 extracted_data.floor_count → 否則{{待補}}
- 主建物坪數：supplementary_data.building_area → 否則取 extracted_data.building_area（單位為㎡，換算坪數請乘以0.3025）→ 否則{{待補}}
- 建築完成日：supplementary_data.completion_date → 否則取 extracted_data.year_built → 否則{{待補}}
- 門牌地址：supplementary_data.address → 否則取 extracted_data.address → 否則{{待補}}
- 附屬建物坪數：supplementary_data.accessory_area → 否則{{待補}}
- 公設坪數：supplementary_data.common_area → 否則{{待補}}
- 備註：以最新謄本為準。

---

#### 章節 6：產權調查表（土地標示，建物附屬土地）

本章為固定欄位，請依照以下優先順序填入資料：
1. 優先使用 supplementary_data 中對應欄位的值
2. supplementary_data 無值時，使用 extracted_data 中指定的 key，直接填入值
3. 兩者皆無則填 {{待補}}

若有多筆地號，逐筆列出。

欄位對應表：
- 地段/地號：supplementary_data.land_number → 否則取 extracted_data.land_number → 否則{{待補}}
- 土地面積：supplementary_data.land_area → 否則取 extracted_data.land_area（單位為㎡）→ 否則{{待補}}
- 使用分區/用地別：supplementary_data.zoning → 否則{{待補}}
- 持分比例：supplementary_data.rights_range → 否則取 extracted_data.rights_range → 否則{{待補}}
- 公告土地現值（每平方公尺，土地專屬，不含建物評定現值）：supplementary_data.announced_land_value → 否則{{待補}}
- 公告地價：supplementary_data.announced_land_price → 否則取 extracted_data.announced_land_price → 否則{{待補}}

---

#### 章節 7：他項權利/限制登記（摘要 + 解讀）
請根據 supplementary_data 中謄本他項權利部資料，條列「一般影響/需查證事項」。不得下法律結論，只描述可能影響。資料不足標「待補」。範例格式：
- [項目]：[簡要說明，如有抵押權請說明金額及狀況]
風險提醒：[2~3 點買方應注意事項]

---

#### 章節 8：建物現況調查（現場必問）
請根據 field_visit_data，將以下項目整理為「已確認 / 待補 / 需查證」三種狀態，並加備註：
- 頂加/外推/違建/夾層/鐵皮
- 公共空間使用情況
- 獨立水電瓦斯
- 隔音/防水狀況
- 管委會/共管
- 分租狀況
格式：項目 | 狀態 | 備註
無資料的項目，「狀態」與「備註」欄位一律留空，禁止填入「資料不足」或任何說明文字。

---

#### 章節 9：建物補件核對（秘書後補）
本章為內部使用核對清單，請根據 supplementary_data 輸出勾選清單：
- [ ] 建號/地號核對
- [ ] 用途/樓層/完工日核對
- [ ] 增建範圍整理
- [ ] 租約核對（如有）
- [ ] 照片命名確認
- [ ] 平台一致性檢核
如有已確認項目，改為 [x]。

---

#### 章節 10：稅費/規費/其他費用（項目 + 金額）
本章所有金額取自 system_computed，AI 不得自行計算。請輸出以下表格，無值時儲存格完全留空，禁止填入「待補」或任何說明文字：
| 項目 | 基礎 | 金額 | 備註 |
|------|------|------|------|
| 契稅 | | system_computed.computed_deed_tax | |
| 房屋稅 | | | |
| 地價稅 | | | |
| 印花稅（買方） | | system_computed.computed_stamp_tax_buyer | |
| 印花稅（賣方） | | system_computed.computed_stamp_tax_seller | |
| 登記規費 | | system_computed.computed_registration_fee | |
| 代書費 | | | |
| 履保費（各半） | | system_computed.computed_escrow_fee_each | |

---

#### 章節 11：稅費分算說明（白話）
請根據 system_computed 提供的適用類別與關鍵參數，撰寫 3~6 點白話說明（不得計算數字）。最後加上免責聲明：「以上說明僅供參考，實際稅費以主管機關核定為準。」

---

#### 章節 12：土地增值稅概算（一般/自用）
本章所有數字取自 system_computed，請輸出雙欄比較表；無值時儲存格完全留空：
| 項目 | 一般稅率 | 自用稅率 |
|------|---------|---------|
| 試算金額 | system_computed.computed_land_increment_general_approx | system_computed.computed_land_increment_self_use_approx |
| 試算基礎 | | |
| 原地價/現值 | | |
| 物價指數 | | |
| 扣除額 | | |
| 持分 | | |
以上土地增值稅為試算近似值，以主管機關核定為準。

---

#### 章節 13：成交行情/透明房價（附錄）
請根據 external_data 中的實登資料，撰寫 1 段「行情解讀」（80~150 字），說明樣本範圍、期間、及可能偏誤。缺資料時標「待補」。

---

#### 章節 14：周遭機能
請根據 external_data 中的周遭設施清單，撰寫 3~5 點生活機能摘要（採買/通勤/醫療/教育等）。格式：
- [類別]：[名稱（距離，若有具體數字）]
無具體距離數字時只列設施名稱，禁止輸出「（距離）」佔位符。禁止輸出「（已確認）」等確認標記。

---

#### 章節 15：照片索引
本章由系統依上傳照片自動產生，無需 AI 內容。請輸出：
（照片索引由系統自動填入）

---

#### 章節 16：買方確認/簽章頁
本章為固定模板，請輸出以下文字：
承買人確認已詳閱本說明書全部內容，並了解各項條款及物件現況。
- 承買人姓名：_______________
- 日期：_______________
- 簽章：_______________
`;

  const result = await runCodex(prompt);

  if (!result.success) {
    // Return a placeholder with error note on failure
    return `# 建物版不動產說明書（產生失敗）\n\n> 錯誤：${result.error ?? '未知錯誤'}\n> 狀態：${result.status}\n\n請重試或聯絡系統管理員。`;
  }

  return result.output ?? '# 建物版不動產說明書\n\n（無內容回傳）';
}
