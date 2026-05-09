import bcrypt from 'bcryptjs';
import { db, writeAuditLog } from '@/lib/db';

const ADMIN_BCRYPT_COST = 10;
const ADMIN_ENV_MISSING_WARNING = 'ADMIN_EMAIL / ADMIN_PASSWORD 環境變數未設定，未建立管理員帳號';

function getUserColumns(): string[] {
  return (db.pragma('table_info(users)') as Array<{ name: string }>).map((column) => column.name);
}

export async function seedAdminFromEnv(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(ADMIN_ENV_MISSING_WARNING);
    return;
  }

  const passwordHash = await bcrypt.hash(password, ADMIN_BCRYPT_COST);
  const columns = getUserColumns();
  const hasUsername = columns.includes('username');
  const hasDisplayName = columns.includes('display_name');
  const hasIsActive = columns.includes('is_active');

  const existing = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(email) as { id: number } | undefined;

  if (!existing) {
    const insertColumns = ['email', 'password_hash', 'role'];
    const insertValues: Array<string | number> = [email, passwordHash, 'admin'];

    if (hasUsername) {
      insertColumns.push('username');
      insertValues.push(email);
    }
    if (hasDisplayName) {
      insertColumns.push('display_name');
      insertValues.push('總管理員');
    }
    if (hasIsActive) {
      insertColumns.push('is_active');
      insertValues.push(1);
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const inserted = db
      .prepare(`INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING id`)
      .get(...insertValues) as { id: number } | undefined;

    writeAuditLog({
      action: 'seed_admin_create',
      targetType: 'user',
      targetId: inserted?.id,
      detail: `Seed admin account: ${email}`,
    });
    return;
  }

  const updates = ['password_hash = ?', "role = 'admin'", "updated_at = datetime('now')"];
  const updateValues: Array<string | number> = [passwordHash];

  if (hasUsername) {
    updates.push('username = ?');
    updateValues.push(email);
  }
  if (hasIsActive) {
    updates.push('is_active = 1');
  }

  updateValues.push(existing.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...updateValues);

  writeAuditLog({
    action: 'seed_admin_update',
    targetType: 'user',
    targetId: existing.id,
    detail: `Seed admin password updated: ${email}`,
  });
}

export { ADMIN_BCRYPT_COST, ADMIN_ENV_MISSING_WARNING };
