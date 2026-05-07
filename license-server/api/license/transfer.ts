import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasValidAdminToken } from '../../lib/admin-auth';
import { generateSerialKey } from '../../lib/serial';
import { kv } from '@vercel/kv';
import { getLicense, revokeLicense, saveLicense, type LicenseRecord } from '../../lib/store';

interface TransferBody {
  oldKey?: string;
  reason?: string;
  newCompany?: string;
  newContactName?: string;
  newEmail?: string;
}

function normalizeOptionalText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalEmail(value: unknown): string | null {
  const text = normalizeOptionalText(value);
  return text ? text.toLowerCase() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 管理員權限驗證（避免任意轉移序號）
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: '未授權' });
  }

  const body = (req.body ?? {}) as TransferBody;
  const oldKey = typeof body.oldKey === 'string' ? body.oldKey.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!oldKey) {
    return res.status(400).json({ error: 'oldKey is required' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'reason is required' });
  }

  const oldLicense = await getLicense(oldKey);
  if (!oldLicense) {
    return res.status(404).json({ error: '舊序號不存在' });
  }

  if (!oldLicense.active || oldLicense.status === 'revoked') {
    return res.status(400).json({ error: '舊序號已停用' });
  }

  // 保留原始狀態，供後續失敗時 rollback
  const oldSnapshot: LicenseRecord = { ...oldLicense };

  await revokeLicense(oldKey, reason);

  if (oldLicense.email) {
    await kv.del(`email-index:${oldLicense.email}`);
  }

  const newKey = generateSerialKey();
  const now = new Date().toISOString();

  const newLicense: LicenseRecord = {
    licenseKey: newKey,
    email: normalizeOptionalEmail(body.newEmail),
    contactName: normalizeOptionalText(body.newContactName),
    company: normalizeOptionalText(body.newCompany),
    machineId: null,
    allowedCidr: oldLicense.allowedCidr,
    features: oldLicense.features,
    createdAt: now,
    activatedAt: null,
    expiresAt: oldLicense.expiresAt,
    active: true,
    status: 'issued',
    issuedBy: oldLicense.issuedBy,
    revokedAt: null,
    revokedReason: null,
  };

  try {
    await saveLicense(newLicense);
  } catch {
    // 建立新序號失敗：必須把舊序號狀態還原，避免客戶無法使用
    await saveLicense(oldSnapshot);
    return res.status(500).json({ error: 'transfer_failed' });
  }

  const saved = await getLicense(newKey);

  return res.status(200).json({
    success: true,
    revokedKey: oldKey,
    newKey,
    newLicense: saved ?? newLicense,
  });
}
