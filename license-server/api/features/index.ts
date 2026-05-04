import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLicense } from '../../lib/store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const licenseKey = req.query['key'] as string | undefined;
  const email = req.query['email'] as string | undefined;

  if (!licenseKey || !email) {
    return res.status(400).json({ error: 'key and email query params are required' });
  }

  const record = await getLicense(licenseKey);

  if (!record || record.email !== email.toLowerCase() || !record.active) {
    return res.status(403).json({ error: 'Invalid or inactive license', features: [] });
  }

  // 快取 1 分鐘（App 啟動時拉取）
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json({ features: record.features });
}
