'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    backgroundColor: 'var(--bg)',
    color: 'var(--fg)',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: 'var(--bg)',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '20px',
    lineHeight: 1.4,
    textAlign: 'center' as const,
  },
  form: {
    display: 'grid',
    gap: '12px',
  },
  input: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: 'var(--fg)',
    backgroundColor: 'var(--bg)',
  },
  button: {
    width: '100%',
    border: '1px solid var(--primary)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: 'var(--primary)',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    minHeight: '20px',
    margin: 0,
    fontSize: '13px',
    color: '#dc2626',
    textAlign: 'center' as const,
  },
  hint: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--muted)',
    textAlign: 'center' as const,
  },
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    // 進頁先探測是否已有有效 session，若有就直接導向列表頁。
    const checkSession = async () => {
      const res = await fetch('/api/admin/licenses?page=1&pageSize=1', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!active) {
        return;
      }

      if (res.status === 200) {
        router.replace('/admin/licenses');
      }
    };

    checkSession().catch(() => {
      // 探測失敗時維持在登入頁，不阻斷使用者操作。
    });

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });

      if (res.status === 200) {
        router.push('/admin/licenses');
        return;
      }

      if (res.status === 401) {
        setError('密碼錯誤');
        return;
      }

      if (res.status === 503) {
        setError('後台未設定，請聯絡開發者');
        return;
      }

      setError('登入失敗，請重試');
    } catch {
      setError('登入失敗，請重試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>序號管理後台 / Admin Login</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="密碼"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={styles.input}
            aria-label="密碼"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
          >
            {submitting ? '登入中...' : '登入'}
          </button>

          <p style={styles.error} role="alert" aria-live="polite">
            {error}
          </p>
          <p style={styles.hint}>請輸入管理員密碼</p>
        </form>
      </section>
    </main>
  );
}
