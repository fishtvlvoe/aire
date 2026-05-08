import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
const { getCachedLicenseMock, getTokenMock } = vi.hoisted(() => ({
  getCachedLicenseMock: vi.fn(),
  getTokenMock: vi.fn(),
}));

vi.mock('@/lib/license/server-verify', () => ({
  getCachedLicense: getCachedLicenseMock,
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

import { middleware } from './middleware';

describe('middleware', () => {
  beforeEach(() => {
    getCachedLicenseMock.mockReset();
    getTokenMock.mockReset();
    db.prepare('DELETE FROM users').run();
  });

  function insertExistingUser() {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, role, is_active)
      VALUES ('admin', 'admin@example.com', 'hash', 'Admin', 'admin', 1)
    `).run();
  }

  it('redirects to /setup when license is missing', async () => {
    getCachedLicenseMock.mockReturnValue(null);
    const request = new NextRequest('http://localhost/listings');

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/setup');
  });

  it('redirects to /login when license is valid but auth token is missing', async () => {
    insertExistingUser();
    getCachedLicenseMock.mockReturnValue({ valid: true });
    getTokenMock.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/listings');

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login');
  });

  it('passes through when both license and auth are valid', async () => {
    insertExistingUser();
    getCachedLicenseMock.mockReturnValue({ valid: true });
    getTokenMock.mockResolvedValue({ sub: '1' });
    const request = new NextRequest('http://localhost/listings');

    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
