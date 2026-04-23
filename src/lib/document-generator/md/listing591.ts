import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';
import { getSupValue } from '../utils';

export async function generateListing591(input: DocumentGeneratorInput): Promise<string> {
  const supSummary = [
    `用途：${getSupValue(input.supplementary_data, 'usage')}`,
    `管理費：${getSupValue(input.supplementary_data, 'management_fee')}`,
    `優缺點：${getSupValue(input.supplementary_data, 'pros_cons')}`,
    `抵押查封：${getSupValue(input.supplementary_data, 'mortgage_lien_status')}`,
    `其他備註：${getSupValue(input.supplementary_data, 'additional_notes')}`,
  ].join('\n');

  const prompt = `你是台灣房仲行銷專家。根據以下物件資料，產出適合張貼於「591 房屋網」的物件貼文，格式為 Markdown。
物件類型：${input.property_type}
物件資料：${JSON.stringify(input.field_visit_data)}
秘書補充（缺值以 **【待補】** 顯示）：
${supSummary}

貼文應包含：
- 吸睛標題（20 字以內）
- 物件特色（3-5 個重點）
- 交通與生活機能
- 售價（若無資料請寫「請洽業務」）
- 聯絡方式（請留 [姓名] / [電話] placeholder）

請以繁體中文輸出，全文 500 字以內，語氣親切專業。`;
  const result = await runCodex(prompt);
  if (!result.success) throw new Error(result.error ?? `runCodex failed (status: ${result.status})`);
  return result.output ?? '';
}
