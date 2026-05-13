'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: number;
  display_name: string;
  email: string;
  is_active: number;
  listing_count: number;
}

export default function TransferPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [preview, setPreview] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch('/api/admin/transfer-cases')
      .then(r => r.json())
      .then((d: { agents: Agent[] }) => setAgents(d.agents));
  }, []);

  useEffect(() => {
    const from = agents.find(a => a.id === Number(fromId));
    setPreview(from?.listing_count ?? null);
  }, [fromId, agents]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId) return;
    if (!confirm(`確定將「${agents.find(a => a.id === Number(fromId))?.display_name}」的 ${preview} 筆物件，轉移給「${agents.find(a => a.id === Number(toId))?.display_name}」？`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/transfer-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: Number(fromId), to_user_id: Number(toId) }),
      });
      const data = (await res.json()) as { transferred?: number; error?: string };
      if (res.ok) {
        setMsg(`成功轉移 ${data.transferred ?? 0} 筆物件`);
        setFromId(''); setToId('');
        const updated = await fetch('/api/admin/transfer-cases').then(r => r.json()) as { agents: Agent[] };
        setAgents(updated.agents);
      } else {
        setMsg(data.error ?? '操作失敗');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">案件轉移</h1>

      {msg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{msg}</div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">來源業務（離職人員）</label>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">請選擇</option>
              {agents.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === Number(toId)}>
                  {a.display_name}（{a.email}）— {a.listing_count} 筆物件
                  {!a.is_active ? '【已停用】' : ''}
                </option>
              ))}
            </select>
          </div>

          {fromId && preview !== null && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              將轉移 <strong>{preview}</strong> 筆物件
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目標業務（接收人員）</label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">請選擇</option>
              {agents.filter(a => a.is_active && a.id !== Number(fromId)).map(a => (
                <option key={a.id} value={a.id}>
                  {a.display_name}（{a.email}）— 現有 {a.listing_count} 筆物件
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !fromId || !toId}
            className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '處理中...' : '確認轉移'}
          </button>
        </form>
      </div>
    </div>
  );
}
