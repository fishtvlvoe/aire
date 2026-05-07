import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  SESSION_COOKIE_NAME,
  buildClearCookieHeader,
  createSessionToken,
  verifyAdminPassword,
  verifySessionToken,
} from '../admin-session';

// 共用 fixture：固定時間戳避免測試受時鐘影響
const FIXED_NOW = 1_700_000_000;
const SECRET = 'test-secret';
const OTHER_SECRET = 'other-secret';

describe('admin-session module', () => {
  describe('SESSION_COOKIE_NAME', () => {
    it('exports the constant admin_session', () => {
      expect(SESSION_COOKIE_NAME).toBe('admin_session');
    });
  });

  // -----------------------------------------------------------------
  // Requirement: Password verification with bcrypt
  // -----------------------------------------------------------------
  describe('verifyAdminPassword', () => {
    // 每個密碼測試自己 hash，避免共用 fixture 帶來的 race
    it('returns true when password matches the bcrypt hash', async () => {
      const hash = bcrypt.hashSync('correct-password', 4);
      await expect(verifyAdminPassword('correct-password', hash)).resolves.toBe(true);
    });

    it('returns false when password does not match the hash', async () => {
      const hash = bcrypt.hashSync('correct-password', 4);
      await expect(verifyAdminPassword('wrong-password', hash)).resolves.toBe(false);
    });

    it('returns false (not throw) when hash is undefined', async () => {
      await expect(verifyAdminPassword('any-password', undefined)).resolves.toBe(false);
    });

    it('returns false (not throw) when hash is empty string', async () => {
      await expect(verifyAdminPassword('any-password', '')).resolves.toBe(false);
    });
  });

  // -----------------------------------------------------------------
  // Requirement: Session token format
  // -----------------------------------------------------------------
  describe('createSessionToken', () => {
    it('produces deterministic signature given same secret and payload', () => {
      // 注入相同 now → iat 相同 → 兩次 sign 結果應完全一致
      const token1 = createSessionToken(SECRET, 43200, FIXED_NOW);
      const token2 = createSessionToken(SECRET, 43200, FIXED_NOW);
      expect(token1).toBe(token2);

      const sig1 = token1.split('.')[1];
      const sig2 = token2.split('.')[1];
      expect(sig1).toBe(sig2);
    });

    it('produces different signatures when secret changes', () => {
      const tokenA = createSessionToken(SECRET, 43200, FIXED_NOW);
      const tokenB = createSessionToken(OTHER_SECRET, 43200, FIXED_NOW);

      const sigA = tokenA.split('.')[1];
      const sigB = tokenB.split('.')[1];
      expect(sigA).not.toBe(sigB);
    });

    it('returns token shaped as <base64url payload>.<base64url signature>', () => {
      const token = createSessionToken(SECRET, 43200, FIXED_NOW);
      const parts = token.split('.');
      expect(parts).toHaveLength(2);

      // base64url 字元集（無 padding）：A-Z a-z 0-9 _ -
      const base64UrlNoPadding = /^[A-Za-z0-9_-]+$/;
      expect(parts[0]).toMatch(base64UrlNoPadding);
      expect(parts[1]).toMatch(base64UrlNoPadding);

      // 簽章為 HMAC-SHA256 = 32 bytes → base64url 無 padding 為 43 字元
      expect(parts[1]).toHaveLength(43);
    });
  });

  // -----------------------------------------------------------------
  // Requirement: Boundary handling + valid path
  // -----------------------------------------------------------------
  describe('verifySessionToken', () => {
    it('returns valid=false reason=empty when token is empty string', () => {
      const result = verifySessionToken('', SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('empty');
    });

    it('returns valid=false reason=empty when token is undefined', () => {
      const result = verifySessionToken(undefined, SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('empty');
    });

    it('returns valid=false reason=malformed when token has no dot separator', () => {
      const result = verifySessionToken('garbage-no-dot', SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('malformed');
    });

    it('returns valid=false when payload is not valid JSON', () => {
      // payload 段是合法 base64url，但解碼後不是 JSON
      const fakePayload = Buffer.from('not-json-content').toString('base64url');
      // 簽章湊滿 43 字元，內容不重要因為應在 JSON parse 階段就失敗
      const fakeSig = 'a'.repeat(43);
      const token = `${fakePayload}.${fakeSig}`;
      const result = verifySessionToken(token, SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false when payload is missing exp field', () => {
      // 自製缺 exp 的 payload
      const payloadJson = JSON.stringify({ sub: 'admin', iat: FIXED_NOW });
      const payloadB64 = Buffer.from(payloadJson).toString('base64url');
      const fakeSig = 'a'.repeat(43);
      const token = `${payloadB64}.${fakeSig}`;
      const result = verifySessionToken(token, SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false reason=clock_skew when iat is greater than now + 60s', () => {
      // 用合法 createSessionToken 產生 token，但驗證時把 now 退到 iat 前 120 秒
      const token = createSessionToken(SECRET, 43200, FIXED_NOW);
      const earlierNow = FIXED_NOW - 120; // iat - 120s = now → iat > now + 60s
      const result = verifySessionToken(token, SECRET, earlierNow);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('clock_skew');
    });

    it('returns valid=false when signature length is not 43 chars', () => {
      const payloadJson = JSON.stringify({
        sub: 'admin',
        iat: FIXED_NOW,
        exp: FIXED_NOW + 43200,
      });
      const payloadB64 = Buffer.from(payloadJson).toString('base64url');
      const shortSig = 'a'.repeat(20); // 長度 20 ≠ 43
      const token = `${payloadB64}.${shortSig}`;
      const result = verifySessionToken(token, SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false reason=invalid_signature when signed by different secret', () => {
      // 用 OTHER_SECRET 簽，但用 SECRET 驗 → 簽章對不上
      const token = createSessionToken(OTHER_SECRET, 43200, FIXED_NOW);
      const result = verifySessionToken(token, SECRET, FIXED_NOW);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_signature');
    });

    it('returns valid=false reason=expired when exp is less than now', () => {
      // 簽完之後讓 now 跳到 exp 之後（ttl=60s，now 推進 120s）
      const token = createSessionToken(SECRET, 60, FIXED_NOW);
      const laterNow = FIXED_NOW + 120;
      const result = verifySessionToken(token, SECRET, laterNow);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('returns valid=true with payload when token is fully valid', () => {
      const token = createSessionToken(SECRET, 43200, FIXED_NOW);
      const result = verifySessionToken(token, SECRET, FIXED_NOW + 10);
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe('admin');
      expect(result.payload?.iat).toBe(FIXED_NOW);
      expect(result.payload?.exp).toBe(FIXED_NOW + 43200);
    });
  });

  // -----------------------------------------------------------------
  // Requirement: Logout clears the session cookie
  // -----------------------------------------------------------------
  describe('buildClearCookieHeader', () => {
    it('returns Set-Cookie string that clears admin_session with Max-Age=0', () => {
      const header = buildClearCookieHeader();
      expect(header).toContain('admin_session=');
      expect(header).toContain('Max-Age=0');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
    });
  });
});
