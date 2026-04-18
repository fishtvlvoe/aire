'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Stepper from '@/components/Stepper';

type DocumentKey = 'property_survey' | 'listing_591' | 'sales_dm' | 'social_posts' | 'disclosure_document';
type ApiDocumentStatus = 'ready' | 'not-generated';
type UiDocumentStatus = 'waiting' | 'in-progress' | 'done' | 'failed';

type DocumentsResponse = {
  documents: Record<DocumentKey, { status: ApiDocumentStatus }>;
};

type DocumentMeta = {
  key: DocumentKey;
  label: string;
};

const DOCUMENTS: DocumentMeta[] = [
  { key: 'property_survey', label: '物調表' },
  { key: 'listing_591', label: '591 PO 文' },
  { key: 'sales_dm', label: '銷售 DM' },
  { key: 'social_posts', label: '社群貼文' },
  { key: 'disclosure_document', label: '不動產說明書' },
];

const statusBadge: Record<UiDocumentStatus, { icon: string; text: string; className: string }> = {
  waiting: { icon: '⏳', text: '等待中', className: 'text-slate-500' },
  'in-progress': { icon: '🔄', text: '產生中', className: 'text-[#F5882B]' },
  done: { icon: '✅', text: '完成', className: 'text-emerald-600' },
  failed: { icon: '❌', text: '失敗', className: 'text-red-600' },
};

const POLL_INTERVAL_MS = 3000;

export default function ListingGeneratingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? '0');
  const generationStartedRef = useRef(false);

  const [listing, setListing] = useState<{id: number, status: string} | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<DocumentKey, UiDocumentStatus>>({
    property_survey: 'waiting',
    listing_591: 'waiting',
    sales_dm: 'waiting',
    social_posts: 'waiting',
    disclosure_document: 'waiting',
  });
  const [startError, setStartError] = useState<string | null>(null);

  const doneCount = useMemo(() => {
    return DOCUMENTS.filter((doc) => docStatuses[doc.key] === 'done').length;
  }, [docStatuses]);

  const allDone = doneCount === DOCUMENTS.length;
  const progress = Math.round((doneCount / DOCUMENTS.length) * 100);

  useEffect(() => {
    if (Number.isNaN(listingId)) {
      return;
    }

    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (response.ok) {
          const listingData = await response.json();
          setListing(listingData);
        }
      } catch (error) {
        console.error('Failed to fetch listing:', error);
      }
    };

    void fetchListing();
  }, [listingId]);

  useEffect(() => {
    if (Number.isNaN(listingId) || generationStartedRef.current) {
      return;
    }

    generationStartedRef.current = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let pollingStopped = false;

    const stopPolling = () => {
      pollingStopped = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    const pollDocuments = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}/documents`);
        if (!response.ok) {
          throw new Error('讀取文件狀態失敗');
        }
        const payload = (await response.json()) as DocumentsResponse;

        let everyDocumentReady = true;
        setDocStatuses((prev) => {
          const next = { ...prev };
          for (const doc of DOCUMENTS) {
            const apiStatus = payload.documents[doc.key]?.status;
            if (apiStatus === 'ready') {
              next[doc.key] = 'done';
            } else if (next[doc.key] !== 'failed') {
              next[doc.key] = generationStartedRef.current ? 'in-progress' : 'waiting';
              everyDocumentReady = false;
            }
          }
          return next;
        });

        if (everyDocumentReady) {
          stopPolling();
        }
      } catch {
        setDocStatuses((prev) => {
          const next = { ...prev };
          for (const doc of DOCUMENTS) {
            if (next[doc.key] !== 'done') {
              next[doc.key] = 'failed';
            }
          }
          return next;
        });
        stopPolling();
      }
    };

    const startGeneration = async () => {
      setDocStatuses({
        property_survey: 'in-progress',
        listing_591: 'in-progress',
        sales_dm: 'in-progress',
        social_posts: 'in-progress',
        disclosure_document: 'in-progress',
      });

      try {
        const response = await fetch(`/api/listings/${listingId}/generate`, {
          method: 'POST',
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? '啟動產生失敗');
        }

        await pollDocuments();
        if (!pollingStopped) {
          intervalId = setInterval(() => {
            void pollDocuments();
          }, POLL_INTERVAL_MS);
        }
      } catch (caughtError) {
        setStartError(caughtError instanceof Error ? caughtError.message : '啟動產生失敗');
        setDocStatuses((prev) => {
          const next = { ...prev };
          for (const doc of DOCUMENTS) {
            if (next[doc.key] !== 'done') {
              next[doc.key] = 'failed';
            }
          }
          return next;
        });
        stopPolling();
      }
    };

    void startGeneration();

    return () => {
      stopPolling();
    };
  }, [listingId]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-4">
            <Stepper currentStep={4} listingId={listing?.id ?? null} listingStatus={(listing?.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' | undefined) ?? null} />
          </div>
          
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <h1 className="text-2xl font-bold text-[#1B3A6B]">AI 文件產生中</h1>
            <p className="mt-2 text-sm text-slate-600">物件編號：#{Number.isNaN(listingId) ? '-' : listingId}</p>

            {startError && (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{startError}</p>
            )}

            <div className="mt-6 rounded-lg bg-[#F9FAFB] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">整體進度</span>
                <span>
                  已完成 {doneCount}/{DOCUMENTS.length}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-[#F5882B] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {DOCUMENTS.map((doc) => {
                const badge = statusBadge[docStatuses[doc.key]];
                return (
                  <div
                    key={doc.key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="font-semibold">{doc.label}</p>
                    <p className={`text-sm ${badge.className}`}>
                      <span className="mr-1">{badge.icon}</span>
                      {badge.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/listings/${listingId}/documents`)}
                  className="rounded-md bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17325B]"
                >
                  前往查看文件
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
