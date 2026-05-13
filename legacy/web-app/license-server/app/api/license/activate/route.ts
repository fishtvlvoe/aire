import { NextRequest, NextResponse } from 'next/server';
import { getLicense, saveLicense } from '../../../../lib/store';
import { hashMachineId } from '../../../../lib/machine-id';

export const runtime = 'nodejs';

/** 預設功能（基本版）— 管理員可事後調整 */
const DEFAULT_FEATURES = ['disclosure-document'];

function normalizeMachineIdHash(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return hashMachineId(trimmed);
}

export async function POST(req: NextRequest) {
  const { email, licenseKey, allowedCidr, machineId } = await req.json() as {
    email?: string;
    licenseKey?: string;
    allowedCidr?: string;
    machineId?: string;
  };

  if (!email || !licenseKey) {
    return NextResponse.json({ error: 'email and licenseKey are required' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const machineIdHash = normalizeMachineIdHash(machineId);

  const existing = await getLicense(licenseKey);

  if (!existing) {
    return NextResponse.json({ valid: false, reason: 'license_not_found' }, { status: 404 });
  }

  if (!existing.active || existing.status === 'revoked') {
    return NextResponse.json({ valid: false, reason: 'license_inactive' }, { status: 403 });
  }

  // 已啟用：同機器 + 同 email → 200（冪等）；不同 email → 409；不同機器 → 403
  if (existing.status === 'activated') {
    if (existing.email !== emailLower) {
      return NextResponse.json({ error: 'License already activated for a different email' }, { status: 409 });
    }

    const storedMachineId = existing.machineId ?? null;

    if (storedMachineId) {
      // 已綁定：必須提供 machineId 且一致
      if (!machineIdHash || machineIdHash !== storedMachineId) {
        return NextResponse.json({ error: '此序號已綁定其他電腦' }, { status: 403 });
      }

      return NextResponse.json({ ok: true, features: existing.features }, { status: 200 });
    }

    // 未綁定（可能是解綁後重新啟用）：允許寫入新的 machineId
    if (machineIdHash) {
      const next = { ...existing, machineId: machineIdHash };
      await saveLicense(next);
      return NextResponse.json({ ok: true, features: next.features }, { status: 200 });
    }

    return NextResponse.json({ ok: true, features: existing.features }, { status: 200 });
  }

  if (existing.status !== 'issued') {
    return NextResponse.json({ error: 'License status is not activatable' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const record = {
    ...existing,
    email: emailLower,
    allowedCidr: allowedCidr ?? existing.allowedCidr ?? '0.0.0.0/0',
    features: existing.features?.length ? existing.features : DEFAULT_FEATURES,
    activatedAt: now,
    status: 'activated' as const,
    active: true,
    machineId: machineIdHash,
  };

  await saveLicense(record);
  return NextResponse.json({ ok: true, features: record.features }, { status: 200 });
}
