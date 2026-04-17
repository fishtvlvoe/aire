import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { FormalDocumentGenerator, DocumentGeneratorInput } from './types';

const execFileAsync = promisify(execFile);

const FORMAL_PROMPT_TEMPLATE = `你是一位台灣房仲行銷專家，根據以下物件資料，產出正式文件：\n- disclosure_document（不動產說明書）\n- property_survey（物調表）\n物件資料：{JSON}。請以 JSON 格式回覆。`;

export class CodexFormalGenerator implements FormalDocumentGenerator {
  async generate(input: DocumentGeneratorInput) {
    const promptString = FORMAL_PROMPT_TEMPLATE.replace('{JSON}', JSON.stringify(input));
    let stdout = '';
    let stderr = '';
    try {
      const { stdout: out, stderr: err } = await execFileAsync('codex', ['exec', promptString], { timeout: 120000 });
      stdout = String(out);
      stderr = String(err);
    } catch (error: any) {
      if (error.stderr) {
        throw new Error('CodexFormalGenerator failed: ' + error.stderr);
      }
      throw new Error('CodexFormalGenerator failed: ' + error);
    }
    const start = stdout.indexOf('{');
    const end = stdout.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('CodexFormalGenerator failed: output parse error');
    }
    const jsonString = stdout.slice(start, end + 1);
    try {
      return JSON.parse(jsonString);
    } catch {
      throw new Error('CodexFormalGenerator failed: output parse error');
    }
  }
}
