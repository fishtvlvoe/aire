'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import FieldVisitForm, { type NavigationState, type FieldVisitFormHandle } from '@/components/forms/FieldVisitForm';
import Stepper from '@/components/Stepper';
import { PROPERTY_TYPES, type PropertyType } from '@/lib/property-types';

type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: ListingStatus;
  field_visit_data?: string | null;
};
import { getPropertyType } from '@/lib/property-types';

type ListingResponse = {
  listing: Listing;
};

type ListingStatusOption = {
  label: string;
  className: string;
};

const statusOptions: Record<ListingStatus, ListingStatusOption> = {
  draft: {
    label: '草稿',
    className: 'bg-slate-100 text-slate-700',
  },
  'field-visit-complete': {
    label: '場勘完成',
    className: 'bg-blue-100 text-blue-700',
  },
  'ready-for-generation': {
    label: '可產生文件',
    className: 'bg-yellow-100 text-yellow-700',
  },
  'documents-ready': {
    label: '文件已產出',
    className: 'bg-emerald-100 text-emerald-700',
  },
};

const parseFieldVisitData = (rawData: string | null): Record<string, unknown> | null => {
  if (!rawData) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const getAddressFromListing = (listing: Listing | null): string => {
  if (!listing) {
    return '-';
  }
  const fieldVisitData = parseFieldVisitData(listing.field_visit_data ?? null);
  const address = fieldVisitData?.address;
  if (typeof address === 'string' && address.trim() !== '') {
    return address;
  }
  return '地址尚未填寫';
};

export default function ListingFillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? '0');
  const formRef = useRef<FieldVisitFormHandle>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [highlightMissing, setHighlightMissing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const handleFormChange = useCallback((nextFormData: Record<string, unknown>, nextIsComplete: boolean) => {
    setFormData(nextFormData);
    setIsComplete(nextIsComplete);
  }, []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Number.isNaN(listingId)) {
      setLoadError('物件編號錯誤');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          throw new Error('讀取物件資料失敗');
        }
        const payload = (await response.json()) as ListingResponse;
        if (!isMounted) {
          return;
        }
        setListing(payload.listing);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }
        const message =
          caughtError instanceof Error ? caughtError.message : '讀取物件資料失敗，請稍後再試';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadListing();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  useEffect(() => {
    if (isComplete) {
      setBannerMessage(null);
      setHighlightMissing(false);
    }
  }, [isComplete]);

  const propertyType = listing?.property_type;

  const propertyTypeLabel = useMemo(() => {
    if (!propertyType) {
      return '-';
    }
    return getPropertyType(propertyType)?.displayName ?? PROPERTY_TYPES[propertyType].displayName;
  }, [propertyType]);

  const submitFieldVisit = async (isComplete: boolean) => {
    if (!listing) {
      return;
    }

    // 防呆：isComplete=true 但實際 navState 顯示未完成時，拒絕送出並高亮缺欄
    if (isComplete && navState && !navState.isComplete) {
      setBannerMessage('尚有必填欄位未完成，請檢查標紅欄位');
      setHighlightMissing(true);
      throw new Error('incomplete');
    }

    setSubmitting(true);
    setSubmitError(null);
    setHighlightMissing(false);

    try {
      const response = await fetch(`/api/listings/${listing.id}/field-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formData,
          isComplete,
        }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗，請稍後再試');
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '儲存失敗，請稍後再試';
      setSubmitError(message);
      throw caughtError;
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = listing ? statusOptions[listing.status] : null;
  const initialData = parseFieldVisitData(listing?.field_visit_data ?? null) ?? undefined;

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-4">
            <Stepper
              currentStep={2}
              listingId={listing?.id ?? null}
              listingStatus={(listing?.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' | undefined) ?? null}
            />
          </div>
          
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">資料填寫</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="rounded-full bg-white px-3 py-1">物件編號：#{listing?.id ?? '-'}</span>
                <span className="rounded-full bg-white px-3 py-1">物件地址：{getAddressFromListing(listing)}</span>
                <span className="rounded-full bg-white px-3 py-1">類型：{propertyTypeLabel}</span>
                {statusBadge && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                    狀態：{statusBadge.label}
                  </span>
                )}
              </div>
            </div>

            {bannerMessage && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {bannerMessage}
              </div>
            )}

            {loading && <p className="py-8 text-center text-sm text-slate-500">讀取中...</p>}

            {!loading && loadError && (
              <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
            )}

            {!loading && !loadError && propertyType && (
              <>
                <FieldVisitForm
                  key={listing?.id ?? 'pending'}
                  propertyType={propertyType}
                  onSave={handleFormChange}
                  initialData={initialData}
                  highlightMissing={highlightMissing}
                  listingId={listing?.id}
                  ref={formRef}
                  onNavigationStateChange={setNavState}
                />

                {navState && (
                  <div className='flex flex-col gap-3 pt-6 border-t mt-6'>
                    {navState.hasNextChapter ? (
                      <button
                        type='button'
                        onClick={() => formRef.current?.goToNextChapter()}
                        disabled={!navState.isCurrentChapterComplete || submitting}
                        className='px-6 py-3 bg-[#1B3A6B] text-white rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed'
                      >
                        下一章節
                      </button>
                    ) : (
                      <>
                        <div className='flex gap-3'>
                          <button
                            type='button'
                            onClick={async () => { await submitFieldVisit(true); router.push(`/listings/${listing.id}/supplementary`); }}
                            disabled={!navState.isComplete || submitting}
                            className='px-6 py-3 bg-[#1B3A6B] text-white rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed'
                          >
                            去秘書後補
                          </button>
                          <button
                            type='button'
                            onClick={async () => { await submitFieldVisit(true); router.push(`/listings/${listing.id}/generating`); }}
                            disabled={!navState.isComplete || submitting}
                            className='px-6 py-3 bg-emerald-600 text-white rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed'
                          >
                            直接產出文件
                          </button>
                        </div>
                        <p className='text-sm text-gray-500'>選「去秘書後補」讓秘書補齊法律/行情資料後產出完整文件；選「直接產出」立即產出，秘書欄位將留空。</p>
                      </>
                    )}

                    {!navState.isCurrentChapterComplete && navState.hasNextChapter && (
                      <p className='text-sm text-amber-600'>本章節還有必填未完成</p>
                    )}
                    {!navState.isComplete && !navState.hasNextChapter && (
                      <p className='text-sm text-amber-600'>還有必填欄位未完成，無法產出</p>
                    )}

                    <button
                      type='button'
                      onClick={async () => { await submitFieldVisit(false); router.push('/listings'); }}
                      disabled={submitting}
                      className='px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium disabled:cursor-not-allowed self-start'
                    >
                      暫存草稿
                    </button>

                    {submitError && (
                      <div className='text-sm text-red-600 mt-2'>
                        {submitError}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
