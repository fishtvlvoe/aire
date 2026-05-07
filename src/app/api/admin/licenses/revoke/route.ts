import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL ?? 'https://three-ai-license-server.vercel.app';

interface RevokeBody {
  licenseKey?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const token = process.env.LICENSE_ADMIN_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json({ error: 'LICENSE_ADMIN_TOKEN 未設定' }, { status: 500 });
  }

  const body = (await req.json()) as RevokeBody;
  const response = await fetch(`${LICENSE_SERVER_URL}/api/license/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.trim()}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await response.json().catch(() => ({ error: 'upstream_invalid_response' }));
  return NextResponse.json(payload, { status: response.status });
}
