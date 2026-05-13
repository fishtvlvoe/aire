import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasValidAdminToken } from '../../lib/admin-auth';
import { revokeLicense } from '../../lib/store';

interface RevokeBody {
  licenseKey?: string;
  reason?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = (req.body ?? {}) as RevokeBody;
  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  if (!licenseKey) {
    return res.status(400).json({ error: 'licenseKey is required' });
  }

  const revoked = await revokeLicense(
    licenseKey,
    typeof body.reason === 'string' ? body.reason.trim() : undefined,
  );
  if (!revoked) {
    return res.status(404).json({ error: 'license_not_found' });
  }

  return res.status(200).json({
    ok: true,
    status: revoked.status,
    revokedAt: revoked.revokedAt,
    revokedReason: revoked.revokedReason,
  });
}

