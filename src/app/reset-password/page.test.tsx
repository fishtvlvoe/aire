import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? 'token-123' : null),
  }),
}));

import ResetPasswordPage from './page';

describe('/reset-password page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    pushMock.mockReset();
  });

  it('renders password reset form', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole('heading', { name: '重設密碼' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('請輸入新密碼')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('請再次輸入新密碼')).toBeInTheDocument();
  });

  it('shows mismatch error when passwords differ', () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('請輸入新密碼'), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByPlaceholderText('請再次輸入新密碼'), { target: { value: 'abc124' } });
    fireEvent.click(screen.getByRole('button', { name: '重設密碼' }));

    expect(screen.getByText('兩次密碼不一致')).toBeInTheDocument();
  });

  it('shows API error when reset endpoint returns 401', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: '重設連結無效' }), { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('請輸入新密碼'), { target: { value: 'new-pass-123' } });
    fireEvent.change(screen.getByPlaceholderText('請再次輸入新密碼'), { target: { value: 'new-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: '重設密碼' }));

    expect(await screen.findByText('重設連結無效')).toBeInTheDocument();
  });

  it('redirects to login after successful reset', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('請輸入新密碼'), { target: { value: 'new-pass-123' } });
    fireEvent.change(screen.getByPlaceholderText('請再次輸入新密碼'), { target: { value: 'new-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: '重設密碼' }));

    expect(await screen.findByText('密碼已重設，3 秒後將導向登入頁')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 3200));
    expect(pushMock).toHaveBeenCalledWith('/login');
  }, 10000);
});
