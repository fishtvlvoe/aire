'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerifyResponse {
  valid: boolean;
  error?: string;
}

export default function CodexSetupPage() {
  const router = useRouter();
  const isProd = process.env.NEXT_PUBLIC_APP_MODE === 'production';
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async () => {
    const normalized = apiKey.trim();
    if (!normalized) {
      setError('請輸入 API Key');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/setup/verify-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: normalized }),
      });

      if (!response.ok) {
        setError('驗證失敗，請稍後再試');
        return;
      }

      const payload = (await response.json()) as VerifyResponse;
      if (!payload.valid) {
        setError(payload.error === 'API Key 無效' ? 'API Key 無效，請確認後重試' : payload.error ?? '驗證失敗');
        return;
      }

      router.push('/');
    } catch {
      setError('驗證失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#2563EB] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="mb-2 text-xl font-bold text-slate-800">Step 2 / Codex 設定</h1>
          <p className="text-sm text-slate-500">請輸入 OpenAI API Key 以啟用 AI 文件功能。</p>
          {isProd && (
            <p className="mt-2 text-xs text-slate-400">
              Production 模式已鎖定為 Codex 後端。
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="sk-proj-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={() => void handleVerify()}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '驗證中...' : '驗證'}
          </button>
          <button
            onClick={handleSkip}
            className="w-full rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            跳過
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

