'use client';

import { useEffect, useState } from 'react';
import AdminBreadcrumb from '@/components/AdminBreadcrumb';
import ColorSchemeSelector from '@/components/ColorSchemeSelector';
import LogoUploader from '@/components/LogoUploader';

type TemplateSettings = {
  colorScheme: string;
  logoPath: string | null;
  bgCoverPath: string | null;
  bgContentPath: string | null;
};

type BackgroundPage = 'cover' | 'content';

function BackgroundUploadSlot({
  title,
  value,
  onUpload,
  onRemove,
}: {
  title: string;
  value: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(45,49,66,0.06)]">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {value ? (
        <div className="mt-3">
          <img
            src={value}
            alt={`${title} 背景圖`}
            className="max-h-[200px] w-auto rounded border border-slate-200 object-contain"
          />
          <button
            type="button"
            onClick={() => {
              void (async () => {
                setError('');
                setRemoving(true);
                try {
                  await onRemove();
                } catch (caughtError) {
                  setError(caughtError instanceof Error ? caughtError.message : '刪除失敗');
                } finally {
                  setRemoving(false);
                }
              })();
            }}
            disabled={removing}
            className="mt-3 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? '刪除中...' : '刪除背景'}
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
          <p className="mb-3 text-sm text-slate-500">尚未上傳背景</p>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            id={`bg-upload-${title}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const input = event.currentTarget;
              void (async () => {
                setError('');
                setUploading(true);
                try {
                  await onUpload(file);
                } catch (caughtError) {
                  setError(caughtError instanceof Error ? caughtError.message : '上傳失敗');
                } finally {
                  setUploading(false);
                  input.value = '';
                }
              })();
            }}
          />
          <label
            htmlFor={`bg-upload-${title}`}
            className="inline-block cursor-pointer rounded bg-[#1B3A6B] px-4 py-2 text-sm font-medium text-white hover:bg-[#23477d]"
          >
            {uploading ? '上傳中...' : '上傳背景'}
          </label>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function AdminTemplatesPage() {
  const [settings, setSettings] = useState<TemplateSettings>({
    colorScheme: 'navy',
    logoPath: null,
    bgCoverPath: null,
    bgContentPath: null,
  });
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
        bgCoverPath: data.bgCoverPath ?? null,
        bgContentPath: data.bgContentPath ?? null,
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

  const uploadBackground = async (page: BackgroundPage, file: File) => {
    const formData = new FormData();
    formData.append('page', page);
    formData.append('file', file);
    const res = await fetch('/api/admin/templates/background', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? '背景圖上傳失敗');
    }
    const payload = (await res.json()) as { url: string };
    setSettings((prev) => (
      page === 'cover'
        ? { ...prev, bgCoverPath: payload.url }
        : { ...prev, bgContentPath: payload.url }
    ));
    setMessage('背景圖上傳成功');
  };

  const removeBackground = async (page: BackgroundPage) => {
    const res = await fetch(`/api/admin/templates/background?page=${page}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? '背景圖移除失敗');
    }
    setSettings((prev) => (
      page === 'cover'
        ? { ...prev, bgCoverPath: null }
        : { ...prev, bgContentPath: null }
    ));
    setMessage('背景圖已移除');
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

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800 mb-3">版型背景圖</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <BackgroundUploadSlot
            title="封面頁"
            value={settings.bgCoverPath}
            onUpload={(file) => uploadBackground('cover', file)}
            onRemove={() => removeBackground('cover')}
          />
          <BackgroundUploadSlot
            title="內容頁"
            value={settings.bgContentPath}
            onUpload={(file) => uploadBackground('content', file)}
            onRemove={() => removeBackground('content')}
          />
        </div>
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
