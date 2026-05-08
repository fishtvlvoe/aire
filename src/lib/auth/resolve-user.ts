import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { getUserByEmail, getUserById, getUserByUsername, type AuthUser } from '@/lib/auth/db';

export type ResolvedUser = AuthUser & {
  role: 'admin' | 'agent';
};

function hasRole(user: AuthUser | null): user is ResolvedUser {
  return user?.role === 'admin' || user?.role === 'agent';
}

export async function resolveCurrentUser(req: NextRequest): Promise<ResolvedUser | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;

  const userId = typeof token.sub === 'string' ? Number(token.sub) : NaN;
  const candidates = [
    Number.isInteger(userId) ? getUserById(userId) : null,
    typeof token.name === 'string' ? getUserByUsername(token.name) : null,
    typeof token.email === 'string' ? getUserByEmail(token.email) : null,
  ];

  return candidates.find(hasRole) ?? null;
}
