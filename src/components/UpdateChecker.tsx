'use client';

import { useEffect, useState } from 'react';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'progress' | 'ready' | 'up-to-date' | 'error';

export default function UpdateChecker() {
  // 用 state 延遲到 CSR 才判斷，避免 SSR/CSR hydration mismatch
  const [isElectron, setIsElectron] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState('');

  useEffect(() => {
    // 在 client side 才偵測 Electron 環境
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
  }, []);

  useEffect(() => {
    if (!isElectron) return;
    const api = window.electronAPI;
    if (!api) return;

    void api.getVersion().then(setVersion);

    const unsub = api.onUpdateStatus((e) => {
      setStatus(e.status as UpdateStatus);
      setProgress(e.progress ?? 0);
      setMessage(e.message ?? '');
    });

    return unsub;
  }, [isElectron]);

  // 非 Electron 環境不顯示
  if (!isElectron) return null;

  const handleCheck = () => {
    setStatus('checking');
    void window.electronAPI?.checkForUpdates();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">軟體更新</p>
          {version && <p className="text-xs text-slate-500">目前版本：v{version}</p>}
        </div>
        <button
          onClick={handleCheck}
          disabled={status === 'checking' || status === 'progress'}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'checking' ? '檢查中...' : '檢查更新'}
        </button>
      </div>

      {status === 'available' && (
        <p className="mt-2 text-xs text-blue-600">{message || '發現新版本，開始下載中...'}</p>
      )}

      {status === 'progress' && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-600">
            <span>正在下載更新...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'up-to-date' && (
        <p className="mt-2 text-xs text-emerald-600">已是最新版本</p>
      )}

      {status === 'ready' && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-blue-600">{message || '更新已下載，重啟後完成安裝'}</p>
          <button
            type="button"
            onClick={() => void window.electronAPI?.installUpdate()}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            立即安裝
          </button>
        </div>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500">{message || '檢查更新失敗'}</p>
      )}
    </div>
  );
}
