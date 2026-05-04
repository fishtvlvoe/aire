import { kv } from '@vercel/kv';

export interface LicenseRecord {
  licenseKey: string;
  email: string;
  allowedCidr: string;      // e.g. "192.168.1.0/24" or "0.0.0.0/0"
  features: string[];       // e.g. ["disclosure-document", "contract"]
  activatedAt: string;      // ISO 8601
  expiresAt: string | null; // ISO 8601 or null for perpetual
  active: boolean;
}

function licenseKey(key: string): string {
  return `license:${key}`;
}

function emailIndex(email: string): string {
  return `email-index:${email.toLowerCase()}`;
}

export async function getLicense(key: string): Promise<LicenseRecord | null> {
  return kv.get<LicenseRecord>(licenseKey(key));
}

export async function getLicenseByEmail(email: string): Promise<LicenseRecord | null> {
  const key = await kv.get<string>(emailIndex(email));
  if (!key) return null;
  return getLicense(key);
}

export async function saveLicense(record: LicenseRecord): Promise<void> {
  await kv.set(licenseKey(record.licenseKey), record);
  await kv.set(emailIndex(record.email), record.licenseKey);
}

export async function listAllLicenseKeys(): Promise<string[]> {
  const keys = await kv.keys('license:*');
  return keys.map((k) => k.replace(/^license:/, ''));
}

/** IP 在 CIDR 範圍內 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  if (cidr === '0.0.0.0/0') return true;

  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

  const ipNum = ipToNum(ip);
  const rangeNum = ipToNum(range);
  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNum(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}
