import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync, sign } from 'node:crypto';
import { db } from '@/lib/db';
import { createUser } from '@/lib/auth/db';
import { authorizeCredentials, authOptions } from './route';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: vi.fn() })),
}));

describe('next-auth route', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  function createLicenseKey(expires: string): string {
    const payloadBase64 = Buffer.from(
      JSON.stringify({ company: 'AIRE', expires, version: 1 }),
      'utf8'
    ).toString('base64url');
    const signature = sign(null, Buffer.from(payloadBase64, 'utf8'), privateKeyPem);
    return `${payloadBase64}.${Buffer.from(signature).toString('base64url')}`;
  }

  beforeEach(() => {
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM users').run();
    process.env.LICENSE_PUBLIC_KEY = publicKeyPem;
  });

  it('configures jwt session with 15 minute ttl', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.session?.maxAge).toBe(15 * 60);
  });

  it('returns null for wrong password login attempt', async () => {
    await createUser('admin', 'correct123');

    const result = await authorizeCredentials({
      username: 'admin',
      password: 'wrong456',
      licenseKey: createLicenseKey('2027-12-31T00:00:00+08:00'),
      mode: 'customer',
    });
    expect(result).toBeNull();
  });

  it('returns null when customer login is missing license key', async () => {
    await createUser('admin', 'correct123');

    const result = await authorizeCredentials({
      username: 'admin',
      password: 'correct123',
      licenseKey: '',
      mode: 'customer',
    });

    expect(result).toBeNull();
  });
});
