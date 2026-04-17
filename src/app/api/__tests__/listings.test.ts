import { describe, it, expect, vi } from 'vitest';
import { POST } from '../listings/route';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options?: any) => ({
      data,
      ...options,
    }),
  },
}));

describe('POST /api/listings', () => {
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

  it('should return 400 for unavailable property type', async () => {
    const request = new Request('http://localhost/api/listings', {
      method: 'POST',
      body: JSON.stringify({ propertyType: 'suite' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe('type-not-available');
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
