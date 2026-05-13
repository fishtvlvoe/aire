import { createHmac, timingSafeEqual } from 'node:crypto';

interface TokenPayload {
  email: string;
  purpose: 'password-reset';
  iat: number;
  exp: number;
}

interface CreateTokenOptions {
  now?: Date;
  expiresInSeconds?: number;
}

interface VerifyTokenOptions {
  now?: Date;
}

export type VerifyResetTokenResult =
  | { ok: true; email: string }
  | { ok: false; error: 'expired' | 'invalid' };

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function sign(secret: string, input: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function createPasswordResetToken(
  email: string,
  secret: string,
  options: CreateTokenOptions = {}
): string {
  const nowMs = (options.now ?? new Date()).getTime();
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + (options.expiresInSeconds ?? 15 * 60);

  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadObject: TokenPayload = {
    email,
    purpose: 'password-reset',
    iat,
    exp,
  };
  const payload = encodeBase64Url(JSON.stringify(payloadObject));
  const signature = sign(secret, `${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyPasswordResetToken(
  token: string,
  secret: string,
  options: VerifyTokenOptions = {}
): VerifyResetTokenResult {
  const [headerSegment, payloadSegment, signatureSegment, ...rest] = token.split('.');
  if (!headerSegment || !payloadSegment || !signatureSegment || rest.length > 0) {
    return { ok: false, error: 'invalid' };
  }

  const expectedSignature = sign(secret, `${headerSegment}.${payloadSegment}`);
  const actualBuffer = Buffer.from(signatureSegment, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { ok: false, error: 'invalid' };
  }

  const payloadJson = decodeBase64Url(payloadSegment);
  if (!payloadJson) {
    return { ok: false, error: 'invalid' };
  }

  try {
    const payload = JSON.parse(payloadJson) as Partial<TokenPayload>;
    if (payload.purpose !== 'password-reset' || typeof payload.email !== 'string') {
      return { ok: false, error: 'invalid' };
    }

    if (typeof payload.exp !== 'number') {
      return { ok: false, error: 'invalid' };
    }

    const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
    if (payload.exp <= nowSeconds) {
      return { ok: false, error: 'expired' };
    }

    return { ok: true, email: payload.email };
  } catch {
    return { ok: false, error: 'invalid' };
  }
}
