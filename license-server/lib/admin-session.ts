import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'admin_session';

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

type VerifySessionResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: string };

function encodeBase64Url(value: string | Buffer): string {
  const base64 = (typeof value === 'string' ? Buffer.from(value) : value).toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padding), 'base64').toString('utf8');
}

function signPayload(payloadSegment: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(payloadSegment).digest();
  return encodeBase64Url(signature);
}

export function createSessionToken(
  secret: string,
  ttlSeconds = 14_400,
  now = Math.floor(Date.now() / 1_000),
): string {
  const payload: SessionPayload = {
    sub: 'admin',
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadSegment = encodeBase64Url(JSON.stringify(payload));
  const signatureSegment = signPayload(payloadSegment, secret);
  return `${payloadSegment}.${signatureSegment}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1_000),
): VerifySessionResult {
  if (!token) {
    return { valid: false, reason: 'empty' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed' };
  }

  const [payloadSegment, signatureSegment] = parts;

  let parsedPayload: SessionPayload;
  try {
    const payloadText = decodeBase64Url(payloadSegment);
    const payload = JSON.parse(payloadText) as Partial<SessionPayload>;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return { valid: false, reason: 'invalid_payload' };
    }
    parsedPayload = payload as SessionPayload;
  } catch {
    return { valid: false, reason: 'invalid_payload' };
  }

  if (parsedPayload.iat > now + 60) {
    return { valid: false, reason: 'clock_skew' };
  }

  if (signatureSegment.length !== 43) {
    return { valid: false, reason: 'invalid_signature_length' };
  }

  const expectedSignature = signPayload(payloadSegment, secret);
  const providedSignatureBuffer = Buffer.from(signatureSegment, 'utf8');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
  const isValidSignature = timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);
  if (!isValidSignature) {
    return { valid: false, reason: 'invalid_signature' };
  }

  if (parsedPayload.exp < now) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    payload: parsedPayload,
  };
}

export async function verifyAdminPassword(
  password: string,
  hash: string | undefined,
): Promise<boolean> {
  // 無論 hash 是否存在都執行 compare，避免因早退產生可觀測的 timing 差異。
  const dummyHash = '$2b$12$Spkg7gpLPeuebd7PMaWKGujYo/jC2EZjfdp7lqBWLowK1keMGqzA.';
  return bcrypt.compare(password, hash || dummyHash);
}

export function buildClearCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function buildSetCookieHeader(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
