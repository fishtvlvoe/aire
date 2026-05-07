'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

type LicenseStatus = 'issued' | 'activated' | 'revoked';

interface LicenseItem {
  licenseKey: string;
  status: LicenseStatus;
  email: string | null;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  issuedBy: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  features: string[];
}

interface ListResponse {
  items: LicenseItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateResponse {
  items: Array<{
    licenseKey: string;
    status: 'issued';
    createdAt: string;
    expiresAt: string | null;
    features: string[];
  }>;
}

type ToastState = { type: 'success' | 'error'; message: string } | null;

export default function AdminLicensesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | LicenseStatus>('all');
  const [search, setSearch] = useState('');
  const [listData, setListData] = useState<ListResponse>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [issuedTotal, setIssuedTotal] = useState(0);
  const [activatedTotal, setActivatedTotal] = useState(0);
  const [revokedTotal, setRevokedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  const [count, setCount] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [issuedBy, setIssuedBy] = useState('admin');
  const [allowAdvancedExport, setAllowAdvancedExport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const [revokeTarget, setRevokeTarget] = useState<LicenseItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  const loadStats = async () => {
    const statuses: LicenseStatus[] = ['issued', 'activated', 'revoked'];
    const responses = await Promise.all(
      statuses.map(async (status) => {
        const response = await fetch(`/api/admin/licenses?page=1&pageSize=1&status=${status}`);
        if (!response.ok) return { status, total: 0 };
        const data = (await response.json()) as ListResponse;
        return { status, total: data.total };
      }),
    );

    const totals: Record<LicenseStatus, number> = {
      issued: 0,
      activated: 0,
      revoked: 0,
    };
    responses.forEach(({ status, total }) => {
      totals[status] = total;
    });

    setIssuedTotal(totals.issued);
    setActivatedTotal(totals.activated);
    setRevokedTotal(totals.revoked);
  };

  const loadList = async (page: number, filter: 'all' | LicenseStatus) => {
    setLoading(true);
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(listData.pageSize),
    });
    if (filter !== 'all') query.set('status', filter);

    const response = await fetch(`/api/admin/licenses?${query.toString()}`);
    if (!response.ok) {
      showToast('error', '載入序號清單失敗');
      setLoading(false);
      return;
    }
    const data = (await response.json()) as ListResponse;
    setListData(data);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.all([loadStats(), loadList(1, statusFilter)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadList(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return listData.items;
    const keyword = search.toLowerCase();
    return listData.items.filter((item) =>
      item.licenseKey.toLowerCase().includes(keyword) ||
      (item.email ?? '').toLowerCase().includes(keyword),
    );
  }, [listData.items, search]);

  const todayIssued = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return listData.items.filter((item) => item.createdAt.startsWith(today)).length;
  }, [listData.items]);

  const maxPage = Math.max(1, Math.ceil(listData.total / listData.pageSize));

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const features = ['disclosure-document'];
    if (allowAdvancedExport) features.push('advanced-export');

    const response = await fetch('/api/admin/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        issuedBy: issuedBy.trim() || 'admin',
        features,
      }),
    });

    const data = (await response.json()) as { error?: string } & CreateResponse;
    if (!response.ok) {
      showToast('error', data.error ?? '序號建立失敗');
      setSubmitting(false);
      return;
    }

    const keys = data.items.map((item) => item.licenseKey);
    setGeneratedKeys(keys);
    showToast('success', `已建立 ${keys.length} 組序號`);
    setSubmitting(false);
    await Promise.all([loadStats(), loadList(1, statusFilter)]);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const response = await fetch('/api/admin/licenses/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: revokeTarget.licenseKey,
        reason: revokeReason.trim() || undefined,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast('error', data.error ?? '停用失敗');
      setRevoking(false);
      return;
    }
    setRevoking(false);
    setRevokeTarget(null);
    setRevokeReason('');
    showToast('success', '序號已停用');
    await Promise.all([loadStats(), loadList(1, statusFilter)]);
  };

  const handleExportCsv = () => {
    if (generatedKeys.length === 0) {
      showToast('error', '目前沒有可匯出的新序號');
      return;
    }
    const csv = `licenseKey\n${generatedKeys.join('\n')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    showToast('success', '已複製');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        此頁為管理端，需授權 Token。
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">序號控制後台</h1>
        <p className="text-slate-600">建立、查詢、停用客戶序號</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="有效序號" value={issuedTotal + activatedTotal} />
        <KpiCard label="已啟用" value={activatedTotal} />
        <KpiCard label="已停用" value={revokedTotal} />
        <KpiCard label="今日新增" value={todayIssued} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form onSubmit={handleCreate} className="xl:col-span-4 rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">建立序號</h2>

          <Field label="數量 (1~500)">
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(500, Number(event.target.value) || 1)))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="到期時間">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="核發者">
            <input
              type="text"
              value={issuedBy}
              onChange={(event) => setIssuedBy(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">功能權限</div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input checked readOnly type="checkbox" />
              disclosure-document (預設)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowAdvancedExport}
                onChange={(event) => setAllowAdvancedExport(event.target.checked)}
              />
              advanced-export
            </label>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? '建立中...' : '建立序號'}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-md border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              匯出 CSV
            </button>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">最新建立序號</div>
            {generatedKeys.length === 0 ? (
              <div className="text-xs text-slate-400">尚未建立</div>
            ) : (
              <div className="space-y-2">
                {generatedKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <code className="text-xs text-slate-700">{key}</code>
                    <button
                      type="button"
                      onClick={() => void copyText(key)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      複製
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="xl:col-span-8 rounded-xl border bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜尋序號或 Email..."
              className="w-full sm:w-72 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['all', 'issued', 'activated', 'revoked'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={`px-3 py-1.5 text-xs rounded-md ${
                    statusFilter === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {item === 'all' ? '全部' : item}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">licenseKey</th>
                  <th className="text-left px-4 py-3">status</th>
                  <th className="text-left px-4 py-3">email</th>
                  <th className="text-left px-4 py-3">createdAt</th>
                  <th className="text-left px-4 py-3">activatedAt</th>
                  <th className="text-left px-4 py-3">expiresAt</th>
                  <th className="text-left px-4 py-3">issuedBy</th>
                  <th className="text-right px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">載入中...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">目前沒有符合條件的序號</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.licenseKey}>
                      <td className="px-4 py-3 font-mono text-xs">{item.licenseKey}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{item.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(item.activatedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(item.expiresAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{item.issuedBy ?? '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => void copyText(item.licenseKey)} className="text-blue-600 hover:underline text-xs">
                          複製
                        </button>
                        {item.status !== 'revoked' && (
                          <button
                            onClick={() => setRevokeTarget(item)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            停用
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>共 {listData.total} 筆</span>
            <div className="space-x-2">
              <button
                disabled={listData.page <= 1 || loading}
                onClick={() => void loadList(listData.page - 1, statusFilter)}
                className="border rounded px-2 py-1 disabled:opacity-50"
              >
                上一頁
              </button>
              <span>{listData.page} / {maxPage}</span>
              <button
                disabled={listData.page >= maxPage || loading}
                onClick={() => void loadList(listData.page + 1, statusFilter)}
                className="border rounded px-2 py-1 disabled:opacity-50"
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      </section>

      {revokeTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white border shadow-xl">
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-semibold">確認停用序號</h3>
              <code className="block rounded border bg-slate-50 px-3 py-2 text-xs">{revokeTarget.licenseKey}</code>
              <textarea
                value={revokeReason}
                onChange={(event) => setRevokeReason(event.target.value)}
                placeholder="停用原因（選填）"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-24"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => { setRevokeTarget(null); setRevokeReason(''); }}
                className="rounded-md border px-3 py-2 text-sm"
              >
                取消
              </button>
              <button
                disabled={revoking}
                onClick={() => void handleRevoke()}
                className="rounded-md bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-50"
              >
                {revoking ? '停用中...' : '確認停用'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed right-6 bottom-6 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const map: Record<LicenseStatus, string> = {
    issued: 'bg-slate-100 text-slate-700',
    activated: 'bg-emerald-100 text-emerald-700',
    revoked: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-TW', { hour12: false });
}
