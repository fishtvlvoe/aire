import { NextRequest, NextResponse } from 'next/server';
import { getLicense } from '../../../../lib/store';

export const runtime = 'nodejs';

/** R2 bucket 公開路徑 */
const R2_BASE_URL = process.env.R2_PUBLIC_URL ?? 'https://r2.three-ai.app/releases';

interface LatestInfo {
  version: string;
  files: { platform: string; filename: string; sha256: string }[];
}

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const licenseKey = searchParams.get('key') ?? undefined;
  const currentVersion = searchParams.get('version') ?? undefined;

  if (!licenseKey) {
    return NextResponse.json({ error: 'key query param is required' }, { status: 400 });
  }

  const record = await getLicense(licenseKey);
  if (!record || !record.active || record.status !== 'activated') {
    return NextResponse.json({ error: 'Invalid or inactive license' }, { status: 403 });
  }

  // 讀取 R2 上的 latest.json
  const latestUrl = `${R2_BASE_URL}/latest.json`;
  let latest: LatestInfo;
  try {
    const r = await fetch(latestUrl);
    if (!r.ok) throw new Error(`R2 latest.json fetch failed: ${r.status}`);
    latest = (await r.json()) as LatestInfo;
  } catch {
    return NextResponse.json({ error: 'Update server unavailable' }, { status: 503 });
  }

  if (currentVersion === latest.version) {
    return NextResponse.json({ upToDate: true, version: latest.version }, { status: 200 });
  }

  // 簽名 URL（直接回傳公開 R2 URL，未來可改為 Presigned）
  const userAgent = req.headers.get('user-agent') ?? '';
  const platform = userAgent.includes('Windows') ? 'win' : 'mac';
  const fileInfo = latest.files.find((f) => f.platform === platform) ?? latest.files[0];

  return NextResponse.json({
    upToDate: false,
    version: latest.version,
    downloadUrl: `${R2_BASE_URL}/v${latest.version}/${fileInfo?.filename ?? ''}`,
    hash: fileInfo?.sha256 ?? '',
  }, { status: 200 });
}
