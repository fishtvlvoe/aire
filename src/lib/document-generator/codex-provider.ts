import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { DocumentGenerator, DocumentGeneratorInput, GeneratedDocuments } from './types';

const execFileAsync = promisify(execFile);

const PROMPT_TEMPLATE =
  '你是一位台灣房仲行銷專家，根據以下物件資料，產出所有行銷文件。物件資料：{JSON}。請以JSON格式回覆，包含欄位：disclosure_document、property_survey、listing_591（純文字無markdown）、sales_dm、social_posts（含facebook≤63206字、instagram≤2200字、threads≤500字、tiktok≤2200字、youtube≤5000字）、short_video_script（100-150中文字含行動呼籲）';

export class CodexDocumentGenerator implements DocumentGenerator {
  async generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments> {
    const promptString = PROMPT_TEMPLATE.replace('{JSON}', JSON.stringify(input));
    let stdout: string = '';
    let stderr: string = '';
    try {
      const { stdout: out, stderr: err } = await execFileAsync('codex', ['exec', promptString], { timeout: 120000 });
      stdout = String(out);
      stderr = String(err);
    } catch (error: any) {
      if (error.stderr) {
        throw new Error(error.stderr);
      }
      throw error;
    }
    const start = stdout.indexOf('{');
    const end = stdout.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('Failed to parse document generator output');
    }
    const jsonString = stdout.slice(start, end + 1);
    try {
      return JSON.parse(jsonString) as GeneratedDocuments;
    } catch {
      throw new Error('Failed to parse document generator output');
    }
  }
}
