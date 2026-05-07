import { NextRequest, NextResponse } from 'next/server';
import { getLicense } from '../../../lib/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const licenseKey = searchParams.get('key') ?? undefined;
  const email = searchParams.get('email') ?? undefined;

  if (!licenseKey || !email) {
    return NextResponse.json({ error: 'key and email query params are required' }, { status: 400 });
  }

  const record = await getLicense(licenseKey);

  if (!record || record.email !== email.toLowerCase() || !record.active || record.status !== 'activated') {
    return NextResponse.json({ error: 'Invalid or inactive license', features: [] }, { status: 403 });
  }

  // 快取 1 分鐘（App 啟動時拉取）
  const response = NextResponse.json({ features: record.features }, { status: 200 });
  response.headers.set('Cache-Control', 'public, max-age=60');
  return response;
}
