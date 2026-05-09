import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL ?? 'https://AIRE-license-server.vercel.app';

interface UpdateInfoBody {
  key?: string;
  contactName?: string | null;
  company?: string | null;
  email?: string | null;
}

function getAdminToken(): string | null {
  const token = process.env.LICENSE_ADMIN_TOKEN;
  return token?.trim() ? token.trim() : null;
}

async function proxyToLicenseServer(path: string, init: RequestInit) {
  const token = getAdminToken();
  if (!token) {
    return NextResponse.json({ error: 'LICENSE_ADMIN_TOKEN 未設定' }, { status: 500 });
  }

  const response = await fetch(`${LICENSE_SERVER_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await response.json().catch(() => ({ error: 'upstream_invalid_response' }));
  return NextResponse.json(payload, { status: response.status });
}

// PATCH 代理 → license-server PATCH /api/license/update-info
// 需要 admin 認證（參考 route.ts 的 getAdminUser 寫法）
// body: { key, contactName?, company?, email? }
export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const body = (await req.json()) as UpdateInfoBody;
  return proxyToLicenseServer('/api/license/update-info', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
