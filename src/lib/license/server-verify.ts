import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL ?? 'https://license.three-ai.app';

/** 本地快取路徑（App Data 目錄） */
const CACHE_PATH = path.join(os.homedir(), '.three-ai', 'license-cache.json');

interface LicenseCache {
  valid: boolean;
  features: string[];
  cachedAt: string;
  email: string;
  licenseKey: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小時

function readCache(): LicenseCache | null {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    const data = JSON.parse(raw) as LicenseCache;
    if (Date.now() - new Date(data.cachedAt).getTime() > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: LicenseCache): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data));
  } catch {
    // 快取寫入失敗不阻塞主流程
  }
}

export async function verifyLicense(
  email: string,
  licenseKey: string,
): Promise<{ valid: boolean; features: string[] }> {
  try {
    const res = await fetch(`${LICENSE_SERVER_URL}/api/license/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, licenseKey }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { valid: false, features: [] };
    }

    const data = (await res.json()) as { valid: boolean; features: string[] };

    if (data.valid) {
      writeCache({
        valid: true,
        features: data.features,
        cachedAt: new Date().toISOString(),
        email,
        licenseKey,
      });
    }

    return data;
  } catch {
    // 網路失敗時使用快取（離線容錯）
    const cached = readCache();
    if (cached?.email === email && cached?.licenseKey === licenseKey) {
      return { valid: cached.valid, features: cached.features };
    }
    // 無快取 → 鎖住
    return { valid: false, features: [] };
  }
}

export function getCachedLicense(): LicenseCache | null {
  return readCache();
}
