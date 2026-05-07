import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { hasValidAdminTokenFromHeaders } from '../../../../lib/admin-auth';
import { generateSerialKey } from '../../../../lib/serial';
import { getLicense, revokeLicense, saveLicense, type LicenseRecord } from '../../../../lib/store';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  // 管理員權限驗證（避免任意轉移序號）
  if (!hasValidAdminTokenFromHeaders(req.headers.get('authorization'))) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const body = (await req.json()) as TransferBody;
  const oldKey = typeof body.oldKey === 'string' ? body.oldKey.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!oldKey) {
    return NextResponse.json({ error: 'oldKey is required' }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const oldLicense = await getLicense(oldKey);
  if (!oldLicense) {
    return NextResponse.json({ error: '舊序號不存在' }, { status: 404 });
  }

  if (!oldLicense.active || oldLicense.status === 'revoked') {
    return NextResponse.json({ error: '舊序號已停用' }, { status: 400 });
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
    return NextResponse.json({ error: 'transfer_failed' }, { status: 500 });
  }

  const saved = await getLicense(newKey);

  return NextResponse.json({
    success: true,
    revokedKey: oldKey,
    newKey,
    newLicense: saved ?? newLicense,
  }, { status: 200 });
}
