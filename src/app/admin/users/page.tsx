'use client';

import { useEffect, useState } from 'react';
import AdminBreadcrumb from '@/components/AdminBreadcrumb';

interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'agent';
  is_active: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = (await res.json()) as User[];
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => { void loadUsers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, display_name: newName, password: newPassword }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) { setMsg(data.error ?? '建立失敗'); return; }
    setMsg('帳號建立成功');
    setShowCreate(false);
    setNewEmail(''); setNewName(''); setNewPassword('');
    void loadUsers();
  }

  async function handleDisable(id: number) {
    if (!confirm('確定停用此帳號？停用後該業務將無法登入。')) return;
    const res = await fetch(`/api/admin/users/${id}/disable`, { method: 'PUT' });
    setMsg(res.ok ? '已停用' : '操作失敗');
    void loadUsers();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    const res = await fetch(`/api/admin/users/${resetId}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = (await res.json()) as { error?: string };
    setMsg(res.ok ? '密碼已重設，該帳號所有 session 已清除' : (data.error ?? '操作失敗'));
    setResetId(null);
    setResetPassword('');
  }

  if (loading) {
    return (
      <>
        <AdminBreadcrumb />
        <div className="text-gray-500">載入中...</div>
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">帳號管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          新增業務帳號
        </button>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {msg}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg border space-y-3">
          <h2 className="font-medium text-gray-700">新增業務帳號</h2>
          <input
            type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            required placeholder="電子郵件"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            required placeholder="顯示名稱"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            required placeholder="初始密碼（至少 6 字元）" minLength={6}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">建立</button>
            <button type="button" onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名稱</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">帳號</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">狀態</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-gray-800">{u.display_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'admin' ? '管理員' : '業務'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && (
                    <div className="flex gap-2">
                      {u.is_active ? (
                        <button
                          onClick={() => handleDisable(u.id)}
                          className="text-red-600 hover:underline text-xs"
                        >停用</button>
                      ) : null}
                      <button
                        onClick={() => { setResetId(u.id); setResetPassword(''); }}
                        className="text-blue-600 hover:underline text-xs"
                      >重設密碼</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={handleResetPassword} className="bg-white rounded-xl p-6 w-80 shadow-xl space-y-4">
            <h2 className="font-semibold text-gray-800">重設密碼</h2>
            <input
              type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
              required placeholder="新密碼（至少 6 字元）" minLength={6}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">確認重設</button>
              <button type="button" onClick={() => setResetId(null)} className="border px-4 py-2 rounded-lg text-sm">取消</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
