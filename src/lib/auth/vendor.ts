import { db } from '@/lib/db';

export interface VendorCredentials {
  username: string;
  passwordHash: string;
  displayName: string;
}

/**
 * 佈建廠商帳號：若帳號已存在則更新密碼與顯示名稱，否則新建廠商用戶。
 * 廠商帳號的 email 格式固定為 {username}@vendor.three-ai.app，role 固定為 'admin'。
 */
export function provisionVendorAccount(credentials: VendorCredentials): void {
  const { username, passwordHash, displayName } = credentials;

  // 查詢是否已有對應的廠商帳號（is_vendor = 1 才算）
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? AND is_vendor = 1')
    .get(username) as { id: number } | undefined;

  if (existing) {
    // 帳號已存在：僅更新密碼雜湊與顯示名稱
    db.prepare(
      'UPDATE users SET password_hash = ?, display_name = ? WHERE id = ?'
    ).run(passwordHash, displayName, existing.id);
  } else {
    // 帳號不存在：新建廠商用戶，email 使用系統保留網域
    const email = `${username}@vendor.three-ai.app`;
    db.prepare(
      'INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, email, passwordHash, displayName, 'admin', 1);
  }
}
