import { NextRequest, NextResponse } from 'next/server';
import { hasValidAdminTokenFromHeaders } from '../../../../lib/admin-auth';
import { generateSerialBatch } from '../../../../lib/serial';
import { saveLicense } from '../../../../lib/store';

export const runtime = 'nodejs';

const DEFAULT_FEATURES = ['disclosure-document'];
const MIN_COUNT = 1;
const MAX_COUNT = 500;

interface CreateBody {
  count?: number;
  expiresAt?: string | null;
  features?: string[];
  issuedBy?: string;
}

function parseCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < MIN_COUNT || value > MAX_COUNT) return null;
  return value;
}

function parseExpiresAt(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date.toISOString();
}

function parseFeatures(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_FEATURES;
  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return normalized.length > 0 ? normalized : DEFAULT_FEATURES;
}

export async function POST(req: NextRequest) {
  if (!hasValidAdminTokenFromHeaders(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as CreateBody;
  const count = parseCount(body.count);
  if (!count) {
    return NextResponse.json({ error: 'invalid_count' }, { status: 400 });
  }

  const expiresAt = parseExpiresAt(body.expiresAt);
  if (body.expiresAt !== undefined && body.expiresAt !== null && !expiresAt) {
    return NextResponse.json({ error: 'invalid_expires_at' }, { status: 400 });
  }

  const features = parseFeatures(body.features);
  const issuedBy = typeof body.issuedBy === 'string' && body.issuedBy.trim()
    ? body.issuedBy.trim()
    : 'admin';

  const now = new Date().toISOString();
  const serials = generateSerialBatch(count);
  await Promise.all(
    serials.map((key) => saveLicense({
      licenseKey: key,
      email: null,
      contactName: null,
      company: null,
      machineId: null,
      allowedCidr: '0.0.0.0/0',
      features,
      createdAt: now,
      activatedAt: null,
      expiresAt: expiresAt ?? null,
      active: true,
      status: 'issued',
      issuedBy,
      revokedAt: null,
      revokedReason: null,
    })),
  );

  return NextResponse.json({
    items: serials.map((key) => ({
      licenseKey: key,
      status: 'issued',
      createdAt: now,
      expiresAt: expiresAt ?? null,
      features,
    })),
  }, { status: 201 });
}
