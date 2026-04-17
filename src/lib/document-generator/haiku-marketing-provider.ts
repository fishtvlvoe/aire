import Anthropic from '@anthropic-ai/sdk';
import type { MarketingDocumentGenerator, DocumentGeneratorInput } from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class HaikuMarketingGenerator implements MarketingDocumentGenerator {
  async generate(input: DocumentGeneratorInput) {
    const system = `你是一位台灣房仲行銷專家，根據以下物件資料，產出：\n- listing_591（591 刊登文，純文字無 markdown）\n- sales_dm（銷售 DM 文字）\n請以 JSON 格式回覆。`;
    const user = JSON.stringify(input);
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system,
      messages: [
        { role: 'user', content: user }
      ],
      cache_control: { type: 'ephemeral' }
    });
    // Find first text block
    const textBlock = msg.content.find((block: any) => block.type === 'text');
    const content = typeof textBlock === 'object' && 'text' in textBlock ? (textBlock.text as string) : '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('HaikuMarketingGenerator failed: output parse error');
    }
    try {
      return JSON.parse(content.slice(start, end + 1));
    } catch {
      throw new Error('HaikuMarketingGenerator failed: output parse error');
    }
  }
}
