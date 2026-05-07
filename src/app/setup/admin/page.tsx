'use client';

import { useState } from 'react';

interface CreateFirstAdminResponse {
  success?: boolean;
  user?: { id: number; email: string; displayName: string; role: string };
  error?: string;
}

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/setup/create-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password }),
      });

      const data = (await res.json()) as CreateFirstAdminResponse;

      if (!res.ok) {
        setError(data.error ?? '建立失敗，請稍後再試');
        return;
      }

      // 建立成功後導向登入頁
      window.location.href = '/login';
    } catch {
      setError('建立失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#2563EB] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="mb-2 text-xl font-bold text-slate-800">建立首位管理員</h1>
        <p className="mb-6 text-sm text-slate-500">請建立管理員帳號以完成系統初始化。</p>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="text"
            placeholder="顯示名稱"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="password"
            placeholder="密碼（至少 6 字元）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '建立中...' : '建立管理員'}
        </button>
      </div>
    </div>
  );
}
