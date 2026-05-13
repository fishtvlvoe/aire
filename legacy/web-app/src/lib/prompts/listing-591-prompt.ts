import type { PropertyDossier } from '@/lib/models/property-dossier';

export interface Listing591PromptInput {
  dossier: PropertyDossier;
  nearby_facilities?: string; // Layer 2: Google Maps 500m 設施
  future_development?: string; // Layer 3: 交通建設/政府計畫
}

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

export function buildListing591Prompt(input: Listing591PromptInput): string {
  const d = input.dossier;

  const system = [
    'SYSTEM: 你是台灣房仲文案寫手。',
    '- 如實描述，不誇大，不寫「房價會漲/投資必賺/漲幅/增值保證」。',
    '- 白話口吻，避免 emoji 堆疊。',
    '- 受眾導向，提供具體生活情境。',
  ].join('\n');

  const user = [
    'USER: 請依下列物件資料，撰寫 591 發文文案（Markdown）。',
    `- 物件類型：${v(d.property_type)}`,
    `- 地址：${v(d.address)}`,
    `- 總價：${v(d.total_price)} 萬元`,
    '',
    `- 500m 設施（Layer2）：${v(input.nearby_facilities)}`,
    `- 未來建設/發展（Layer3）：${v(input.future_development)}`,
    '',
    '請用 10 段結構（每段用 H2 或數字標題）：',
    '1 物件亮點',
    '2 空間格局',
    '3 生活機能',
    '4 交通',
    '5 學區',
    '6 公園休閒',
    '7 社區管理',
    '8 未來發展',
    '9 受眾推薦',
    '10 聯絡資訊',
    '',
    '字數目標：3000 字（允許 2500-3500）。',
  ].join('\n');

  return `${system}\n\n${user}`;
}
