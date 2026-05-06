import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { createUser } from '@/lib/auth/db';
import { authorizeCredentials, authOptions } from './route';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: vi.fn() })),
}));

describe('next-auth route', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM users').run();
  });

  it('configures jwt session with 15 minute ttl', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.session?.maxAge).toBe(15 * 60);
  });

  it('returns null for wrong password login attempt', async () => {
    await createUser('admin', 'correct123');

    const result = await authorizeCredentials({ username: 'admin', password: 'wrong456' });
    expect(result).toBeNull();
  });
});
