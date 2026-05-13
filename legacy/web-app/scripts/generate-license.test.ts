import { afterEach, describe, expect, it, vi } from 'vitest';
import { runGenerateLicense } from './generate-license';

describe('generate-license cli', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 1 when --expires is not a future ISO date', async () => {
    const logs: string[] = [];
    const errors: string[] = [];
    const code = await runGenerateLicense(
      ['--company', '建安不動產', '--expires', '2000-01-01T00:00:00.000Z'],
      {
        log: (message) => logs.push(message),
        error: (message) => errors.push(message),
        fetchImpl: vi.fn() as unknown as typeof fetch,
      }
    );

    expect(code).toBe(1);
    expect(logs).toEqual([]);
    expect(errors).toEqual(['--expires must be a future ISO 8601 date']);
  });

  it('prints serial key and exits 0 on success', async () => {
    vi.stubEnv('LICENSE_ADMIN_TOKEN', 'test-admin-token');
    const logs: string[] = [];
    const errors: string[] = [];
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ items: [{ licenseKey: 'LIC-XYZ-001' }] }), { status: 200 })
    ) as unknown as typeof fetch;

    const code = await runGenerateLicense(
      ['--company', '建安不動產', '--expires', '2999-01-01T00:00:00.000Z'],
      {
        log: (message) => logs.push(message),
        error: (message) => errors.push(message),
        fetchImpl,
      }
    );

    expect(code).toBe(0);
    expect(logs).toEqual(['LIC-XYZ-001']);
    expect(errors).toEqual([]);
  });
});
