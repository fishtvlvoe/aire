'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LlmBackend = 'codex' | 'claude-code' | 'gemini' | 'ollama';

interface Settings {
  llmBackend: LlmBackend;
  debugMode: boolean;
  temperature: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const isProd = process.env.NEXT_PUBLIC_APP_MODE === 'production';

  const [settings, setSettings] = useState<Settings>({
    llmBackend: 'codex',
    debugMode: false,
    temperature: 0.7,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isProd) {
      router.replace('/');
      return;
    }
    try {
      const raw = localStorage.getItem('dev_settings');
      if (raw) setSettings(JSON.parse(raw) as Settings);
    } catch { /* ignore */ }
  }, [isProd, router]);

  const save = () => {
    localStorage.setItem('dev_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isProd) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-700">開發者模式</p>
          <p className="text-xs text-amber-600">此頁面僅在開發/測試環境顯示，Production 模式自動隱藏</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-slate-800">開發者設定</h1>

          <div className="flex flex-col gap-6">
            {/* LLM Backend */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">LLM 後端</label>
              <select
                value={settings.llmBackend}
                onChange={(e) => setSettings((s) => ({ ...s, llmBackend: e.target.value as LlmBackend }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="codex">Codex (OpenAI)</option>
                <option value="claude-code">Claude Code</option>
                <option value="gemini">Gemini</option>
                <option value="ollama">Ollama (本機)</option>
              </select>
            </div>

            {/* Debug Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Debug 模式</p>
                <p className="text-xs text-slate-500">顯示 LLM 請求/回應日誌</p>
              </div>
              <button
                onClick={() => setSettings((s) => ({ ...s, debugMode: !s.debugMode }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${settings.debugMode ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.debugMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Temperature: {settings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>確定 (0)</span>
                <span>創意 (1)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={save}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              儲存設定
            </button>
            {saved && <span className="text-sm text-emerald-600">已儲存</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
