import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';

// Land dossier — 16 chapters for all land types:
// farmland / building land / commercial land / industrial land / rural building land / other land
// AI only produces summaries, interpretations, and risk notes.
// Tax figures and computed values come from system_computed — AI must not calculate them.
// Missing values must be marked as 待補.
// Key land-specific fields: 地目、地號、公告現值、公告地價、土地使用分區/使用編定、
// 建蔽率/容積率、持分比例、可建性現況調查表 p1~p4（章節 8~11）

export async function generateLandDossier(
  input: DocumentGeneratorInput & {
    system_computed?: Record<string, unknown>;
    pre_commission_data?: Record<string, unknown>;
    external_data?: Record<string, unknown>;
  }
): Promise<string> {
  const fieldVisit = JSON.stringify(input.field_visit_data, null, 2);
  const supplementary = JSON.stringify(input.supplementary_data, null, 2);
  const systemComputed = JSON.stringify(input.system_computed ?? {}, null, 2);
  const preCommission = JSON.stringify(input.pre_commission_data ?? {}, null, 2);
  const externalData = JSON.stringify(input.external_data ?? {}, null, 2);
  const propertyType = input.property_type;

  const prompt = `你是一位不動產說明書撰寫助理。請根據以下輸入資料，產出完整的「土地版不動產說明書」，共 16 章 Markdown。

## 嚴格規則
1. 你只負責「摘要/白話解讀/風險提醒/重點說明」。
2. 所有稅費金額、試算數字皆由系統提供（system_computed），你不得自行計算或猜測數字。
3. 任何欄位資料缺漏，一律標示「待補」，不得臆測填補。
4. 只能引用輸入資料中已有的內容，不得杜撰。
5. 繁體中文輸出。
6. 章節格式固定為：\`#### 章節 X：標題\`，每章標題必須完全一致（供系統解析）。

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

## 系統計算結果（system_computed，稅費/日期/頁數由系統提供）
\`\`\`json
${systemComputed}
\`\`\`

## 外部資料（external_data，行情/周遭設施）
\`\`\`json
${externalData}
\`\`\`

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
請根據輸入資料，撰寫 100~200 字的土地物件摘要，內容包含：土地用途/潛力、適合族群、注意事項（如使用管制/農地限制等）。不得包含稅費計算。資料不足欄位標「待補」。

---

#### 章節 4：成交條件/費用分擔
請根據 pre_commission_data，以 2~5 點白話條列方式說明買賣方式、代書費/履保等費用分擔，以及其他約定事項。資料不足標「待補」。

---

#### 章節 5：產權調查表（土地標示）
本章為固定欄位，請填入以下資料（取自 supplementary_data，缺則待補）。若有多筆地號，逐筆列出：
- 地段/地號：{{待補}}
- 地目：{{待補}}
- 面積：{{待補}}
- 使用分區：{{待補}}
- 使用編定：{{待補}}
- 公告現值：{{待補}}
- 公告地價：{{待補}}

---

#### 章節 6：所有權/持分
請根據 supplementary_data 中土地謄本所有權部，填入以下資料，並撰寫 1 段簡短解讀（僅描述共有狀況，不得下法律結論）：
- 是否持分：{{待補}}
- 持分比例：{{待補}}
- 共有關係說明：{{若共有，列出共有人數及已知資訊；缺則待補}}
提醒：[1~2 點買方應注意的共有/持分事項]

---

#### 章節 7：他項權利/限制登記（摘要 + 解讀）
請根據 supplementary_data 中謄本他項權利部資料，條列「一般影響/需查證事項」。不得下法律結論，只描述可能影響。資料不足標「待補」。範例格式：
- [項目]：[簡要說明]
風險提醒：[2~3 點買方應注意事項]

---

#### 章節 8：基地/土地現況調查表 p1（可建性/使用現況）
請根據 field_visit_data，將以下項目整理為「已確認 / 待補 / 需查證」三種狀態，並加備註：
- 臨路寬度
- 面寬/深度
- 角地/雙面臨路/無尾巷
- 通行權（是否有私設通道）
- 可否到車
- 水電接引狀況
- 現況使用（農用/空地/已建/其他）
- 有無地上物
格式：項目 | 狀態 | 備註

---

#### 章節 9：基地/土地現況調查表 p2（排水/周邊）
請根據 field_visit_data 及 supplementary_data，將以下項目整理並提出風險提示：
- 排水設施狀況
- 周邊環境設施（鄰近污染源/設施等）
- 占用/界址疑慮（若有）
風險提示：[2~3 點需查證事項]

---

#### 章節 10：基地/土地現況調查表 p3（負擔/法規指標）
請根據 supplementary_data（謄本/都計/國土/建管資料），白話解釋以下項目的欄位意義：
- 負擔（民法 826-1 約定登記）
- 建蔽率/容積率（若適用）
- 套繪管制限制
- 分割限制
缺值標「待補」；解釋限於欄位意義，不得下結論。最後加小字：「詳細限制請洽主管機關確認。」

---

#### 章節 11：基地/土地現況調查表 p4（特別管制）
請根據 supplementary_data（主管機關/圖資），說明可能涉及的管制類型並建議查證方式：
- 河川區域/排水範圍
- 國家公園（特別景觀/生態保護/史蹟保存區等）
- 其他特別管制（山坡地保育/原住民族土地等）
格式：項目 | 是否涉及（取自資料，缺則待補）| 建議查證方式
最後聲明：「本欄位資料僅供參考，實際管制範圍以主管機關公告為準。」

---

#### 章節 12：土地增值稅概算（一般/自用）
本章所有數字取自 system_computed，請輸出雙欄比較表：
| 項目 | 一般稅率 | 自用稅率 |
|------|---------|---------|
| 試算金額 | | |
| 試算基礎 | | |
| 原地價/現值 | | |
| 物價指數 | | |
| 扣除額 | | |
| 持分 | | |
缺值填「待補」。

---

#### 章節 13：成交行情/透明房價（附錄）
請根據 external_data 中的實登資料，撰寫 1 段「行情解讀」（80~150 字），說明樣本範圍（地段/地號/土地類型）、期間、及可能偏誤（如持分交易/非標準地形等）。缺資料時標「待補」。

---

#### 章節 14：周遭機能
請根據 external_data 中的周遭設施清單，撰寫 3~5 點摘要（採買/通勤/農業資源/公共設施等）。格式：
- [類別]：[名稱，距離]（取自 external_data，缺則待補）

---

#### 章節 15：照片索引
本章由系統依上傳照片自動產生，無需 AI 內容。請輸出：
（照片索引由系統自動填入）

---

#### 章節 16：買方確認/簽章頁
本章為固定模板，請輸出以下文字：
承買人確認已詳閱本說明書全部內容，並了解各項條款及土地現況。
- 承買人姓名：_______________
- 日期：_______________
- 簽章：_______________
`;

  const result = await runCodex(prompt);

  if (!result.success) {
    // Return a placeholder with error note on failure
    return `# 土地版不動產說明書（產生失敗）\n\n> 錯誤：${result.error ?? '未知錯誤'}\n> 狀態：${result.status}\n\n請重試或聯絡系統管理員。`;
  }

  return result.output ?? '# 土地版不動產說明書\n\n（無內容回傳）';
}
