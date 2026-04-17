'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getPropertyType, PROPERTY_TYPES, type PropertyType } from '@/lib/property-types';

type ListingStatus =
  | 'pre-commission'
  | 'draft'
  | 'field-visit-complete'
  | 'ready-for-generation'
  | 'documents-ready';

type Listing = {
  id: number;
  property_type: PropertyType;
  status: ListingStatus;
  address?: string | null;
  pre_commission_data?: string | null;
};

type ListingResponse = {
  listing: Listing;
};

type StatusOption = {
  label: string;
  className: string;
};

type JsonRecord = Record<string, unknown>;

type LookupResponse = {
  lookup_data?: unknown;
  data?: unknown;
  result?: unknown;
  listing?: {
    lookup_data?: unknown;
  };
};

type ParsePasteResponse = {
  parsedData?: unknown;
  parsed_data?: unknown;
  data?: unknown;
  result?: unknown;
};

const statusOptions: Record<ListingStatus, StatusOption> = {
  'pre-commission': {
    label: '委託前置',
    className: 'bg-indigo-100 text-indigo-700',
  },
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

const parseJsonRecord = (rawData: string | null | undefined): JsonRecord | null => {
  if (!rawData) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as JsonRecord;
    }
    return null;
  } catch {
    return null;
  }
};

const getPayloadRecord = (rawData: unknown): JsonRecord | null => {
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    return rawData as JsonRecord;
  }
  return null;
};

const extractLookupData = (payload: LookupResponse): JsonRecord | null => {
  const candidates = [payload.lookup_data, payload.data, payload.result, payload.listing?.lookup_data];

  for (const candidate of candidates) {
    const record = getPayloadRecord(candidate);
    if (record) {
      return record;
    }
  }

  return null;
};

const extractParsedData = (payload: ParsePasteResponse): JsonRecord | null => {
  const candidates = [payload.parsedData, payload.parsed_data, payload.data, payload.result];

  for (const candidate of candidates) {
    const record = getPayloadRecord(candidate);
    if (record) {
      return record;
    }
  }

  return null;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return value.trim() === '' ? '-' : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

function KeyValueTable({ data }: { data: JsonRecord }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">目前沒有可顯示欄位。</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-slate-200 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">{key}</th>
              <td className="px-3 py-2 text-slate-700">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PreCommissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? '0');

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);

  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupData, setLookupData] = useState<JsonRecord | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [rawText, setRawText] = useState('');
  const [parseSubmitting, setParseSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<JsonRecord | null>(null);

  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(listingId)) {
      setListingError('物件編號錯誤');
      setLoadingListing(false);
      setLookupLoading(false);
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

        const message = caughtError instanceof Error ? caughtError.message : '讀取物件資料失敗，請稍後再試';
        setListingError(message);
      } finally {
        if (isMounted) {
          setLoadingListing(false);
        }
      }
    };

    const loadLookupData = async () => {
      setLookupLoading(true);
      setLookupError(null);

      try {
        const response = await fetch(`/api/pre-commission/${listingId}/lookup`);
        if (!response.ok) {
          throw new Error('公開資料查詢失敗');
        }

        const payload = (await response.json()) as LookupResponse;
        if (!isMounted) {
          return;
        }

        const resolvedData = extractLookupData(payload);
        setLookupData(resolvedData);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : '公開資料查詢失敗，請稍後再試';
        setLookupError(message);
        setLookupData(null);
      } finally {
        if (isMounted) {
          setLookupLoading(false);
        }
      }
    };

    void Promise.all([loadListing(), loadLookupData()]);

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  const propertyTypeLabel = useMemo(() => {
    if (!listing) {
      return '-';
    }

    return (
      getPropertyType(listing.property_type)?.displayName ?? PROPERTY_TYPES[listing.property_type]?.displayName ?? '-'
    );
  }, [listing]);

  const preCommissionData = useMemo(() => {
    return parseJsonRecord(listing?.pre_commission_data);
  }, [listing?.pre_commission_data]);

  const addressDisplay = useMemo(() => {
    const fromListing = listing?.address;
    if (typeof fromListing === 'string' && fromListing.trim() !== '') {
      return fromListing;
    }

    const fromPreCommission = preCommissionData?.address;
    if (typeof fromPreCommission === 'string' && fromPreCommission.trim() !== '') {
      return fromPreCommission;
    }

    return '地址尚未填寫';
  }, [listing?.address, preCommissionData]);

  const statusBadge = listing ? statusOptions[listing.status] : null;

  const ownerName = typeof preCommissionData?.owner_name === 'string' ? preCommissionData.owner_name : '-';
  const ownerPhone = typeof preCommissionData?.owner_phone === 'string' ? preCommissionData.owner_phone : '-';
  const parcelNumber = typeof preCommissionData?.parcel_number === 'string' ? preCommissionData.parcel_number : '-';

  const handleParsePaste = async () => {
    if (!rawText.trim()) {
      setParseError('請先貼上謄本內容');
      return;
    }

    setParseSubmitting(true);
    setParseError(null);

    try {
      const response = await fetch(`/api/pre-commission/${listingId}/parse-paste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '解析失敗，請稍後再試');
      }

      const payload = (await response.json()) as ParsePasteResponse;
      const nextParsedData = extractParsedData(payload);

      if (!nextParsedData) {
        throw new Error('解析成功，但回傳格式不正確');
      }

      setParsedData(nextParsedData);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '解析失敗，請稍後再試';
      setParseError(message);
    } finally {
      setParseSubmitting(false);
    }
  };

  const handleAdvanceToFieldVisit = async () => {
    if (!listing) {
      return;
    }

    setAdvanceSubmitting(true);
    setAdvanceError(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}/advance-to-field-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '狀態切換失敗，請稍後再試');
      }

      router.push(`/listings/${listing.id}/fill`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '狀態切換失敗，請稍後再試';
      setAdvanceError(message);
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">Pre-commission 詳情</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="rounded-full bg-white px-3 py-1">物件編號：#{listing?.id ?? '-'}</span>
                <span className="rounded-full bg-white px-3 py-1">地址：{addressDisplay}</span>
                <span className="rounded-full bg-white px-3 py-1">類型：{propertyTypeLabel}</span>
                {statusBadge && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                    狀態：{statusBadge.label}
                  </span>
                )}
              </div>
            </div>

            {loadingListing && <p className="py-6 text-sm text-slate-500">讀取中...</p>}

            {!loadingListing && listingError && (
              <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{listingError}</p>
            )}

            {!loadingListing && !listingError && (
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-[#1B3A6B]">屋主資料</h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">姓名</p>
                      <p className="mt-1 font-semibold text-slate-700">{ownerName || '-'}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">電話</p>
                      <p className="mt-1 font-semibold text-slate-700">{ownerPhone || '-'}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">地段地號</p>
                      <p className="mt-1 font-semibold text-slate-700">{parcelNumber || '-'}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-[#1B3A6B]">公開資料查詢</h2>

                  {lookupLoading && <p className="mt-3 text-sm text-slate-500">查詢中...</p>}

                  {!lookupLoading && lookupError && (
                    <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{lookupError}</p>
                  )}

                  {!lookupLoading && !lookupData && (
                    <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      資料查詢中或無公開資料，請使用手動貼入
                    </p>
                  )}

                  {!lookupLoading && lookupData && (
                    <div className="mt-3">
                      <KeyValueTable data={lookupData} />
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-[#1B3A6B]">手動貼入謄本</h2>
                  <textarea
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                    rows={8}
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                    placeholder="請將謄本全文貼入此處..."
                  />
                  <div className="mt-3 flex items-center justify-end gap-3">
                    {parseError && <span className="text-sm text-red-600">{parseError}</span>}
                    <button
                      type="button"
                      onClick={() => void handleParsePaste()}
                      disabled={parseSubmitting}
                      className="rounded-md bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17325B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {parseSubmitting ? '解析中...' : '解析並填入'}
                    </button>
                  </div>

                  {parsedData && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-slate-700">解析結果</p>
                      <KeyValueTable data={parsedData} />
                    </div>
                  )}
                </section>

                <div className="flex items-center justify-end gap-3">
                  {advanceError && <span className="text-sm text-red-600">{advanceError}</span>}
                  <button
                    type="button"
                    onClick={() => void handleAdvanceToFieldVisit()}
                    disabled={advanceSubmitting}
                    className="rounded-md bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17325B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {advanceSubmitting ? '處理中...' : '進入現場勘查 →'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
