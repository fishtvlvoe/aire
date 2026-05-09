import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { seedAdminFromEnv } from '@/lib/seed-admin';

function getAdminByEmail(email: string) {
  return db
    .prepare('SELECT email, password_hash, role FROM users WHERE email = ? LIMIT 1')
    .get(email) as { email: string; password_hash: string; role: string } | undefined;
}

describe('seedAdminFromEnv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    db.prepare('DELETE FROM users').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  it('creates admin when user does not exist', async () => {
    process.env.ADMIN_EMAIL = 'admin@aire.com';
    process.env.ADMIN_PASSWORD = 'MySecret123';

    await seedAdminFromEnv();

    const admin = getAdminByEmail('admin@aire.com');
    expect(admin?.role).toBe('admin');
    expect(admin?.password_hash).toBeTruthy();
    expect(await bcrypt.compare('MySecret123', admin!.password_hash)).toBe(true);
  });

  it('updates existing admin password hash on restart', async () => {
    process.env.ADMIN_EMAIL = 'admin@aire.com';
    process.env.ADMIN_PASSWORD = 'OldPassword123';
    await seedAdminFromEnv();

    const first = getAdminByEmail('admin@aire.com');
    process.env.ADMIN_PASSWORD = 'NewPassword456';

    await seedAdminFromEnv();

    const second = getAdminByEmail('admin@aire.com');
    expect(second?.role).toBe('admin');
    expect(second?.password_hash).not.toBe(first?.password_hash);
    expect(await bcrypt.compare('NewPassword456', second!.password_hash)).toBe(true);
  });

  it('warns and skips when admin env vars are missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await seedAdminFromEnv();

    const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    expect(count.count).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith('ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號');
  });
});
