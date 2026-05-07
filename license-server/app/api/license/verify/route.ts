import { NextRequest, NextResponse } from 'next/server';
import { getLicense, isIpInCidr } from '../../../../lib/store';
import { hashMachineId } from '../../../../lib/machine-id';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return '0.0.0.0';
}

function normalizeMachineIdHash(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return hashMachineId(trimmed);
}

export async function POST(req: NextRequest) {
  const { email, licenseKey, machineId } = await req.json() as {
    email?: string;
    licenseKey?: string;
    machineId?: string;
  };

  if (!email || !licenseKey) {
    return NextResponse.json({ error: 'email and licenseKey are required' }, { status: 400 });
  }

  const record = await getLicense(licenseKey);

  if (!record) {
    return NextResponse.json({ valid: false, reason: 'license_not_found' }, { status: 404 });
  }

  if (record.status === 'issued') {
    return NextResponse.json({ valid: false, reason: 'license_not_activated' }, { status: 403 });
  }

  if (record.email !== email.toLowerCase()) {
    return NextResponse.json({ valid: false, reason: 'email_mismatch' }, { status: 403 });
  }

  if (!record.active) {
    return NextResponse.json({ valid: false, reason: 'license_inactive' }, { status: 403 });
  }

  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'license_expired' }, { status: 403 });
  }

  const clientIp = getClientIp(req);
  if (!isIpInCidr(clientIp, record.allowedCidr)) {
    return NextResponse.json({ valid: false, reason: 'ip_not_allowed', clientIp }, { status: 403 });
  }

  // 綁定機器：驗證通過後再檢查，避免洩漏序號狀態
  const storedMachineId = record.machineId ?? null;
  if (storedMachineId) {
    const machineIdHash = normalizeMachineIdHash(machineId);
    if (!machineIdHash || machineIdHash !== storedMachineId) {
      return NextResponse.json({ valid: false, reason: 'machine_mismatch' }, { status: 403 });
    }
  }

  return NextResponse.json({
    valid: true,
    features: record.features,
    expiresAt: record.expiresAt,
  }, { status: 200 });
}
