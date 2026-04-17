import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';

export async function generateSurvey(input: DocumentGeneratorInput): Promise<string> {
  const prompt = `你是台灣房仲專業秘書。根據以下物件資料，產出「物件調查表（物調表）」，格式為 Markdown。
物件類型：${input.property_type}
物件資料：${JSON.stringify(input.field_visit_data)}
秘書補充：${JSON.stringify(input.supplementary_data)}

物調表應包含：基本資訊、建物/土地現況、法律狀態、稅費資訊、特殊備註。
請以繁體中文輸出，格式清楚。`;
  const result = await runCodex(prompt);
  if (!result.success) throw new Error(result.error ?? `runCodex failed (status: ${result.status})`);
  return result.output ?? '';
}
