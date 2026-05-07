import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLicense, saveLicense } from '../../lib/store';

/** 預設功能（基本版）— 管理員可事後調整 */
const DEFAULT_FEATURES = ['disclosure-document'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, licenseKey, allowedCidr } = req.body as {
    email?: string;
    licenseKey?: string;
    allowedCidr?: string;
  };

  if (!email || !licenseKey) {
    return res.status(400).json({ error: 'email and licenseKey are required' });
  }

  const existing = await getLicense(licenseKey);

  if (!existing) {
    return res.status(404).json({ valid: false, reason: 'license_not_found' });
  }

  if (!existing.active || existing.status === 'revoked') {
    return res.status(403).json({ valid: false, reason: 'license_inactive' });
  }

  if (existing.status === 'activated') {
    if (existing.email !== email.toLowerCase()) {
      return res.status(409).json({ error: 'License already activated for a different email' });
    }
    return res.status(409).json({ error: 'License already activated' });
  }

  if (existing.status !== 'issued') {
    return res.status(409).json({ error: 'License status is not activatable' });
  }

  const now = new Date().toISOString();
  const record = {
    ...existing,
    email: email.toLowerCase(),
    allowedCidr: allowedCidr ?? existing.allowedCidr ?? '0.0.0.0/0',
    features: existing.features?.length ? existing.features : DEFAULT_FEATURES,
    activatedAt: now,
    status: 'activated' as const,
    active: true,
  };

  await saveLicense(record);
  return res.status(200).json({ ok: true, features: record.features });
}
