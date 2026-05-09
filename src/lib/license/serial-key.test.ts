import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateLicenseSerialKey } from './serial-key';

function createSerialKey(payload: Record<string, unknown>, privateKeyPem: string): string {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
  const signature = sign(null, Buffer.from(payloadBase64, 'utf8'), privateKeyPem);
  const signatureBase64 = Buffer.from(signature).toString('base64url');
  return `${payloadBase64}.${signatureBase64}`;
}

describe('validateLicenseSerialKey', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  it('returns ok for valid signature and non-expired key', () => {
    const licenseKey = createSerialKey(
      { company: 'AIRE', expires: '2027-12-31T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );

    const result = validateLicenseSerialKey(licenseKey, {
      now: new Date('2026-05-09T00:00:00+08:00'),
      publicKey: publicKeyPem,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.company).toBe('AIRE');
      expect(result.payload.version).toBe(1);
    }
  });

  it('returns expired when expires date has passed', () => {
    const licenseKey = createSerialKey(
      { company: 'AIRE', expires: '2024-01-01T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );

    const result = validateLicenseSerialKey(licenseKey, {
      now: new Date('2026-05-09T00:00:00+08:00'),
      publicKey: publicKeyPem,
    });

    expect(result).toEqual({ ok: false, error: 'expired' });
  });

  it('returns invalid_signature for tampered key', () => {
    const licenseKey = createSerialKey(
      { company: 'AIRE', expires: '2027-12-31T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );
    const [payload, signature] = licenseKey.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ company: 'HACKED', expires: '2027-12-31T00:00:00+08:00', version: 1 }), 'utf8').toString('base64url');

    const result = validateLicenseSerialKey(`${tamperedPayload}.${signature}`, {
      now: new Date('2026-05-09T00:00:00+08:00'),
      publicKey: publicKeyPem,
    });

    expect(payload).not.toBe(tamperedPayload);
    expect(result).toEqual({ ok: false, error: 'invalid_signature' });
  });

  it('returns format_error for malformed key', () => {
    const result = validateLicenseSerialKey('not-a-valid-key', {
      now: new Date('2026-05-09T00:00:00+08:00'),
      publicKey: publicKeyPem,
    });

    expect(result).toEqual({ ok: false, error: 'format_error' });
  });
});
