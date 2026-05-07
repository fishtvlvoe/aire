import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasValidAdminToken } from '../../lib/admin-auth';
import { generateSerialBatch } from '../../lib/serial';
import { saveLicense } from '../../lib/store';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = (req.body ?? {}) as CreateBody;
  const count = parseCount(body.count);
  if (!count) {
    return res.status(400).json({ error: 'invalid_count' });
  }

  const expiresAt = parseExpiresAt(body.expiresAt);
  if (body.expiresAt !== undefined && body.expiresAt !== null && !expiresAt) {
    return res.status(400).json({ error: 'invalid_expires_at' });
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

  return res.status(201).json({
    items: serials.map((key) => ({
      licenseKey: key,
      status: 'issued',
      createdAt: now,
      expiresAt: expiresAt ?? null,
      features,
    })),
  });
}

