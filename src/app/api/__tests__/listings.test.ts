import { beforeEach, describe, it, expect, vi } from 'vitest';
import { POST } from '../listings/route';
import { db } from '@/lib/db';

vi.mock('@/lib/auth/resolve-user', () => ({
  resolveCurrentUser: vi.fn(async () => ({
    id: 1,
    username: 'agent@example.com',
    email: 'agent@example.com',
    role: 'agent',
    password_hash: 'hash',
    is_active: 1,
  })),
}));

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) => ({
      data,
      ...options,
    }),
  },
}));

describe('POST /api/listings', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM listings').run();
    db.prepare('DELETE FROM users').run();
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, role, is_active)
      VALUES (1, 'agent@example.com', 'agent@example.com', 'hash', 'Agent', 'agent', 1)
    `).run();
  });

  it('should create listing with valid farmland type', async () => {
    const request = new Request('http://localhost/api/listings', {
      method: 'POST',
      body: JSON.stringify({ propertyType: 'farmland' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(response.data.listing).toBeDefined();
    expect(response.data.listing.property_type).toBe('farmland');
  });

  it('should return 400 for invalid property type', async () => {
    const request = new Request('http://localhost/api/listings', {
      method: 'POST',
      body: JSON.stringify({ propertyType: 'invalid-type' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe('invalid-property-type');
  });

  it("should create listing with valid suite type", async () => {
    const request = new Request('http://localhost/api/listings', {
      method: 'POST',
      body: JSON.stringify({ propertyType: 'suite' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(response.data.listing).toBeDefined();
    expect(response.data.listing.property_type).toBe('suite');
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/listings', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe('invalid json');
  });
});
