import { cookies } from 'next/headers';
import { db } from './db';

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'agent';
  is_active: number;
}

export interface SessionUser extends User {}

const SESSION_COOKIE = 'session_id';
const SESSION_TTL_HOURS = 8;

export function createSession(userId: number): string {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
  return id;
}

export function deleteSession(sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function deleteUserSessions(userId: number): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function getSessionUser(sessionId: string): SessionUser | null {
  const row = db.prepare(`
    SELECT u.id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `).get(sessionId) as SessionUser | undefined;
  return row ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}

export function requireRole(user: SessionUser | null, role: 'admin'): asserts user is SessionUser {
  if (!user || user.role !== role) {
    throw new Error('forbidden');
  }
}

export { SESSION_COOKIE };
