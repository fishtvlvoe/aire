import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';
import { getSupValue } from '../utils';

export async function generateDm(input: DocumentGeneratorInput): Promise<string> {
  const supSummary = [
    `優缺點：${getSupValue(input.supplementary_data, 'pros_cons')}`,
    `管理費：${getSupValue(input.supplementary_data, 'management_fee')}`,
    `用途：${getSupValue(input.supplementary_data, 'usage')}`,
    `社區/設備：${getSupValue(input.supplementary_data, 'amenities')}`,
    `其他備註：${getSupValue(input.supplementary_data, 'additional_notes')}`,
  ].join('\n');

  const prompt = `你是台灣房仲行銷專家。根據以下物件資料，產出一份「銷售 DM 行銷文案」，格式為 Markdown。
物件類型：${input.property_type}
物件資料：${JSON.stringify(input.field_visit_data)}
秘書補充（缺值以 **【待補】** 顯示）：
${supSummary}

文案應包含：
- 主標題（吸睛、強調核心賣點）
- 副標題（補充說明）
- 物件優點（5 項以上，條列）
- 適合族群（明確描述目標客群）
- 生活機能（交通、學區、商圈、醫療等）
- 行動呼籲（Call to Action，附聯絡方式 placeholder）

請以繁體中文輸出，全文 800 字以內，語氣熱情有感染力。`;
  const result = await runCodex(prompt);
  if (!result.success) throw new Error(result.error ?? `runCodex failed (status: ${result.status})`);
  return result.output ?? '';
}
