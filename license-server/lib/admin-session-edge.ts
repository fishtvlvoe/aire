type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

type VerifySessionResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: string };

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  const base64 = normalized + '='.repeat(padding);
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

async function verifyHmac(payloadSegment: string, signatureSegment: string, secret: string): Promise<boolean> {
  // Web Crypto API 的 BufferSource 型別在 TS strict + Node 18 lib.dom.d.ts 下會跟 Uint8Array 衝突（SharedArrayBuffer 不相容），用 unknown cast 跳過
  const subtle = globalThis.crypto.subtle as unknown as {
    importKey: (...args: unknown[]) => Promise<unknown>;
    verify: (...args: unknown[]) => Promise<boolean>;
  };
  const key = await subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signatureBytes = base64UrlToBytes(signatureSegment);
  return subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(payloadSegment));
}

export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1_000),
): Promise<VerifySessionResult> {
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
    const payloadBytes = base64UrlToBytes(payloadSegment);
    const payloadText = new TextDecoder().decode(payloadBytes);
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

  try {
    const isValidSignature = await verifyHmac(payloadSegment, signatureSegment, secret);
    if (!isValidSignature) {
      return { valid: false, reason: 'invalid_signature' };
    }
  } catch {
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
