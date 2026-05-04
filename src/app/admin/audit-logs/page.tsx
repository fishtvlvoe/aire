'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: number;
  action: string;
  target_type: string;
  target_id: number | null;
  detail: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

interface Response {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
}

const ACTION_LABELS: Record<string, string> = {
  create_listing: '建立物件',
  update_listing: '更新物件',
  delete_listing: '刪除物件',
  generate_document: '生成文件',
  transfer_cases: '案件轉移',
  disable_user: '停用帳號',
  reset_password: '重設密碼',
  create_user: '建立帳號',
  login: '登入',
  logout: '登出',
};

export default function AuditLogsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  async function load(p: number) {
    const params = new URLSearchParams({ page: String(p) });
    if (actionFilter) params.set('action', actionFilter);
    if (dateFilter) params.set('date', dateFilter);
    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
    if (res.ok) {
      const d = (await res.json()) as Response;
      setData(d);
    }
  }

  useEffect(() => { void load(page); }, [page, actionFilter, dateFilter]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">操作日誌</h1>

      <div className="flex gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部動作</option>
          {Object.entries(ACTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        {(actionFilter || dateFilter) && (
          <button
            onClick={() => { setActionFilter(''); setDateFilter(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >清除篩選</button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">時間</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作者</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">動作</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">說明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.logs.map(log => (
              <tr key={log.id}>
                <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{log.created_at.replace('T', ' ').slice(0, 16)}</td>
                <td className="px-4 py-2.5 text-gray-700">{log.user_name ?? '系統'}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{log.detail ?? '—'}</td>
              </tr>
            ))}
            {data?.logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">無紀錄</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-40"
          >上一頁</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data.pages}</span>
          <button
            disabled={page === data.pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-40"
          >下一頁</button>
        </div>
      )}
    </div>
  );
}
