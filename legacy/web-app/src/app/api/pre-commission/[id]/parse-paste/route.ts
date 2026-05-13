import { NextResponse } from 'next/server';
import { runCodex } from '@/lib/codex-client';

interface ParsePasteBody {
  rawText: string;
}

const MAX_RAW_TEXT_LENGTH = 20_000;

function parseRawText(rawText: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf('：');
    const fallbackSeparatorIndex = trimmed.indexOf(':');
    const splitIndex = separatorIndex >= 0 ? separatorIndex : fallbackSeparatorIndex;

    if (splitIndex < 0) continue;

    const key = trimmed.slice(0, splitIndex).trim();
    const value = trimmed.slice(splitIndex + 1).trim();

    if (!key || !value) continue;
    parsed[key] = value;
  }

  return parsed;
}

function buildCodexPrompt(rawText: string): string {
  return `以下是台灣不動產謄本的全文，請抽取關鍵欄位，回傳 JSON，格式為 { "欄位名": "值" }。
只回傳 JSON，不要任何說明文字。

重要欄位（有就取）：地號、面積、地目、使用分區、所有權人、持分、抵押狀況、查封狀況、建號、建物面積、主要用途、建築完成日期

謄本全文：
${rawText}`;
}

function parseCodexOutputToJson(output: string): Record<string, string> | null {
  const trimmed = output.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace ? normalized.slice(firstBrace, lastBrace + 1) : normalized;

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined) continue;
      const safeKey = key.trim();
      if (!safeKey) continue;
      result[safeKey] = String(value).trim();
    }

    return Object.keys(result).length ? result : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ParsePasteBody>;

    if (typeof body.rawText !== 'string') {
      return NextResponse.json({ error: 'rawText 格式錯誤' }, { status: 400 });
    }

    if (body.rawText.length > MAX_RAW_TEXT_LENGTH) {
      return NextResponse.json({ error: 'rawText 超過長度上限' }, { status: 400 });
    }

    // Truncate before inserting into LLM prompt to prevent prompt injection via long input
    const safeRawText = body.rawText.slice(0, MAX_RAW_TEXT_LENGTH);

    try {
      const prompt = buildCodexPrompt(safeRawText);
      const result = await runCodex(prompt);

      if (result.success && result.output) {
        const parsedByCodex = parseCodexOutputToJson(result.output);
        if (parsedByCodex) {
          return NextResponse.json({ parsed: parsedByCodex, source: 'codex' as const });
        }
      }
    } catch {
      // Codex parse failure should gracefully fallback to regex mode.
    }

    const parsedByRegex = parseRawText(safeRawText);
    return NextResponse.json({ parsed: parsedByRegex, source: 'regex' as const });
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
