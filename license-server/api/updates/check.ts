import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLicense } from '../../lib/store';

/** R2 bucket 公開路徑 */
const R2_BASE_URL = process.env.R2_PUBLIC_URL ?? 'https://r2.aire.app/releases';

interface LatestInfo {
  version: string;
  files: { platform: string; filename: string; sha256: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const licenseKey = req.query['key'] as string | undefined;
  const currentVersion = req.query['version'] as string | undefined;

  if (!licenseKey) {
    return res.status(400).json({ error: 'key query param is required' });
  }

  const record = await getLicense(licenseKey);
  if (!record || !record.active || record.status !== 'activated') {
    return res.status(403).json({ error: 'Invalid or inactive license' });
  }

  // 讀取 R2 上的 latest.json
  const latestUrl = `${R2_BASE_URL}/latest.json`;
  let latest: LatestInfo;
  try {
    const r = await fetch(latestUrl);
    if (!r.ok) throw new Error(`R2 latest.json fetch failed: ${r.status}`);
    latest = (await r.json()) as LatestInfo;
  } catch {
    return res.status(503).json({ error: 'Update server unavailable' });
  }

  if (currentVersion === latest.version) {
    return res.status(200).json({ upToDate: true, version: latest.version });
  }

  // 簽名 URL（直接回傳公開 R2 URL，未來可改為 Presigned）
  const platform = req.headers['user-agent']?.includes('Windows') ? 'win' : 'mac';
  const fileInfo = latest.files.find((f) => f.platform === platform) ?? latest.files[0];

  return res.status(200).json({
    upToDate: false,
    version: latest.version,
    downloadUrl: `${R2_BASE_URL}/v${latest.version}/${fileInfo?.filename ?? ''}`,
    hash: fileInfo?.sha256 ?? '',
  });
}
