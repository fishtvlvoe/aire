import { createPublicKey, verify } from 'node:crypto';

export interface LicensePayload {
  company: string;
  expires: string;
  version: 1;
}

export type LicenseValidationResult =
  | { ok: true; payload: LicensePayload }
  | { ok: false; error: 'format_error' | 'invalid_signature' | 'expired' };

interface ValidateOptions {
  now?: Date;
  publicKey?: string;
}

function parsePublicKey(publicKeyValue: string) {
  const value = publicKeyValue.trim();
  if (!value) return null;

  try {
    if (value.includes('BEGIN PUBLIC KEY')) {
      return createPublicKey(value);
    }

    const der = Buffer.from(value, 'base64');
    return createPublicKey({ key: der, format: 'der', type: 'spki' });
  } catch {
    return null;
  }
}

function parsePayload(rawPayload: string): LicensePayload | null {
  try {
    const payloadJson = Buffer.from(rawPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as Partial<LicensePayload>;

    if (payload.version !== 1) return null;
    if (typeof payload.company !== 'string' || payload.company.trim() === '') return null;
    if (typeof payload.expires !== 'string' || payload.expires.trim() === '') return null;

    const expiresAt = new Date(payload.expires);
    if (Number.isNaN(expiresAt.getTime())) return null;

    return {
      company: payload.company,
      expires: payload.expires,
      version: 1,
    };
  } catch {
    return null;
  }
}

export function validateLicenseSerialKey(
  licenseKey: string,
  options: ValidateOptions = {}
): LicenseValidationResult {
  const [payloadSegment, signatureSegment, ...rest] = licenseKey.split('.');
  if (!payloadSegment || !signatureSegment || rest.length > 0) {
    return { ok: false, error: 'format_error' };
  }

  const payload = parsePayload(payloadSegment);
  if (!payload) {
    return { ok: false, error: 'format_error' };
  }

  const publicKeyValue = options.publicKey ?? process.env.LICENSE_PUBLIC_KEY;
  if (!publicKeyValue) {
    return { ok: false, error: 'invalid_signature' };
  }

  const publicKey = parsePublicKey(publicKeyValue);
  if (!publicKey) {
    return { ok: false, error: 'invalid_signature' };
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(signatureSegment, 'base64url');
  } catch {
    return { ok: false, error: 'format_error' };
  }

  const isValid = verify(
    null,
    Buffer.from(payloadSegment, 'utf8'),
    publicKey,
    signature,
  );

  if (!isValid) {
    return { ok: false, error: 'invalid_signature' };
  }

  const now = options.now ?? new Date();
  const expiresAt = new Date(payload.expires);
  if (expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: 'expired' };
  }

  return { ok: true, payload };
}
