import { kv } from '@vercel/kv';
import { generateSerialKey } from './serial';

export type LicenseStatus = 'issued' | 'activated' | 'revoked';

export interface LicenseRecord {
  licenseKey: string;
  email: string | null;
  contactName: string | null;  // 客戶姓名
  company: string | null;      // 公司名稱
  machineId: string | null;  // SHA-256 hash of machine ID
  allowedCidr: string;      // e.g. "192.168.1.0/24" or "0.0.0.0/0"
  features: string[];       // e.g. ["disclosure-document", "contract"]
  createdAt: string;        // ISO 8601
  activatedAt: string | null; // ISO 8601
  expiresAt: string | null; // ISO 8601 or null for perpetual
  active: boolean;
  status: LicenseStatus;
  issuedBy: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
}

function licenseKey(key: string): string {
  return `license:${key}`;
}

function emailIndex(email: string): string {
  return `email-index:${email.toLowerCase()}`;
}

export function normalizeLicenseRecord(
  record: Partial<LicenseRecord> & { licenseKey: string },
): LicenseRecord {
  const email = record.email ? record.email.toLowerCase() : null;
  const status =
    record.status
    ?? (record.active === false
      ? 'revoked'
      : (email ? 'activated' : 'issued'));
  const createdAt = record.createdAt ?? record.activatedAt ?? new Date().toISOString();
  const activatedAt = status === 'activated' ? (record.activatedAt ?? createdAt) : null;

  return {
    licenseKey: record.licenseKey,
    email,
    contactName: record.contactName ?? null,
    company: record.company ?? null,
    machineId: record.machineId ?? null,
    allowedCidr: record.allowedCidr ?? '0.0.0.0/0',
    features: record.features ?? ['disclosure-document'],
    createdAt,
    activatedAt,
    expiresAt: record.expiresAt ?? null,
    active: record.active ?? status !== 'revoked',
    status,
    issuedBy: record.issuedBy ?? null,
    revokedAt: record.revokedAt ?? null,
    revokedReason: record.revokedReason ?? null,
  };
}

export async function getLicense(key: string): Promise<LicenseRecord | null> {
  const record = await kv.get<Partial<LicenseRecord> & { licenseKey: string }>(licenseKey(key));
  if (!record) return null;
  return normalizeLicenseRecord({ ...record, licenseKey: record.licenseKey ?? key });
}

export async function getLicenseByEmail(email: string): Promise<LicenseRecord | null> {
  const key = await kv.get<string>(emailIndex(email));
  if (!key) return null;
  return getLicense(key);
}

export async function saveLicense(record: LicenseRecord): Promise<void> {
  const normalized = normalizeLicenseRecord(record);
  await kv.set(licenseKey(normalized.licenseKey), normalized);
  if (normalized.email) {
    await kv.set(emailIndex(normalized.email), normalized.licenseKey);
  }
}

export async function listAllLicenseKeys(): Promise<string[]> {
  const keys = await kv.keys('license:*');
  return keys.map((k) => k.replace(/^license:/, ''));
}

export interface ListLicensesOptions {
  status?: LicenseStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ListLicensesResult {
  items: LicenseRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listLicenses(options: ListLicensesOptions): Promise<ListLicensesResult> {
  const keys = await listAllLicenseKeys();
  const rows = await Promise.all(keys.map(async (key) => getLicense(key)));
  const normalized = rows.filter((row): row is LicenseRecord => !!row);
  const filteredByStatus = options.status
    ? normalized.filter((item) => item.status === options.status)
    : normalized;

  const search = typeof options.search === 'string' ? options.search.trim().toLowerCase() : '';
  const filtered = search
    ? filteredByStatus.filter((item) => {
      const haystack = [
        item.licenseKey,
        item.contactName ?? '',
        item.company ?? '',
        item.email ?? '',
      ].join(' ').toLowerCase();
      return haystack.includes(search);
    })
    : filteredByStatus;

  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (options.page - 1) * options.pageSize;
  return {
    items: filtered.slice(start, start + options.pageSize),
    total: filtered.length,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function revokeLicense(
  key: string,
  reason?: string,
): Promise<LicenseRecord | null> {
  const current = await getLicense(key);
  if (!current) return null;
  const revoked = normalizeLicenseRecord({
    ...current,
    active: false,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
    revokedReason: reason ?? null,
  });
  await saveLicense(revoked);
  return revoked;
}

async function deleteLicenseRecord(record: LicenseRecord): Promise<void> {
  await kv.del(licenseKey(record.licenseKey));
  if (record.email) {
    await kv.del(emailIndex(record.email));
  }
}

export async function transferLicense(
  oldKey: string,
  newContact: { contactName: string | null; company: string | null; email: string | null },
  reason?: string,
): Promise<
  | { ok: true; newLicense: LicenseRecord }
  | { ok: false; error: 'not_found' | 'transfer_failed' }
> {
  const oldLicense = await getLicense(oldKey);
  if (!oldLicense) {
    return { ok: false, error: 'not_found' };
  }

  const newKey = generateSerialKey();
  const newLicense = normalizeLicenseRecord({
    ...oldLicense,
    licenseKey: newKey,
    email: newContact.email,
    contactName: newContact.contactName,
    company: newContact.company,
    machineId: null,
    status: 'issued',
    active: true,
    activatedAt: null,
    createdAt: new Date().toISOString(),
    issuedBy: 'admin',
    revokedAt: null,
    revokedReason: null,
  });

  try {
    await saveLicense(newLicense);
    const revokeReason = reason || `transferred to ${newKey}`;
    const revoked = await revokeLicense(oldKey, revokeReason);
    if (!revoked) {
      try {
        await deleteLicenseRecord(newLicense);
      } catch {
        // 轉移回滾為 best-effort，失敗時仍回傳 transfer_failed
      }
      return { ok: false, error: 'transfer_failed' };
    }
    return { ok: true, newLicense };
  } catch {
    try {
      await deleteLicenseRecord(newLicense);
    } catch {
      // 轉移回滾為 best-effort，失敗時仍回傳 transfer_failed
    }
    return { ok: false, error: 'transfer_failed' };
  }
}

export async function unbindMachine(key: string): Promise<LicenseRecord | null> {
  const current = await getLicense(key);
  if (!current) return null;

  const updated = normalizeLicenseRecord({
    ...current,
    machineId: null,
  });
  await saveLicense(updated);
  return updated;
}

export async function updateLicenseInfo(
  key: string,
  field: 'contactName' | 'company' | 'email',
  value: string | null,
): Promise<LicenseRecord | null> {
  const current = await getLicense(key);
  if (!current) return null;

  const normalizedValue = typeof value === 'string' ? value.trim() : null;
  const nextValue = normalizedValue && normalizedValue.length > 0 ? normalizedValue : null;
  const updated = { ...current };

  if (field === 'email') {
    const oldEmail = current.email;
    const newEmail = nextValue ? nextValue.toLowerCase() : null;
    if (oldEmail && oldEmail !== newEmail) {
      await kv.del(emailIndex(oldEmail));
    }
    updated.email = newEmail;
  } else if (field === 'contactName') {
    updated.contactName = nextValue;
  } else {
    updated.company = nextValue;
  }

  const normalized = normalizeLicenseRecord(updated);
  await saveLicense(normalized);
  return normalized;
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
