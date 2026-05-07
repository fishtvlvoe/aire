import { NextResponse } from 'next/server';
import { setOpenAIApiKey } from '@/lib/codex-client/key-store';

interface VerifyRequestBody {
  apiKey?: string;
}

const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models';
const OPENAI_TIMEOUT_MS = 5000;

function parseApiKey(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalized = input.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(req: Request) {
  let body: VerifyRequestBody;
  try {
    body = (await req.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json-body' }, { status: 400 });
  }

  const apiKey = parseApiKey(body.apiKey);
  if (!apiKey) {
    return NextResponse.json({ error: 'apiKey required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_MODELS_ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    if (response.status === 200) {
      setOpenAIApiKey(apiKey);
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    if (response.status === 401) {
      return NextResponse.json({ valid: false, error: 'API Key 無效' }, { status: 200 });
    }

    return NextResponse.json(
      { valid: false, error: '無法連線 OpenAI，請檢查網路' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: '無法連線 OpenAI，請檢查網路' },
      { status: 200 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

