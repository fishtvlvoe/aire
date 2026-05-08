'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Stepper from '@/components/Stepper';

type DocumentKey = 'property_survey' | 'listing_591' | 'sales_dm' | 'social_posts' | 'disclosure_document';

// feature_flags 的 key 對應到頁面 DocumentKey 的對照表
// doc-flags API 使用的 key 與 GeneratedDocuments 的 key 名稱不同，需要手動對應
const DOC_FLAG_TO_DOCUMENT_KEY: Record<string, DocumentKey> = {
  inspection:   'property_survey',
  listing_591:  'listing_591',
  sales_dm:     'sales_dm',
  social_post:  'social_posts',
  disclosure:   'disclosure_document',
};

type ApiStatus = 'ready' | 'not-generated';
type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
type Listing = {
  id: number;
  status: ListingStatus;
};

type DocumentEntry = {
  status: ApiStatus;
  content?: string;
  pdfUrl?: string;
};

type DocumentsResponse = {
  documents: Record<DocumentKey, DocumentEntry>;
};

type RegenerateState = {
  loading: boolean;
  error: string | null;
};

type DocumentMeta = {
  key: DocumentKey;
  name: string;
};

const DOCUMENTS: DocumentMeta[] = [
  { key: 'property_survey', name: '物調表' },
  { key: 'listing_591', name: '591 PO 文' },
  { key: 'sales_dm', name: '銷售 DM' },
  { key: 'social_posts', name: '社群貼文' },
  { key: 'disclosure_document', name: '不動產說明書' },
];

const statusLabel: Record<ApiStatus, string> = {
  ready: '完成',
  'not-generated': '未產生',
};

const previewText = (content?: string): string => {
  if (!content) {
    return '尚未產生內容';
  }
  const trimmed = content.trim();
  if (trimmed.length <= 200) {
    return trimmed;
  }
  return `${trimmed.slice(0, 200)}...`;
};

export default function ListingDocumentsPage() {
  const params = useParams<{ id: string }>();
  const listingId = Number(params.id ?? '0');

  const [docs, setDocs] = useState<Record<DocumentKey, DocumentEntry> | null>(null);
  const [listing, setListing] = useState<{id: number, status: ListingStatus} | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 記錄從 feature_flags 讀取的啟用狀態，key 為 DocumentKey
  // 初始全部設為 true，待 API 回傳後以實際設定覆蓋
  const [enabledDocKeys, setEnabledDocKeys] = useState<Set<DocumentKey>>(
    new Set(['property_survey', 'listing_591', 'sales_dm', 'social_posts', 'disclosure_document'])
  );
  const [regenerateState, setRegenerateState] = useState<Record<DocumentKey, RegenerateState>>({
    property_survey: { loading: false, error: null },
    listing_591: { loading: false, error: null },
    sales_dm: { loading: false, error: null },
    social_posts: { loading: false, error: null },
    disclosure_document: { loading: false, error: null },
  });

  // 讀取 feature_flags，決定哪些文件類型要顯示
  const loadDocFlags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/doc-flags');
      if (!response.ok) {
        // 讀取失敗時保留預設值（全部顯示），不阻斷頁面載入
        return;
      }
      const flags = (await response.json()) as Record<string, boolean>;
      // 將 doc-flags API 的 key 轉換為 DocumentKey，篩出 enabled 的項目
      const enabledSet = new Set<DocumentKey>();
      for (const [flagKey, enabled] of Object.entries(flags)) {
        const docKey = DOC_FLAG_TO_DOCUMENT_KEY[flagKey];
        if (docKey && enabled) {
          enabledSet.add(docKey);
        }
      }
      setEnabledDocKeys(enabledSet);
    } catch {
      // 網路錯誤時靜默降級，保留預設值（全部顯示）
    }
  }, []);

  const loadListing = useCallback(async () => {
    if (Number.isNaN(listingId)) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`);
      if (!response.ok) {
        throw new Error('讀取物件資料失敗');
      }
      const payload = (await response.json()) as { listing: Listing };
      setListing({ id: payload.listing.id, status: payload.listing.status });
    } catch (caughtError) {
      console.error('載入物件資料失敗:', caughtError);
    }
  }, [listingId]);

  const loadDocuments = useCallback(async () => {
    if (Number.isNaN(listingId)) {
      setError('物件編號錯誤');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/documents`);
      if (!response.ok) {
        throw new Error('讀取文件失敗');
      }
      const payload = (await response.json()) as DocumentsResponse;
      setDocs(payload.documents);
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '讀取文件失敗';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadDocFlags();
    void loadListing();
    void loadDocuments();
  }, [loadDocFlags, loadListing, loadDocuments]);

  const handleRegenerate = async (documentType: DocumentKey) => {
    if (Number.isNaN(listingId)) {
      return;
    }

    setRegenerateState((prev) => ({
      ...prev,
      [documentType]: { loading: true, error: null },
    }));

    try {
      const response = await fetch(`/api/listings/${listingId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentType }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '重新產生失敗');
      }
      await loadDocuments();
      setRegenerateState((prev) => ({
        ...prev,
        [documentType]: { loading: false, error: null },
      }));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '重新產生失敗';
      setRegenerateState((prev) => ({
        ...prev,
        [documentType]: { loading: false, error: message },
      }));
    }
  };

  const handleRegenerateAll = async () => {
    if (!window.confirm('重新產生會覆蓋現有 5 份文件，確定？')) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text() || '重新產生失敗');
      // 重 fetch documents
      const r2 = await fetch(`/api/listings/${listingId}/documents`);
      if (r2.ok) {
        const payload = (await r2.json()) as DocumentsResponse;
        setDocs(payload.documents);
      }
    } catch (e) {
      alert('重新產生失敗：' + (e as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

  const cards = useMemo(() => {
    // 只顯示 feature_flags 中 enabled 的文件類型
    return DOCUMENTS
      .filter((meta) => enabledDocKeys.has(meta.key))
      .map((meta) => ({
        ...meta,
        entry: docs?.[meta.key] ?? { status: 'not-generated' as ApiStatus },
        regenerate: regenerateState[meta.key],
      }));
  }, [docs, regenerateState, enabledDocKeys]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-4">
            <Stepper 
              currentStep={4} 
              listingId={listingId || null} 
              listingStatus={(listing?.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' | undefined) ?? null} 
            />
          </div>
          
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <h1 className="text-2xl font-bold text-[#1B3A6B]">文件輸出</h1>
            <p className="mt-2 text-sm text-slate-600">物件編號：#{Number.isNaN(listingId) ? '-' : listingId}</p>

            <div className="mt-6 mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              若修改過現勘/補件欄位，請點『重新產生文件』讓內容反映最新輸入
            </div>

            <div className="mb-6 flex justify-end">
              <button 
                type="button" 
                onClick={handleRegenerateAll} 
                disabled={regenerating} 
                className="rounded-md bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {regenerating ? '產生中...' : '重新產生文件'}
              </button>
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">讀取中...</p>}
            {!loading && error && <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            {!loading && !error && (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <article
                    key={card.key}
                    className="flex min-h-60 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(45,49,66,0.06)]"
                  >
                    <header className="mb-3">
                      <h2 className="text-base font-semibold text-[#1B3A6B]">{card.name}</h2>
                      <p className="mt-1 text-xs text-slate-500">狀態：{statusLabel[card.entry.status]}</p>
                    </header>

                    <div className="flex-1 rounded-md bg-[#F9FAFB] p-3 text-sm text-slate-700">
                      {previewText(card.entry.content)}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {card.entry.content && (
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([card.entry.content ?? ''], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${card.key}-${listingId}.md`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="rounded-md border border-slate-400 px-3 py-1.5 text-sm font-semibold text-slate-600"
                        >
                          下載 .md
                        </button>
                      )}

                      {card.key === 'disclosure_document' && (
                        <a
                          href={card.entry.pdfUrl ?? `/api/listings/${listingId}/pdf?type=disclosure`}
                          className="rounded-md border border-[#F5882B] px-3 py-1.5 text-sm font-semibold text-[#F5882B]"
                        >
                          下載 PDF
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          void handleRegenerate(card.key);
                        }}
                        disabled={card.regenerate.loading}
                        className="rounded-md bg-[#1B3A6B] px-3 py-1.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {card.regenerate.loading ? '重新產生中...' : '重新產生'}
                      </button>
                    </div>

                    {card.regenerate.error && (
                      <p className="mt-2 text-xs text-red-600">{card.regenerate.error}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
