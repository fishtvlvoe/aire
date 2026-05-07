import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { hasValidAdminToken } from '../../lib/admin-auth';
import { getLicense, saveLicense } from '../../lib/store';

interface UpdateInfoBody {
  key?: string;
  contactName?: string;
  company?: string;
  email?: string;
}

function emailIndex(email: string): string {
  return `email-index:${email.toLowerCase()}`;
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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 管理員權限驗證（不可讓一般用戶更新授權資料）
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: '未授權' });
  }

  const body = (req.body ?? {}) as UpdateInfoBody;
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key) {
    return res.status(400).json({ error: 'key is required' });
  }

  const existing = await getLicense(key);
  if (!existing) {
    return res.status(404).json({ error: '序號不存在' });
  }

  const next = { ...existing };

  if (body.contactName !== undefined) {
    next.contactName = normalizeOptionalText(body.contactName);
  }

  if (body.company !== undefined) {
    next.company = normalizeOptionalText(body.company);
  }

  if (body.email !== undefined) {
    const oldEmail = existing.email;
    const newEmail = normalizeOptionalEmail(body.email);

    if (oldEmail && oldEmail.toLowerCase() !== (newEmail ?? '')) {
      // email 更新時要先刪掉舊 index，避免舊 email 查詢到錯誤的序號
      await kv.del(emailIndex(oldEmail));
    }

    next.email = newEmail;
  }

  await saveLicense(next);
  const updated = await getLicense(key);

  return res.status(200).json({
    success: true,
    license: updated ?? next,
  });
}
