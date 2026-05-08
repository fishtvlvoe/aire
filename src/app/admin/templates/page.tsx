'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 文件類型選項（與後端 doc_type 對應）
const DOC_TYPE_OPTIONS = [
  { value: 'disclosure', label: '不動產說明書' },
  { value: 'inspection', label: '物調表' },
  { value: 'sales_dm', label: '銷售 DM' },
  { value: 'listing_591', label: '591 文案' },
  { value: 'social_post', label: '社群貼文' },
];

interface Template {
  id: number;
  name: string;
  description: string | null;
  doc_type: string;
  is_default: number;
  created_at: string;
}

// 新增模板表單初始值
const EMPTY_FORM = {
  name: '',
  description: '',
  doc_type: 'disclosure',
  file: null as File | null,
};

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // 頁面載入時檢查 admin 角色，非 admin 導回物件列表
  useEffect(() => {
    const checkRole = async () => {
      const res = await fetch('/api/me');
      if (!res.ok) { router.push('/listings'); return; }
      const data = (await res.json()) as { user: { role: string } | null };
      if (data.user?.role !== 'admin') router.push('/listings');
    };
    void checkRole();
  }, [router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/templates');
    if (res.ok) {
      setTemplates((await res.json()) as Template[]);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  // 顯示暫時訊息（2 秒後自動清除）
  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2000);
  };

  // 上傳新模板
  const handleUpload = async () => {
    if (!form.name.trim() || !form.doc_type || !form.file) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', form.name.trim());
    if (form.description.trim()) formData.append('description', form.description.trim());
    formData.append('doc_type', form.doc_type);
    formData.append('file', form.file);

    const res = await fetch('/api/admin/templates', { method: 'POST', body: formData });
    setSubmitting(false);

    if (res.ok) {
      setShowUpload(false);
      setForm(EMPTY_FORM);
      showMsg('模板已上傳');
      void load();
    } else {
      const err = (await res.json()) as { error?: string };
      showMsg(err.error ?? '上傳失敗');
    }
  };

  // 設為預設模板
  const handleSetDefault = async (id: number) => {
    const res = await fetch(`/api/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    });
    if (res.ok) {
      showMsg('已設為預設');
      void load();
    }
  };

  // 刪除模板
  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個模板嗎？')) return;
    const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showMsg('已刪除');
      void load();
    }
  };

  // 取得 doc_type 的顯示標籤
  const getDocTypeLabel = (docType: string) =>
    DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;

  if (loading) return <div className="p-8 text-slate-500">載入中...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">模板管理</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            上傳模板
          </button>
        </div>
      </div>

      {/* 上傳表單 */}
      {showUpload && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">上傳新模板</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 模板名稱 */}
            <input
              type="text"
              placeholder="模板名稱"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="col-span-2 rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {/* 描述 */}
            <textarea
              placeholder="描述（選填）"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="col-span-2 rounded border border-slate-300 px-3 py-2 text-sm resize-none"
            />
            {/* 文件類型 */}
            <select
              value={form.doc_type}
              onChange={(e) => setForm((prev) => ({ ...prev, doc_type: e.target.value }))}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {/* HTML 檔案 */}
            <input
              type="file"
              accept=".html,.htm"
              onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void handleUpload()}
              disabled={submitting || !form.name.trim() || !form.file}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '上傳中...' : '儲存'}
            </button>
            <button
              onClick={() => { setShowUpload(false); setForm(EMPTY_FORM); }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 模板卡片列表 */}
      <div className="grid grid-cols-1 gap-4">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-800 truncate">{t.name}</span>
                {t.is_default === 1 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    預設
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {getDocTypeLabel(t.doc_type)}
                </span>
              </div>
              {t.description && (
                <p className="text-sm text-slate-500 mb-1">{t.description}</p>
              )}
              <p className="text-xs text-slate-400">
                建立於 {new Date(t.created_at).toLocaleDateString('zh-TW')}
              </p>
            </div>
            {/* 操作按鈕 */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {t.is_default !== 1 && (
                <button
                  onClick={() => void handleSetDefault(t.id)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  設為預設
                </button>
              )}
              <button
                onClick={() => void handleDelete(t.id)}
                className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            尚無模板，請點擊「上傳模板」新增
          </div>
        )}
      </div>
    </div>
  );
}
