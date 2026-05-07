import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasValidAdminToken } from '../../lib/admin-auth';
import { listLicenses, type LicenseStatus } from '../../lib/store';

const ALLOWED_STATUS: LicenseStatus[] = ['issued', 'activated', 'revoked'];

function parsePositiveInt(value: unknown, fallback: number): number {
  const raw = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(raw)) return fallback;
  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const page = parsePositiveInt(req.query.page, 1);
  const pageSize = parsePositiveInt(req.query.pageSize, 20);
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ error: 'invalid_pagination' });
  }

  const statusRaw = req.query.status;
  const status = typeof statusRaw === 'string' && ALLOWED_STATUS.includes(statusRaw as LicenseStatus)
    ? (statusRaw as LicenseStatus)
    : undefined;

  if (typeof statusRaw === 'string' && !status) {
    return res.status(400).json({ error: 'invalid_status' });
  }

  const result = await listLicenses({ status, page, pageSize });
  return res.status(200).json(result);
}

