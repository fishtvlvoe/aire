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

  if (existing) {
    if (existing.email !== email.toLowerCase()) {
      return res.status(409).json({ error: 'License already activated for a different email' });
    }
    // 同一 email 重複啟用：更新 CIDR
    existing.allowedCidr = allowedCidr ?? existing.allowedCidr;
    await saveLicense(existing);
    return res.status(200).json({ ok: true, features: existing.features });
  }

  // 首次啟用
  const record = {
    licenseKey,
    email: email.toLowerCase(),
    allowedCidr: allowedCidr ?? '0.0.0.0/0',
    features: DEFAULT_FEATURES,
    activatedAt: new Date().toISOString(),
    expiresAt: null,
    active: true,
  };

  await saveLicense(record);
  return res.status(201).json({ ok: true, features: record.features });
}
