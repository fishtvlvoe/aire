import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { validateLicenseSerialKey } from '@/lib/license/serial-key';

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'agent';
  is_active: number;
}

export interface LoginValidationInput {
  email: string;
  password: string;
  licenseKey?: string;
  requireLicense: boolean;
  requireAdmin: boolean;
}

export type LoginValidationResult =
  | { ok: true; user: UserRow }
  | { ok: false; status: number; error: string };

function findUserByIdentity(identity: string): UserRow | undefined {
  return db
    .prepare(
      `SELECT id, username, email, password_hash, role, is_active
       FROM users
       WHERE (email = ? OR username = ?) AND COALESCE(is_active, 1) = 1
       LIMIT 1`
    )
    .get(identity, identity) as UserRow | undefined;
}

export async function validateLoginInput(input: LoginValidationInput): Promise<LoginValidationResult> {
  const email = input.email?.trim();

  if (!email || !input.password) {
    return { ok: false, status: 400, error: '請輸入帳號與密碼' };
  }

  if (input.requireLicense) {
    if (!input.licenseKey) {
      return { ok: false, status: 400, error: '請輸入授權序號' };
    }

    const license = validateLicenseSerialKey(input.licenseKey);
    if (!license.ok) {
      if (license.error === 'expired') {
        return { ok: false, status: 403, error: '授權序號已過期' };
      }

      if (license.error === 'invalid_signature') {
        return { ok: false, status: 400, error: '授權序號無效' };
      }

      return { ok: false, status: 400, error: '授權序號格式錯誤' };
    }
  }

  const user = findUserByIdentity(email);
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return { ok: false, status: 401, error: '帳號或密碼錯誤' };
  }

  if (!user.is_active) {
    return { ok: false, status: 403, error: '帳號已停用' };
  }

  if (input.requireAdmin && user.role !== 'admin') {
    return { ok: false, status: 403, error: '無管理員權限' };
  }

  return { ok: true, user };
}
