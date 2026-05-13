import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { db } from './db';

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export async function getAdminUser(req: NextRequest): Promise<AdminUser | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return null;

  const user = db.prepare(
    'SELECT id, username, role FROM users WHERE username = ? AND is_active = 1'
  ).get(token.name) as AdminUser | undefined;

  return user?.role === 'admin' ? user : null;
}
