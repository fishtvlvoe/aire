import { describe, expect, it } from 'vitest';
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from './password-reset-token';

describe('password-reset-token helper', () => {
  it('creates and verifies token with purpose=password-reset', () => {
    const token = createPasswordResetToken('agent@realty.com', 'secret', {
      now: new Date('2026-05-09T00:00:00.000Z'),
      expiresInSeconds: 900,
    });

    const result = verifyPasswordResetToken(token, 'secret', {
      now: new Date('2026-05-09T00:10:00.000Z'),
    });

    expect(result).toEqual({ ok: true, email: 'agent@realty.com' });
  });

  it('returns expired for expired token', () => {
    const token = createPasswordResetToken('agent@realty.com', 'secret', {
      now: new Date('2026-05-09T00:00:00.000Z'),
      expiresInSeconds: 1,
    });

    const result = verifyPasswordResetToken(token, 'secret', {
      now: new Date('2026-05-09T00:00:03.000Z'),
    });

    expect(result).toEqual({ ok: false, error: 'expired' });
  });

  it('returns invalid for tampered token', () => {
    const token = createPasswordResetToken('agent@realty.com', 'secret');
    const [header, payload, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ email: 'hacker@evil.com', purpose: 'password-reset', iat: 1, exp: 9999999999 }),
      'utf8'
    ).toString('base64url');

    const result = verifyPasswordResetToken(`${header}.${tamperedPayload}.${signature}`, 'secret');

    expect(result).toEqual({ ok: false, error: 'invalid' });
  });
});
