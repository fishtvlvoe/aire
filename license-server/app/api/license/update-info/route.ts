import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { hasValidAdminTokenFromHeaders } from '../../../../lib/admin-auth';
import { getLicense, saveLicense } from '../../../../lib/store';

export const runtime = 'nodejs';

interface UpdateInfoBody {
  key?: string;
  contactName?: string;
  company?: string;
  email?: string;
  machineId?: string | null;
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

export async function PATCH(req: NextRequest) {
  // 管理員權限驗證（不可讓一般用戶更新授權資料）
  if (!hasValidAdminTokenFromHeaders(req.headers.get('authorization'))) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const body = (await req.json()) as UpdateInfoBody;
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }

  const existing = await getLicense(key);
  if (!existing) {
    return NextResponse.json({ error: '序號不存在' }, { status: 404 });
  }

  const next = { ...existing };

  if (body.contactName !== undefined) {
    next.contactName = normalizeOptionalText(body.contactName);
  }

  if (body.company !== undefined) {
    next.company = normalizeOptionalText(body.company);
  }

  if (body.machineId !== undefined) {
    next.machineId = body.machineId === null ? null : normalizeOptionalText(body.machineId);
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

  return NextResponse.json({
    success: true,
    license: updated ?? next,
  }, { status: 200 });
}
