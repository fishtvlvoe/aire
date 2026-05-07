'use client';

import { useState, useEffect } from 'react';

type Step = 1 | 2 | 3;

export default function SetupPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [oauthWaiting, setOauthWaiting] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onOpenAITokenReceived(({ token }) => {
      setApiKey(token);
      setOauthWaiting(false);
    });
    return unsub;
  }, []);

  const handleLicenseActivate = async () => {
    if (!email || !licenseKey) { setError('請輸入 Email 和 License Key'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/license/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, licenseKey }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { reason?: string };
        setError(`License 驗證失敗：${data.reason ?? '請確認 License Key 正確'}`);
        return;
      }
      window.location.href = '/setup/admin';
      return;
    } catch {
      setError('網路錯誤，請確認已連上網路');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuthStart = async () => {
    setOauthWaiting(true);
    await window.electronAPI?.openExternal(
      'https://chatgpt.com/auth/openai-codex?redirect_uri=three-ai://oauth-callback',
    );
  };

  const handleManualKey = async () => {
    if (!apiKey) { setError('請輸入 API Key'); return; }
    await window.electronAPI?.saveOpenAIToken(apiKey);
    setStep(3);
  };

  const handleSkip = () => {
    setStep(3);
  };

  const handleFinish = () => {
    window.location.href = '/listings';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#2563EB] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Steps Indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-2 w-10 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="mb-2 text-xl font-bold text-slate-800">啟用 License</h1>
            <p className="mb-6 text-sm text-slate-500">請輸入您的 Email 和 License Key 以啟用系統</p>
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
                placeholder="License Key (例：THREE-XXXX-XXXX-XXXX)"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              onClick={() => void handleLicenseActivate()}
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '驗證中...' : '驗證並繼續'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-2 text-xl font-bold text-slate-800">連結 OpenAI 帳號</h1>
            <p className="mb-4 text-sm text-slate-500">
              AI 文件生成需要使用您的 ChatGPT Plus 帳號（$20/月）。
            </p>
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              您必須已訂閱 ChatGPT Plus 才能使用 Codex 功能。
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => void handleOAuthStart()}
                disabled={oauthWaiting}
                className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {oauthWaiting ? '等待授權中...' : '一鍵 OAuth 授權（推薦）'}
              </button>
              <div className="text-center text-xs text-slate-400">或手動輸入 API Key</div>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => void handleManualKey()}
                className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                使用手動 API Key
              </button>
              <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600">
                稍後設定
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-emerald-600">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="mb-2 text-center text-xl font-bold text-slate-800">設定完成！</h1>
            <p className="mb-6 text-center text-sm text-slate-500">您的系統已就緒，可以開始使用 AI 不動產說明書。</p>
            <button
              onClick={handleFinish}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              開始使用
            </button>
          </>
        )}
      </div>
    </div>
  );
}
