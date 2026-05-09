import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import {
  createRefreshToken,
  generateRefreshToken,
} from '@/lib/auth/db';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { validateLoginInput } from '@/lib/auth/credentials-login';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export async function authorizeCredentials(
  credentials:
    | { username?: string; password?: string; licenseKey?: string; mode?: string }
    | undefined
): Promise<{ id: string; name: string } | null> {
  if (!credentials?.username || !credentials.password) {
    return null;
  }

  const mode = credentials.mode === 'admin' ? 'admin' : 'customer';
  const validated = await validateLoginInput({
    email: credentials.username,
    password: credentials.password,
    licenseKey: credentials.licenseKey,
    requireLicense: mode === 'customer',
    requireAdmin: mode === 'admin',
  });
  if (!validated.ok) {
    return null;
  }

  const user = validated.user;
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
  createRefreshToken(user.id, refreshToken, expiresAt);

  const sessionId = createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });

  return { id: String(user.id), name: user.username };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        licenseKey: { label: 'License Key', type: 'password' },
        mode: { label: 'Mode', type: 'text' },
      },
      authorize: authorizeCredentials,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
