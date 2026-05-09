import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

import { middleware } from './middleware';

describe('middleware', () => {
  beforeEach(() => {
    getTokenMock.mockReset();
  });

  it('allows /admin/login without token', async () => {
    getTokenMock.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/admin/login');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('allows /forgot-password without token', async () => {
    getTokenMock.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/forgot-password');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('redirects /listings to /login when token is missing', async () => {
    getTokenMock.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/listings');

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login');
  });

  it('passes through when auth token is present', async () => {
    getTokenMock.mockResolvedValue({ sub: '1' });
    const request = new NextRequest('http://localhost/listings');

    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
