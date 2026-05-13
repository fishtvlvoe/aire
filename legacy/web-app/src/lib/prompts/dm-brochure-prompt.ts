import type { PropertyDossier } from '@/lib/models/property-dossier';

export interface DmBrochurePromptInput {
  dossier: PropertyDossier;
  persona?: string; // 目標受眾
  pain_points?: string[];
}

const PROPERTY_TYPE_CONTEXTS: Record<string, string> = {
  大樓: '回家按電梯，管理員跟你打招呼',
  透天: '一樓停車直接上樓，不用繞停車場',
  別墅: '後院烤肉，小孩在草地跑',
  土地: '你的夢想藍圖，從這塊地開始畫',
  廠房: '貨車直接進出，隔壁就是交流道',
};

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

export function buildDmBrochurePrompt(input: DmBrochurePromptInput): string {
  const d = input.dossier;
  const typeContext = PROPERTY_TYPE_CONTEXTS[d.property_type] ?? '';
  const persona = (input.persona ?? '').trim();

  const lines: string[] = [
    'SYSTEM: 你是台灣不動產銷售 DM 文案/landing page 編輯。',
    '- 口吻白話、有溫度，但要務實。',
    '- 禁止寫「房價會漲/投資必賺/漲幅/增值保證」。',
    '- 禁止 emoji 堆疊（連續 2 個以上 emoji）。',
    '',
    'USER: 請用 5 區塊 landing page 結構輸出 Markdown：',
    '1 鉤子',
    '2 痛點',
    '3 解決方案',
    '4 強調',
    '5 CTA',
    '',
    `物件類型：${v(d.property_type)}`,
    `地址：${v(d.address)}`,
    `總價：${v(d.total_price)} 萬元`,
  ];

  if (typeContext) lines.push(`情境引子（依類型）：${typeContext}`);
  if (persona) lines.push(`目標 persona：${persona}`);

  lines.push(`痛點：${(input.pain_points ?? []).join('、') || '待補'}`);

  return lines.join('\n');
}

export function buildIgCarouselPrompt(dm_content: string): string {
  return [
    'SYSTEM: 你是 IG 輪播文案編輯。只回 JSON array，長度必須為 7。',
    'USER: 請把下方 landing page 內容改寫成 7 張 IG 輪播圖文字（每張 1-2 句）。',
    '請回覆 JSON：["slide1",..."slide7"]',
    '---',
    dm_content,
  ].join('\n');
}
