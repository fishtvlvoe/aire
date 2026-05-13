'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DisclosurePreview, {
  type DisclosurePreviewBackgrounds,
  type DisclosurePreviewField,
} from '@/components/DisclosurePreview';
import Sidebar from '@/components/Sidebar';

type DisclosurePreviewResponse = {
  listingId: number;
  backgrounds: DisclosurePreviewBackgrounds;
  fields: DisclosurePreviewField[];
};

export default function DisclosureDocumentPreviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listingId = Number(params.id ?? '0');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<DisclosurePreviewBackgrounds>({ cover: null, content: null });
  const [fields, setFields] = useState<DisclosurePreviewField[]>([]);

  const loadPreview = useCallback(async () => {
    if (!Number.isInteger(listingId)) {
      setError('物件編號錯誤');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/disclosure-preview?listingId=${listingId}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '讀取預覽失敗');
      }
      const payload = (await response.json()) as DisclosurePreviewResponse;
      setBackgrounds(payload.backgrounds);
      setFields(payload.fields);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '讀取預覽失敗');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const handleSave = useCallback(async (fieldKey: string, value: string) => {
    const response = await fetch('/api/documents/disclosure-preview/save', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, fieldKey, value }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? '儲存失敗');
    }
    setFields((prev) => prev.map((field) => (
      field.fieldKey === fieldKey ? { ...field, value } : field
    )));
  }, [listingId]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="flex w-full">
        <Sidebar />
        {/* 預覽主區域：移除 max-w 限制與 p-8，讓說明書有完整展示空間 */}
        <main className="flex-1 p-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A6B]">不動產說明書預覽</h1>
              <p className="mt-1 text-sm text-slate-500">物件編號：#{listingId}</p>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => router.push(`/listings/${listingId}/documents`)}
            >
              返回文件列表
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
              <div className="h-[1123px] w-full max-w-[794px] animate-pulse rounded bg-slate-200" />
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <DisclosurePreview
              listingId={listingId}
              fields={fields}
              backgrounds={backgrounds}
              onSave={handleSave}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

