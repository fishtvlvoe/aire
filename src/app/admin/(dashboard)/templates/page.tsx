'use client';

import { useEffect, useState } from 'react';
import AdminBreadcrumb from '@/components/AdminBreadcrumb';
import ColorSchemeSelector from '@/components/ColorSchemeSelector';
import LogoUploader from '@/components/LogoUploader';

type TemplateSettings = {
  colorScheme: string;
  logoPath: string | null;
};

export default function AdminTemplatesPage() {
  const [settings, setSettings] = useState<TemplateSettings>({ colorScheme: 'navy', logoPath: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (!res.ok) {
        throw new Error('讀取設定失敗');
      }
      const data = (await res.json()) as TemplateSettings;
      setSettings({
        colorScheme: data.colorScheme || 'navy',
        logoPath: data.logoPath ?? null,
      });
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : '讀取設定失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const saveColorScheme = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorScheme: settings.colorScheme }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '儲存失敗');
      }
      setMessage('儲存成功');
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/templates/logo', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Logo 上傳失敗');
    }
    const payload = (await res.json()) as { logoPath: string | null };
    setSettings((prev) => ({ ...prev, logoPath: payload.logoPath ?? null }));
    setMessage('Logo 上傳成功');
  };

  const removeLogo = async () => {
    const res = await fetch('/api/admin/templates/logo', {
      method: 'DELETE',
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Logo 移除失敗');
    }
    setSettings((prev) => ({ ...prev, logoPath: null }));
    setMessage('Logo 已移除');
  };

  if (loading) {
    return (
      <>
        <AdminBreadcrumb />
        <div className="text-slate-500">載入中...</div>
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />
      <h1 className="text-2xl font-bold text-slate-800">文件樣式設定</h1>
      <p className="mt-2 text-sm text-slate-500">設定文件產出的配色方案與公司 Logo</p>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800 mb-3">選擇配色方案</h2>
        <ColorSchemeSelector
          value={settings.colorScheme}
          onChange={(id) => setSettings((prev) => ({ ...prev, colorScheme: id }))}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800 mb-3">公司 Logo</h2>
        <LogoUploader
          logoPath={settings.logoPath}
          onUpload={uploadLogo}
          onRemove={removeLogo}
        />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void saveColorScheme();
          }}
          disabled={saving}
          className="rounded-lg bg-[#1B3A6B] px-5 py-2 text-sm font-medium text-white hover:bg-[#23477d] disabled:opacity-50"
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
      </div>
    </>
  );
}
