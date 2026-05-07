import { NextRequest, NextResponse } from 'next/server';
import { generateSerialKey } from '../../../../lib/serial';
import { listLicenses, saveLicense, type LicenseStatus } from '../../../../lib/store';

export const runtime = 'nodejs';

const VALID_STATUS: LicenseStatus[] = ['issued', 'activated', 'revoked'];

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '20', 10);
  const status = searchParams.get('status');
  const search = searchParams.get('search') ?? undefined;

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: 'invalid_pagination' }, { status: 400 });
  }
  if (status && !VALID_STATUS.includes(status as LicenseStatus)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const result = await listLicenses({
    page,
    pageSize,
    status: (status as LicenseStatus | null) ?? undefined,
    search,
  });

  return NextResponse.json({
    ...result,
    items: result.items.map((item, idx) => ({
      index: (page - 1) * pageSize + idx + 1,
      ...item,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    count?: unknown;
    expiresAt?: unknown;
    issuedBy?: unknown;
    features?: unknown;
  };

  const count = typeof body.count === 'number' ? body.count : Number.parseInt(String(body.count ?? ''), 10);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return NextResponse.json({ error: 'invalid_count' }, { status: 400 });
  }

  const expiresAt = typeof body.expiresAt === 'string'
    ? body.expiresAt
    : null;
  const issuedBy = toNullableString(body.issuedBy);
  const features = Array.isArray(body.features)
    ? body.features.filter((item): item is string => typeof item === 'string')
    : ['disclosure-document'];

  const items: Array<{
    licenseKey: string;
    status: 'issued';
    createdAt: string;
    expiresAt: string | null;
    features: string[];
  }> = [];
  const usedInBatch = new Set<string>();

  while (items.length < count) {
    const licenseKey = generateSerialKey();
    if (usedInBatch.has(licenseKey)) continue;
    usedInBatch.add(licenseKey);

    const createdAt = new Date().toISOString();
    const record = {
      licenseKey,
      email: null,
      contactName: null,
      company: null,
      machineId: null,
      allowedCidr: '0.0.0.0/0',
      features,
      createdAt,
      activatedAt: null,
      expiresAt,
      active: true,
      status: 'issued' as const,
      issuedBy,
      revokedAt: null,
      revokedReason: null,
    };
    await saveLicense(record);

    items.push({
      licenseKey,
      status: 'issued',
      createdAt,
      expiresAt,
      features,
    });
  }

  return NextResponse.json({ items });
}
