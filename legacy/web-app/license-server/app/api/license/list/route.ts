import { NextRequest, NextResponse } from 'next/server';
import { hasValidAdminTokenFromHeaders } from '../../../../lib/admin-auth';
import { listLicenses, type LicenseStatus } from '../../../../lib/store';

export const runtime = 'nodejs';

const ALLOWED_STATUS: LicenseStatus[] = ['issued', 'activated', 'revoked'];

function parsePositiveInt(value: unknown, fallback: number): number {
  const raw = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(raw)) return fallback;
  return raw;
}

export async function GET(req: NextRequest) {
  if (!hasValidAdminTokenFromHeaders(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const searchParams = new URL(req.url).searchParams;
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), 20);
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: 'invalid_pagination' }, { status: 400 });
  }

  const statusRaw = searchParams.get('status');
  const status = typeof statusRaw === 'string' && ALLOWED_STATUS.includes(statusRaw as LicenseStatus)
    ? (statusRaw as LicenseStatus)
    : undefined;

  if (typeof statusRaw === 'string' && !status) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const searchRaw = searchParams.get('search');
  const search = typeof searchRaw === 'string' ? searchRaw.trim().toLowerCase() : '';

  const result = await listLicenses({ status, search: search || undefined, page, pageSize });

  return NextResponse.json({
    ...result,
    items: result.items.map((item, idx) => ({ index: idx + 1, ...item })),
  }, { status: 200 });
}
