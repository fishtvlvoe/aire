'use client';

import { useEffect, useState } from 'react';
import type { LicenseEntry } from '@/app/api/admin/features/route';

interface FeatureDef { key: string; label: string }

export default function AdminFeaturesPage() {
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
  const [allFeatures, setAllFeatures] = useState<FeatureDef[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { void load(); }, []);

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

  if (loading) return <div className="p-8 text-slate-500">載入中...</div>;

  return (
    <div className="p-8 max-w-4xl">
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
    </div>
  );
}
