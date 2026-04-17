import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SocialDocumentGenerator, DocumentGeneratorInput } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiSocialGenerator implements SocialDocumentGenerator {
  async generate(input: DocumentGeneratorInput) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `你是一位台灣房仲社群行銷專家，根據以下物件資料，產出：\n- social_posts（facebook≤63206字、instagram≤2200字、threads≤500字、tiktok≤2200字、youtube≤5000字）\n- short_video_script（100-150中文字含行動呼籲）\n物件資料：${JSON.stringify(input)}。請以 JSON 格式回覆。`;
    const result = await model.generateContent(prompt);
    const content = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('GeminiSocialGenerator failed: output parse error');
    }
    try {
      return JSON.parse(content.slice(start, end + 1));
    } catch {
      throw new Error('GeminiSocialGenerator failed: output parse error');
    }
  }
}
