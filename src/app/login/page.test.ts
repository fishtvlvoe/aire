import { describe, expect, it, vi } from 'vitest';
import { loginWithCredentials } from './page';

const signInMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

describe('loginWithCredentials', () => {
  it('returns false for failed credentials', async () => {
    signInMock.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin' });

    const result = await loginWithCredentials('admin', 'wrong456', 'SERIAL-KEY');
    expect(result).toBe(false);
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      username: 'admin',
      password: 'wrong456',
      licenseKey: 'SERIAL-KEY',
      mode: 'customer',
      redirect: false,
    });
  });

  it('returns true for valid credentials', async () => {
    signInMock.mockResolvedValueOnce({ ok: true });

    const result = await loginWithCredentials('admin', 'correct123', 'SERIAL-KEY');
    expect(result).toBe(true);
  });
});
