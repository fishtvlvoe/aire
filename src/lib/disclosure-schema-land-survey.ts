// 土地版現況調查表 — 35 題 Schema
// 對應 disclosure_drafts.survey_data JSON 欄位

export interface LandSurveyData {
  q1: boolean | null;  // 是否有占用情事
  q2: boolean | null;  // 是否有出租
  q3: boolean | null;  // 是否有設定地上權
  q4: boolean | null;  // 是否為道路用地
  q5: boolean | null;  // 是否為法定空地
  q6: boolean | null;  // 是否為既成道路
  q7: boolean | null;  // 是否為公共設施保留地
  q8: boolean | null;  // 是否位於山坡地範圍
  q9: boolean | null;  // 是否位於原住民保留地
  q10: boolean | null; // 是否位於水源水質保護區
  q11: boolean | null; // 是否位於自然保護區
  q12: boolean | null; // 是否位於國家公園範圍
  q13: boolean | null; // 是否位於行水區
  q14: boolean | null; // 周邊是否有嫌惡設施（此題特殊：多項 checkbox）
  q15: boolean | null; // 是否有未登記建物
  q16: boolean | null; // 是否有地上物
  q17: boolean | null; // 是否有墳墓
  q18: boolean | null; // 是否曾發生凶殺或自殺致死情事
  q19: boolean | null; // 是否曾為垃圾掩埋場
  q20: boolean | null; // 是否曾發生火災
  q21: boolean | null; // 是否位於土壤液化潛勢區
  q22: boolean | null; // 是否為海砂地質
  q23: boolean | null; // 是否位於斷層帶
  q24: boolean | null; // 是否鄰近高壓電塔
  q25: boolean | null; // 是否有電磁波疑慮
  q26: boolean | null; // 地勢是否低窪易淹水
  q27: boolean | null; // 是否位於土石流潛勢區
  q28: boolean | null; // 是否有地層下陷
  q29: boolean | null; // 是否為農地重劃區
  q30: boolean | null; // 是否有畸零地情形
  q31: boolean | null; // 是否位於都市更新範圍
  q32: boolean | null; // 是否曾供作工廠使用
  q33: boolean | null; // 是否有土壤或地下水污染
  q34: boolean | null; // 是否有其他足以影響交易之重要事項
  q35: boolean | null; // 確認以上告知事項均屬實
}

/** 題 14 嫌惡設施多選子項目 */
export const Q14_NUISANCE_ITEMS = [
  '加油站', '瓦斯行', '墳墓', '殯儀館', '焚化爐',
  '垃圾場', '變電所', '高壓電塔', '電信基地台', '飛機場',
  '高架道路', '鐵路', '捷運', '公墓', '火葬場',
  '骨灰存放設施', '醫院', '特種營業', '廟宇', '教堂',
  '污水處理廠', '水肥處理廠', '核能電廠', '彈藥庫', '其他',
] as const;

/** 35 題完整題目清單 */
export const LAND_SURVEY_QUESTIONS: Array<{
  id: keyof LandSurveyData;
  label: string;
}> = [
  { id: 'q1',  label: '本標的物是否有被他人占用情事？' },
  { id: 'q2',  label: '本標的物是否有出租予他人？' },
  { id: 'q3',  label: '本標的物是否有設定地上權？' },
  { id: 'q4',  label: '本標的物是否為道路用地？' },
  { id: 'q5',  label: '本標的物是否為法定空地？' },
  { id: 'q6',  label: '本標的物是否為既成巷道？' },
  { id: 'q7',  label: '本標的物是否為公共設施保留地？' },
  { id: 'q8',  label: '本標的物是否位於山坡地範圍？' },
  { id: 'q9',  label: '本標的物是否位於原住民保留地？' },
  { id: 'q10', label: '本標的物是否位於水源水質水量保護區？' },
  { id: 'q11', label: '本標的物是否位於自然保留區或野生動物保護區？' },
  { id: 'q12', label: '本標的物是否位於國家公園範圍？' },
  { id: 'q13', label: '本標的物是否位於行水區或河川區域？' },
  { id: 'q14', label: '本標的物周邊是否有嫌惡設施？' },
  { id: 'q15', label: '本標的物上是否有未辦保存登記之建物？' },
  { id: 'q16', label: '本標的物上是否有地上物？' },
  { id: 'q17', label: '本標的物上是否有墳墓？' },
  { id: 'q18', label: '本標的物是否曾發生兇殺或自殺致死之情事？' },
  { id: 'q19', label: '本標的物是否曾為垃圾掩埋場用地？' },
  { id: 'q20', label: '本標的物是否曾發生火災？' },
  { id: 'q21', label: '本標的物是否位於土壤液化潛勢區？' },
  { id: 'q22', label: '本標的物是否為海砂地質？' },
  { id: 'q23', label: '本標的物是否位於活動斷層地質敏感區？' },
  { id: 'q24', label: '本標的物是否鄰近高壓電塔或變電所？' },
  { id: 'q25', label: '本標的物是否有電磁波干擾？' },
  { id: 'q26', label: '本標的物地勢是否低窪且有淹水紀錄？' },
  { id: 'q27', label: '本標的物是否位於土石流潛勢溪流影響範圍？' },
  { id: 'q28', label: '本標的物是否有地層下陷？' },
  { id: 'q29', label: '本標的物是否為農地重劃區？' },
  { id: 'q30', label: '本標的物是否有畸零地情形？' },
  { id: 'q31', label: '本標的物是否位於都市更新範圍？' },
  { id: 'q32', label: '本標的物是否曾供作工廠使用？' },
  { id: 'q33', label: '本標的物是否有土壤或地下水污染？' },
  { id: 'q34', label: '是否有其他足以影響不動產交易之重要事項？' },
  { id: 'q35', label: '賣方確認以上告知事項均為真實，如有不實願負法律責任。' },
];

/** 建立空白調查表（所有題目 null = 未填） */
export function createEmptyLandSurvey(): LandSurveyData {
  return Object.fromEntries(
    Array.from({ length: 35 }, (_, i) => [`q${i + 1}`, null])
  ) as unknown as LandSurveyData;
}
