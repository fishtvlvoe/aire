import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendPasswordResetEmail } from './email';

describe('sendPasswordResetEmail', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.TOSEND_API_KEY = 'tsend_test_key';
    process.env.TOSEND_FROM_EMAIL = 'fish@aiver.me';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('calls toSend API with expected payload', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await sendPasswordResetEmail('agent@realty.com', 'http://localhost:3000/reset-password?token=abc');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://tosend.io/api/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tsend_test_key',
          'Content-Type': 'application/json',
        }),
      })
    );

    const payload = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as {
      from: string;
      to: string;
      subject: string;
      text: string;
    };
    expect(payload.from).toBe('fish@aiver.me');
    expect(payload.to).toBe('agent@realty.com');
    expect(payload.subject).toBe('密碼重設 - AI 不動產系統');
    expect(payload.text).toContain('http://localhost:3000/reset-password?token=abc');
  });

  it('logs and resolves when toSend API fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => new Response('server error', { status: 500 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      sendPasswordResetEmail('agent@realty.com', 'http://localhost:3000/reset-password?token=abc')
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
  });
});
