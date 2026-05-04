import { db } from './db';

export function writeAuditLog(
  userId: number | null,
  action: string,
  targetType: string,
  targetId: number | null,
  detail?: string
): void {
  db.prepare(
    'INSERT INTO audit_logs (user_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, action, targetType, targetId, detail ?? null);
}
