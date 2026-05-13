import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';
import { getSupValue } from '../utils';

export async function generateSocialPosts(input: DocumentGeneratorInput): Promise<string> {
  const supSummary = [
    `優缺點：${getSupValue(input.supplementary_data, 'pros_cons')}`,
    `管理費：${getSupValue(input.supplementary_data, 'management_fee')}`,
    `用途：${getSupValue(input.supplementary_data, 'usage')}`,
    `社區/設備：${getSupValue(input.supplementary_data, 'amenities')}`,
  ].join('\n');

  const prompt = `你是台灣房仲社群行銷專家。根據以下物件資料，產出 5 個社群平台的貼文，格式為 Markdown，以 ## 平台名分節。
物件類型：${input.property_type}
物件資料：${JSON.stringify(input.field_visit_data)}
秘書補充（缺值以 **【待補】** 顯示）：
${supSummary}

請依序輸出以下 5 個平台，每個平台包含：貼文內容（繁體中文）＋圖片提示詞（Image prompt in English）：

## Facebook
- 字數上限：63206 字
- 風格：詳細說明、適合分享、可使用 emoji
- 附 Image prompt（英文，描述適合的房產照片或情境圖）

## Instagram
- 字數上限：2200 字
- 風格：視覺感強、hashtag 豐富（15 個以上）、emoji 活潑
- 附 Image prompt（英文，描述適合 IG 美感的視覺）

## Threads
- 字數上限：500 字
- 風格：簡潔有力、對話感強、引發互動
- 附 Image prompt（英文）

## TikTok
- 字數上限：2200 字
- 風格：年輕活潑、口語化、帶懸念或趣味性、適合配音
- 附 Image prompt（英文，描述適合短影音封面的視覺）

## YouTube
- 字數上限：5000 字
- 風格：詳細介紹、SEO 友善標題與描述、含時間軸建議
- 附 Image prompt（英文，描述適合 YouTube 縮圖的視覺）

請確保各平台風格差異明顯，符合各平台使用者習慣。`;
  const result = await runCodex(prompt);
  if (!result.success) throw new Error(result.error ?? `runCodex failed (status: ${result.status})`);
  return result.output ?? '';
}
