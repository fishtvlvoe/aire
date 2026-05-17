// 成屋版現況調查表 — 58 題 Schema
// 對應 disclosure_drafts.survey_data JSON 欄位（建物版）

export interface BuildingSurveyData {
  // ── 第一部分：基地現況調查（1-35，同土地版）──
  q1: boolean | null;   // 是否有占用情事
  q2: boolean | null;   // 是否有出租
  q3: boolean | null;   // 是否有設定地上權
  q4: boolean | null;   // 是否為道路用地
  q5: boolean | null;   // 是否為法定空地
  q6: boolean | null;   // 是否為既成道路
  q7: boolean | null;   // 是否為公共設施保留地
  q8: boolean | null;   // 是否位於山坡地範圍
  q9: boolean | null;   // 是否位於原住民保留地
  q10: boolean | null;  // 是否位於水源水質保護區
  q11: boolean | null;  // 是否位於自然保護區
  q12: boolean | null;  // 是否位於國家公園範圍
  q13: boolean | null;  // 是否位於行水區
  q14: boolean | null;  // 周邊是否有嫌惡設施（多選）
  q15: boolean | null;  // 是否有未登記建物
  q16: boolean | null;  // 是否有地上物
  q17: boolean | null;  // 是否有墳墓
  q18: boolean | null;  // 是否曾發生凶殺或自殺致死
  q19: boolean | null;  // 是否曾為垃圾掩埋場
  q20: boolean | null;  // 是否曾發生火災
  q21: boolean | null;  // 是否位於土壤液化潛勢區
  q22: boolean | null;  // 是否為海砂地質
  q23: boolean | null;  // 是否位於斷層帶
  q24: boolean | null;  // 是否鄰近高壓電塔
  q25: boolean | null;  // 是否有電磁波疑慮
  q26: boolean | null;  // 地勢是否低窪易淹水
  q27: boolean | null;  // 是否位於土石流潛勢區
  q28: boolean | null;  // 是否有地層下陷
  q29: boolean | null;  // 是否為農地重劃區
  q30: boolean | null;  // 是否有畸零地情形
  q31: boolean | null;  // 是否位於都市更新範圍
  q32: boolean | null;  // 是否曾供作工廠使用
  q33: boolean | null;  // 是否有土壤或地下水污染
  q34: boolean | null;  // 是否有其他重要事項
  q35: boolean | null;  // 確認告知事項均屬實

  // ── 第二部分：稅費相關（36-38）──
  q36: boolean | null;  // 是否了解土地增值稅規定
  q37: boolean | null;  // 是否了解房屋稅規定
  q38: boolean | null;  // 是否了解契稅規定

  // ── 第三部分：建物瑕疵（39-45）──
  q39: boolean | null;  // 是否有滲漏水情形
  q40: boolean | null;  // 是否有壁癌情形
  q41: boolean | null;  // 是否有違建
  q42: boolean | null;  // 是否曾發生火災
  q43: boolean | null;  // 是否經鑑定為危險建築
  q44: boolean | null;  // 是否有龜裂情形
  q45: boolean | null;  // 是否有鋼筋外露

  // ── 第四部分：設備狀況（46-51）──
  q46: boolean | null;  // 電梯是否正常運作
  q47: boolean | null;  // 消防設備是否正常
  q48: boolean | null;  // 是否有無障礙設施
  q49: boolean | null;  // 水電管線是否正常
  q50: boolean | null;  // 是否有夾層
  q51: boolean | null;  // 是否有居住使用限制

  // ── 第五部分：管理狀況（52-56）──
  q52: boolean | null;  // 是否有規約
  q53: boolean | null;  // 管理費是否有欠繳
  q54: boolean | null;  // 是否有公共基金
  q55: boolean | null;  // 是否有管理委員會
  q56: boolean | null;  // 是否有使用限制

  // ── 第六部分：停車位（57-58）──
  q57: boolean | null;  // 停車位是否有產權登記
  q58: boolean | null;  // 停車位使用是否有限制
}

/** 58 題完整題目清單（含 section 分組） */
export const BUILDING_SURVEY_QUESTIONS: Array<{
  id: keyof BuildingSurveyData;
  label: string;
  section: string;
}> = [
  // ── 基地現況調查（q1-q35）──
  { id: 'q1',  label: '本標的物是否有被他人占用情事？',              section: '基地現況調查' },
  { id: 'q2',  label: '本標的物是否有出租予他人？',                  section: '基地現況調查' },
  { id: 'q3',  label: '本標的物是否有設定地上權？',                  section: '基地現況調查' },
  { id: 'q4',  label: '本標的物是否為道路用地？',                    section: '基地現況調查' },
  { id: 'q5',  label: '本標的物是否為法定空地？',                    section: '基地現況調查' },
  { id: 'q6',  label: '本標的物是否為既成巷道？',                    section: '基地現況調查' },
  { id: 'q7',  label: '本標的物是否為公共設施保留地？',              section: '基地現況調查' },
  { id: 'q8',  label: '本標的物是否位於山坡地範圍？',                section: '基地現況調查' },
  { id: 'q9',  label: '本標的物是否位於原住民保留地？',              section: '基地現況調查' },
  { id: 'q10', label: '本標的物是否位於水源水質水量保護區？',        section: '基地現況調查' },
  { id: 'q11', label: '本標的物是否位於自然保留區或野生動物保護區？',section: '基地現況調查' },
  { id: 'q12', label: '本標的物是否位於國家公園範圍？',              section: '基地現況調查' },
  { id: 'q13', label: '本標的物是否位於行水區或河川區域？',          section: '基地現況調查' },
  { id: 'q14', label: '本標的物周邊是否有嫌惡設施？',               section: '基地現況調查' },
  { id: 'q15', label: '本標的物上是否有未辦保存登記之建物？',        section: '基地現況調查' },
  { id: 'q16', label: '本標的物上是否有地上物？',                    section: '基地現況調查' },
  { id: 'q17', label: '本標的物上是否有墳墓？',                      section: '基地現況調查' },
  { id: 'q18', label: '本標的物是否曾發生兇殺或自殺致死之情事？',    section: '基地現況調查' },
  { id: 'q19', label: '本標的物是否曾為垃圾掩埋場用地？',            section: '基地現況調查' },
  { id: 'q20', label: '本標的物是否曾發生火災？',                    section: '基地現況調查' },
  { id: 'q21', label: '本標的物是否位於土壤液化潛勢區？',            section: '基地現況調查' },
  { id: 'q22', label: '本標的物是否為海砂地質？',                    section: '基地現況調查' },
  { id: 'q23', label: '本標的物是否位於活動斷層地質敏感區？',        section: '基地現況調查' },
  { id: 'q24', label: '本標的物是否鄰近高壓電塔或變電所？',          section: '基地現況調查' },
  { id: 'q25', label: '本標的物是否有電磁波干擾？',                  section: '基地現況調查' },
  { id: 'q26', label: '本標的物地勢是否低窪且有淹水紀錄？',          section: '基地現況調查' },
  { id: 'q27', label: '本標的物是否位於土石流潛勢溪流影響範圍？',    section: '基地現況調查' },
  { id: 'q28', label: '本標的物是否有地層下陷？',                    section: '基地現況調查' },
  { id: 'q29', label: '本標的物是否為農地重劃區？',                  section: '基地現況調查' },
  { id: 'q30', label: '本標的物是否有畸零地情形？',                  section: '基地現況調查' },
  { id: 'q31', label: '本標的物是否位於都市更新範圍？',              section: '基地現況調查' },
  { id: 'q32', label: '本標的物是否曾供作工廠使用？',                section: '基地現況調查' },
  { id: 'q33', label: '本標的物是否有土壤或地下水污染？',            section: '基地現況調查' },
  { id: 'q34', label: '是否有其他足以影響不動產交易之重要事項？',    section: '基地現況調查' },
  { id: 'q35', label: '賣方確認以上告知事項均為真實，如有不實願負法律責任。', section: '基地現況調查' },

  // ── 稅費告知（q36-q38）──
  { id: 'q36', label: '賣方是否了解土地增值稅相關規定？',            section: '稅費告知' },
  { id: 'q37', label: '賣方是否了解房屋稅相關規定？',                section: '稅費告知' },
  { id: 'q38', label: '賣方是否了解契稅相關規定？',                  section: '稅費告知' },

  // ── 建物瑕疵（q39-q45）──
  { id: 'q39', label: '本建物是否有滲漏水情形？',                    section: '建物瑕疵' },
  { id: 'q40', label: '本建物是否有壁癌（白華）現象？',              section: '建物瑕疵' },
  { id: 'q41', label: '本建物是否有違章建築？',                      section: '建物瑕疵' },
  { id: 'q42', label: '本建物是否曾發生火災或其他天然災害？',        section: '建物瑕疵' },
  { id: 'q43', label: '本建物是否經鑑定為危險建築物（危樓）？',      section: '建物瑕疵' },
  { id: 'q44', label: '本建物是否有明顯龜裂現象？',                  section: '建物瑕疵' },
  { id: 'q45', label: '本建物是否有鋼筋外露情形？',                  section: '建物瑕疵' },

  // ── 設備狀況（q46-q51）──
  { id: 'q46', label: '本建物電梯設備是否正常運作？',                section: '設備狀況' },
  { id: 'q47', label: '本建物消防設備是否正常？',                    section: '設備狀況' },
  { id: 'q48', label: '本建物是否設有無障礙設施？',                  section: '設備狀況' },
  { id: 'q49', label: '本建物水電管線是否正常使用？',                section: '設備狀況' },
  { id: 'q50', label: '本建物是否有夾層（不合法夾層）？',            section: '設備狀況' },
  { id: 'q51', label: '本建物是否有居住使用上之限制？',              section: '設備狀況' },

  // ── 管理狀況（q52-q56）──
  { id: 'q52', label: '本社區是否訂有住戶規約？',                    section: '管理狀況' },
  { id: 'q53', label: '管理費是否有欠繳情形？',                      section: '管理狀況' },
  { id: 'q54', label: '本社區是否設有公共基金？',                    section: '管理狀況' },
  { id: 'q55', label: '本社區是否成立管理委員會？',                  section: '管理狀況' },
  { id: 'q56', label: '本建物使用是否有特別限制（如不得經營特定行業）？', section: '管理狀況' },

  // ── 停車位（q57-q58）──
  { id: 'q57', label: '停車位是否有產權登記（含權狀）？',            section: '停車位' },
  { id: 'q58', label: '停車位使用是否有其他限制？',                  section: '停車位' },
];

/** 建立空白成屋調查表（所有題目 null = 未填） */
export function createEmptyBuildingSurvey(): BuildingSurveyData {
  return Object.fromEntries(
    Array.from({ length: 58 }, (_, i) => [`q${i + 1}`, null])
  ) as unknown as BuildingSurveyData;
}
