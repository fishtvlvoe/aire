import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL ?? 'https://AIRE-license-server.vercel.app';

interface CreateLicenseBody {
  count?: number;
  expiresAt?: string | null;
  features?: string[];
  issuedBy?: string;
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

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const page = req.nextUrl.searchParams.get('page') ?? '1';
  const pageSize = req.nextUrl.searchParams.get('pageSize') ?? '20';
  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');

  const query = new URLSearchParams({ page, pageSize });
  if (status) query.set('status', status);
  if (search?.trim()) query.set('search', search.trim());

  return proxyToLicenseServer(`/api/license/list?${query.toString()}`, {
    method: 'GET',
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const body = (await req.json()) as CreateLicenseBody;
  return proxyToLicenseServer('/api/license/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
