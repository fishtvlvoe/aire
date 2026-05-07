import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLicense, saveLicense } from '../../lib/store';
import { hashMachineId } from '../../lib/machine-id';

/** 預設功能（基本版）— 管理員可事後調整 */
const DEFAULT_FEATURES = ['disclosure-document'];

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

  const { email, licenseKey, allowedCidr, machineId } = req.body as {
    email?: string;
    licenseKey?: string;
    allowedCidr?: string;
    machineId?: string;
  };

  if (!email || !licenseKey) {
    return res.status(400).json({ error: 'email and licenseKey are required' });
  }

  const emailLower = email.toLowerCase();
  const machineIdHash = normalizeMachineIdHash(machineId);

  const existing = await getLicense(licenseKey);

  if (!existing) {
    return res.status(404).json({ valid: false, reason: 'license_not_found' });
  }

  if (!existing.active || existing.status === 'revoked') {
    return res.status(403).json({ valid: false, reason: 'license_inactive' });
  }

  // 已啟用：同機器 + 同 email → 200（冪等）；不同 email → 409；不同機器 → 403
  if (existing.status === 'activated') {
    if (existing.email !== emailLower) {
      return res.status(409).json({ error: 'License already activated for a different email' });
    }

    const storedMachineId = existing.machineId ?? null;

    if (storedMachineId) {
      // 已綁定：必須提供 machineId 且一致
      if (!machineIdHash || machineIdHash !== storedMachineId) {
        return res.status(403).json({ error: '此序號已綁定其他電腦' });
      }

      return res.status(200).json({ ok: true, features: existing.features });
    }

    // 未綁定（可能是解綁後重新啟用）：允許寫入新的 machineId
    if (machineIdHash) {
      const next = { ...existing, machineId: machineIdHash };
      await saveLicense(next);
      return res.status(200).json({ ok: true, features: next.features });
    }

    return res.status(200).json({ ok: true, features: existing.features });
  }

  if (existing.status !== 'issued') {
    return res.status(409).json({ error: 'License status is not activatable' });
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
  return res.status(200).json({ ok: true, features: record.features });
}
