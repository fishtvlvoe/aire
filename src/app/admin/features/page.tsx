'use client';

import { useEffect, useState } from 'react';
import type { LicenseEntry } from '@/app/api/admin/features/route';
import type { DocFlagsMap } from '@/app/api/admin/doc-flags/route';
import AdminBreadcrumb from '@/components/AdminBreadcrumb';

interface FeatureDef { key: string; label: string }

// 5 種文件類型的顯示定義
const DOC_FLAG_LABELS: Array<{ key: keyof DocFlagsMap; label: string; desc: string }> = [
  { key: 'disclosure',   label: '不動產說明書', desc: '自動生成不動產說明書文件' },
  { key: 'inspection',   label: '物調表',       desc: '物件現況調查表' },
  { key: 'sales_dm',     label: '銷售 DM',      desc: '列印用銷售傳單' },
  { key: 'listing_591',  label: '591 文案',     desc: '591 房屋平台刊登文案' },
  { key: 'social_post',  label: '社群貼文',     desc: 'Instagram / Facebook 貼文' },
];

export default function AdminFeaturesPage() {
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
  const [allFeatures, setAllFeatures] = useState<FeatureDef[]>([]);
  const [loading, setLoading] = useState(true);
  // 文件功能 flags 狀態
  const [docFlags, setDocFlags] = useState<DocFlagsMap | null>(null);
  const [docFlagsLoading, setDocFlagsLoading] = useState(true);
  const [docFlagsMsg, setDocFlagsMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LicenseEntry>>({ active: true, features: ['disclosure-document'] });

  const load = async () => {
    const res = await fetch('/api/admin/features');
    if (res.ok) {
      const data = (await res.json()) as { licenses: LicenseEntry[]; allFeatures: FeatureDef[] };
      setLicenses(data.licenses);
      setAllFeatures(data.allFeatures);
    }
    setLoading(false);
  };

  // 載入文件功能 flags
  const loadDocFlags = async () => {
    const res = await fetch('/api/admin/doc-flags');
    if (res.ok) {
      setDocFlags((await res.json()) as DocFlagsMap);
    }
    setDocFlagsLoading(false);
  };

  useEffect(() => { void load(); void loadDocFlags(); }, []);

  // 切換單一文件功能 flag
  const toggleDocFlag = async (key: keyof DocFlagsMap) => {
    if (!docFlags) return;
    const newVal = !docFlags[key];
    const updated = { ...docFlags, [key]: newVal };
    setDocFlags(updated);

    const res = await fetch('/api/admin/doc-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: newVal }),
    });
    if (res.ok) {
      setDocFlags((await res.json()) as DocFlagsMap);
      setDocFlagsMsg('已儲存');
      setTimeout(() => setDocFlagsMsg(''), 2000);
    }
  };

  const toggleFeature = async (entry: LicenseEntry, featureKey: string) => {
    const hasIt = entry.features.includes(featureKey);
    const updated = {
      ...entry,
      features: hasIt
        ? entry.features.filter((f) => f !== featureKey)
        : [...entry.features, featureKey],
    };
    await fetch('/api/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setLicenses((prev) => prev.map((e) => (e.licenseKey === entry.licenseKey ? updated : e)));
    setMsg('已儲存');
    setTimeout(() => setMsg(''), 2000);
  };

  const toggleActive = async (entry: LicenseEntry) => {
    const updated = { ...entry, active: !entry.active };
    await fetch('/api/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setLicenses((prev) => prev.map((e) => (e.licenseKey === entry.licenseKey ? updated : e)));
  };

  const addLicense = async () => {
    if (!newEntry.licenseKey || !newEntry.email) return;
    await fetch('/api/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
    setShowAdd(false);
    setNewEntry({ active: true, features: ['disclosure-document'] });
    void load();
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">License 功能管理</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新增 License
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">新增 License</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['licenseKey', 'email', 'clientName'] as const).map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field === 'licenseKey' ? 'License Key' : field === 'email' ? 'Email' : '客戶名稱'}
                value={(newEntry[field] as string) ?? ''}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, [field]: e.target.value }))}
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void addLicense()} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">取消</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">客戶</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">License Key</th>
              {allFeatures.map((f) => (
                <th key={f.key} className="px-4 py-3 text-center font-medium text-slate-600">{f.label}</th>
              ))}
              <th className="px-4 py-3 text-center font-medium text-slate-600">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {licenses.map((entry) => (
              <tr key={entry.licenseKey} className={entry.active ? '' : 'opacity-50'}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{entry.clientName || '—'}</div>
                  <div className="text-xs text-slate-500">{entry.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.licenseKey}</td>
                {allFeatures.map((f) => (
                  <td key={f.key} className="px-4 py-3 text-center">
                    <button
                      onClick={() => void toggleFeature(entry, f.key)}
                      className={`h-5 w-5 rounded ${entry.features.includes(f.key) ? 'bg-emerald-500 text-white' : 'border border-slate-300 bg-white'} text-xs font-bold`}
                    >
                      {entry.features.includes(f.key) ? '✓' : ''}
                    </button>
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => void toggleActive(entry)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {entry.active ? '啟用' : '停用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {licenses.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">尚無 License 記錄</div>
        )}
      </div>

      {/* 文件功能設定區塊 */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">文件功能設定</h2>
          {docFlagsMsg && (
            <span className="text-sm text-emerald-600">{docFlagsMsg}</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-5">
          控制各類文件的生成功能是否對所有用戶開放。關閉後用戶將無法生成該類型文件。
        </p>

        {docFlagsLoading ? (
          <div className="text-sm text-slate-400">載入中...</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {DOC_FLAG_LABELS.map(({ key, label, desc }) => {
                const enabled = docFlags?.[key] ?? true;
                return (
                  <div key={key} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                    </div>
                    {/* Toggle 開關 */}
                    <button
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => void toggleDocFlag(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
