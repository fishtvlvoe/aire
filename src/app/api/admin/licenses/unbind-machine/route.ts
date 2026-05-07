import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL ?? 'https://three-ai-license-server.vercel.app';

interface UnbindMachineBody {
  key?: string;
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

// POST 代理 → license-server PATCH /api/license/update-info
// body: { key }，傳給後端 { key, machineId: null }（清除 machineId）
// 注意：後端的 update-info API 目前不支援更新 machineId，
// 所以先用暫時方案：用 PATCH /api/license/update-info 帶 machineId: null
export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const body = (await req.json()) as UnbindMachineBody;
  return proxyToLicenseServer('/api/license/update-info', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: body.key, machineId: null }),
  });
}
