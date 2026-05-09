import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './page';

describe('/forgot-password page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders email form and login link', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { name: '忘記密碼' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('請輸入 Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送出重設連結' })).toBeInTheDocument();

    const loginLink = screen.getByRole('link', { name: '返回登入' });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows client side error when email is empty', () => {
    render(<ForgotPasswordPage />);

    fireEvent.click(screen.getByRole('button', { name: '送出重設連結' }));

    expect(screen.getByText('請輸入 Email')).toBeInTheDocument();
  });

  it('shows success message when API returns 200', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('請輸入 Email'), {
      target: { value: 'agent@realty.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '送出重設連結' }));

    expect(await screen.findByText('如果帳號存在，重設連結已發送至您的信箱')).toBeInTheDocument();
  });
});
