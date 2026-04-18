'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { PROPERTY_TYPES, type PropertyType } from '@/lib/property-types';
import { resolveListingHref, resolveListingActionLabel, resolveListingSecondaryAction } from '@/lib/listing-routes';

type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: ListingStatus;
  field_visit_data?: string | null;
  created_at?: string;
};
import { getPropertyType } from '@/lib/property-types';

type ListingResponse = {
  listings: Listing[];
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

const getAddressFromListing = (listing: Listing): string => {
  const fieldVisitData = parseFieldVisitData(listing.field_visit_data ?? null);
  const address = fieldVisitData?.address;
  if (typeof address === 'string' && address.trim() !== '') {
    return address;
  }
  return '地址尚未填寫';
};

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) {
    return '-';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('zh-TW');
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | PropertyType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');

  async function handleDelete(id: number) {
    if (!window.confirm('確定刪除此物件？此操作無法復原')) return  // Decision: 原生 window.confirm
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '刪除失敗')
      }
      setListings(prev => prev.filter(l => l.id !== id))  // Decision: 從 client state 移除
    } catch (e) {
      alert('刪除失敗：' + (e as Error).message)
    }
  }

  useEffect(() => {
    let isMounted = true;

    const loadListings = async () => {
      try {
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('讀取物件資料失敗');
        }
        const payload = (await response.json()) as ListingResponse;
        if (!isMounted) {
          return;
        }
        setListings(payload.listings);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }
        const message =
          caughtError instanceof Error ? caughtError.message : '讀取物件資料失敗，請稍後再試';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    return listings.filter((listing) => {
      const matchType = typeFilter === 'all' ? true : listing.property_type === typeFilter;
      const matchStatus = statusFilter === 'all' ? true : listing.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [listings, statusFilter, typeFilter]);

  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">物件列表</h1>

              <div className="flex flex-wrap gap-3">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'all' | PropertyType)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部類型</option>
                  {propertyTypeOptions.map((typeInfo) => (
                    <option key={typeInfo.id} value={typeInfo.id}>
                      {typeInfo.displayName}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | ListingStatus)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部狀態</option>
                  {(Object.keys(statusOptions) as ListingStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {statusOptions[status].label}
                    </option>
                  ))}
                </select>

                <Link
                  href="/listings/new"
                  className="rounded-md bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17325B]"
                >
                  新增物件
                </Link>
              </div>
            </div>

            {loading && <p className="py-8 text-center text-sm text-slate-500">讀取中...</p>}

            {!loading && error && <p className="py-8 text-center text-sm text-red-600">{error}</p>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-[#F9FAFB] text-left text-[#1B3A6B]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">物件編號</th>
                      <th className="px-4 py-3 font-semibold">物件地址</th>
                      <th className="px-4 py-3 font-semibold">物件類型</th>
                      <th className="px-4 py-3 font-semibold">狀態</th>
                      <th className="px-4 py-3 font-semibold">建立日期</th>
                      <th className="px-4 py-3 font-semibold">操作</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((listing) => {
                      const typeInfo = getPropertyType(listing.property_type);
                      const status = statusOptions[listing.status];

                      return (
                        <tr key={listing.id} className="bg-white">
                          <td className="px-4 py-3 font-medium">#{listing.id}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={resolveListingHref({
                                id: listing.id,
                                status: listing.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready',
                              })}
                              className="hover:text-[#1B3A6B] hover:underline"
                            >
                              {getAddressFromListing(listing)}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{typeInfo?.displayName ?? listing.property_type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(listing.created_at)}</td>
                          <td className="px-4 py-3">
                            <button type='button' onClick={() => handleDelete(listing.id)} aria-label='刪除物件' className='mr-2 text-slate-400 hover:text-red-600 inline-flex items-center'>
                              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-5 h-5'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                              </svg>
                            </button>
                            <Link
                              href={resolveListingHref({
                                id: listing.id,
                                status: listing.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready',
                              })}
                              className="rounded-md border border-[#1B3A6B] px-3 py-1.5 text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
                            >
                              {resolveListingActionLabel({
                                id: listing.id,
                                status: listing.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready',
                              })}
                            </Link>
                            {(() => {
                              const secondary = resolveListingSecondaryAction({ id: listing.id, status: listing.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' })
                              if (!secondary) return null
                              return (
                                <Link href={secondary.href} className='ml-2 rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-50'>
                                  {secondary.label}
                                </Link>
                              )
                            })()}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          目前沒有符合篩選條件的物件
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
