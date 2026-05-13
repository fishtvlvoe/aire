import { fetchDataAPI, type ApiResult } from './index';

export interface TranscriptParseRemoteResponse {
  fields: Record<string, unknown>;
  confidence: number;
}

/**
 * 呼叫雲端謄本解析 API。
 *
 * 雲端 API 不可用時回 `{ available: false, data: null }`，
 * 呼叫端應 fallback 到本地 `parseTranscript`（src/lib/parsers/transcript-parser.ts）。
 */
export async function parseTranscriptRemote(
  text: string
): Promise<ApiResult<TranscriptParseRemoteResponse>> {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { available: false, data: null, error: 'empty transcript text' };
  }
  return fetchDataAPI<TranscriptParseRemoteResponse>('/api/data/parse-transcript', {
    method: 'POST',
    body: trimmed,
    headers: { 'Content-Type': 'text/plain' },
  });
}
