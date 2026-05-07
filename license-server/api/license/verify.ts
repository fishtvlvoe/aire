import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLicense, isIpInCidr } from '../../lib/store';
import { hashMachineId } from '../../lib/machine-id';

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? '0.0.0.0';
}

function normalizeMachineIdHash(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return hashMachineId(trimmed);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, licenseKey, machineId } = req.body as {
    email?: string;
    licenseKey?: string;
    machineId?: string;
  };

  if (!email || !licenseKey) {
    return res.status(400).json({ error: 'email and licenseKey are required' });
  }

  const record = await getLicense(licenseKey);

  if (!record) {
    return res.status(404).json({ valid: false, reason: 'license_not_found' });
  }

  if (record.status === 'issued') {
    return res.status(403).json({ valid: false, reason: 'license_not_activated' });
  }

  if (record.email !== email.toLowerCase()) {
    return res.status(403).json({ valid: false, reason: 'email_mismatch' });
  }

  if (!record.active) {
    return res.status(403).json({ valid: false, reason: 'license_inactive' });
  }

  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return res.status(403).json({ valid: false, reason: 'license_expired' });
  }

  const clientIp = getClientIp(req);
  if (!isIpInCidr(clientIp, record.allowedCidr)) {
    return res.status(403).json({ valid: false, reason: 'ip_not_allowed', clientIp });
  }

  // 綁定機器：驗證通過後再檢查，避免洩漏序號狀態
  const storedMachineId = record.machineId ?? null;
  if (storedMachineId) {
    const machineIdHash = normalizeMachineIdHash(machineId);
    if (!machineIdHash || machineIdHash !== storedMachineId) {
      return res.status(403).json({ valid: false, reason: 'machine_mismatch' });
    }
  }

  return res.status(200).json({
    valid: true,
    features: record.features,
    expiresAt: record.expiresAt,
  });
}
